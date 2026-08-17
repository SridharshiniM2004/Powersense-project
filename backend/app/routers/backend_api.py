"""Backend-only API surface for the existing PowerSense Supabase project.

No schema migration is performed here. Every query is scoped to the verified
Supabase Auth user, even though the server client has service-role access.
"""
import logging
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from ..config import settings
from ..deps import current_user, service_client
from ..ocr import extract
from ..ml import predict
from .chat import Message, message
from .profile import ProfileUpdate, me, update
from .dashboard import dashboard

logger = logging.getLogger(__name__)
router = APIRouter(tags=["backend integration"])

class PredictionInput(BaseModel):
    historyUnits: list[float] = Field(min_length=1, max_length=24)
    billingMonth: int = Field(ge=1, le=12)
    homeAreaSqFt: float = Field(gt=0)
    occupants: int = Field(gt=0)
    acCount: int = Field(ge=0)
    acAverageHoursDaily: float = Field(ge=0, le=24)
    hasEvCharger: bool = False
    hasSolarPanels: bool = False
    solarCapacityKw: float = Field(ge=0)
    hasWaterHeater: bool = False
    heavyHvacUsage: bool = False
    sanctionedLoadKw: float = Field(gt=0)
    tariffCategory: str = "Residential"
    avgTemperatureC: float

def _store_prediction(payload: dict, user_id: str, units: float, bill: float) -> dict:
    result = {"predicted_units": round(units, 2), "predicted_bill": round(bill, 2)}
    try:
        service_client().table("predictions").insert({"user_id": user_id, "input": payload, "predicted_units": units, "predicted_bill": bill, "result": result}).execute()
        return result
    except Exception as exc:
        logger.exception("Unable to persist prediction for user %s", user_id)
        raise HTTPException(502, "Prediction completed but could not be saved") from exc

def _automatic_prediction(db, user_id: str, extracted: dict) -> dict:
    """Builds inference input from the authenticated user's persisted bill/profile data."""
    profile = db.table("profiles").select("sanctioned_load_kw,home_area_sqft,occupants").eq("id", user_id).maybe_single().execute().data or {}
    history_rows = db.table("electricity_bills").select("units_consumed_kwh").eq("user_id", user_id).order("created_at", desc=True).limit(24).execute().data
    history = [float(row["units_consumed_kwh"] or 0) for row in reversed(history_rows) if row.get("units_consumed_kwh") is not None]
    if not history:
        history = [float(extracted.get("unitsConsumedKwh") or 0)]
    tariff_text = (extracted.get("tariffCategory") or extracted.get("connectionType") or "").lower()
    tariff = "Industrial" if "industrial" in tariff_text else "Commercial" if "commercial" in tariff_text else "Residential"
    now = datetime.now(timezone.utc)
    payload = {"historyUnits": history, "billingMonth": (now.month % 12) + 1, "homeAreaSqFt": float(profile.get("home_area_sqft") or 0), "occupants": int(profile.get("occupants") or 0), "acCount": 0, "acAverageHoursDaily": 0, "hasEvCharger": False, "hasSolarPanels": False, "solarCapacityKw": 0, "hasWaterHeater": False, "heavyHvacUsage": False, "sanctionedLoadKw": float(profile.get("sanctioned_load_kw") or 0), "tariffCategory": tariff, "avgTemperatureC": 0}
    units, bill = predict(payload)
    return _store_prediction(payload, user_id, units, bill)

@router.post("/predict-units")
def predict_units(payload: PredictionInput, user=Depends(current_user)):
    units, bill = predict(payload.model_dump())
    return _store_prediction(payload.model_dump(), user["id"], units, bill)

@router.post("/predict-bill")
def predict_bill(payload: PredictionInput, user=Depends(current_user)):
    units, bill = predict(payload.model_dump())
    return _store_prediction(payload.model_dump(), user["id"], units, bill)

@router.post("/upload-bill")
async def upload_bill(file: UploadFile = File(...), user=Depends(current_user)):
    if file.content_type not in {"application/pdf", "image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Supported file formats are PDF, JPG, JPEG, PNG, and WEBP")
    content = await file.read()
    if not content or len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "Bill file must be between 1 byte and 10 MB")
    suffix = Path(file.filename or "bill.png").suffix.lower() or ".png"
    local_path = Path(tempfile.gettempdir()) / f"powersense-{uuid.uuid4()}{suffix}"
    storage_path = f"{user['id']}/{uuid.uuid4()}{suffix}"
    try:
        local_path.write_bytes(content)
        parsed = extract(str(local_path))
        db = service_client()
        db.storage.from_(settings.supabase_bills_bucket).upload(storage_path, content, {"content-type": file.content_type, "upsert": "false"})
        ocr = db.table("ocr_results").insert({"user_id": user["id"], "file_path": storage_path, "result": parsed, "confidence": parsed["confidenceScore"]}).execute().data[0]
        bill = db.table("electricity_bills").insert({
            "user_id": user["id"],
            "bill_number": parsed.get("billNumber") or None,
            "consumer_name": parsed.get("consumerName") or None,
            "consumer_number": parsed.get("consumerNumber") or None,
            "meter_number": parsed.get("meterNumber") or None,
            "billing_month": parsed.get("billingMonth") or None,
            "units_consumed_kwh": parsed.get("unitsConsumedKwh", 0),
            "amount_due": parsed.get("amountDue", 0),
            "tariff_category": parsed.get("tariffCategory") or None,
            "connection_type": parsed.get("connectionType") or None,
            "file_url": storage_path,
            "ocr_confidence": parsed["confidenceScore"],
            "breakdown": {},
        }).execute().data[0]
        try:
            prediction = _automatic_prediction(db, user["id"], parsed)
            automation = {"status": "completed", "prediction": prediction}
        except HTTPException as exc:
            logger.exception("Automated prediction failed after successful OCR for bill %s", bill["id"])
            automation = {"status": "prediction_failed", "message": exc.detail}
        return {"bill_id": bill["id"], "ocr_id": ocr["id"], "file_path": storage_path, "ocr": parsed, "automation": automation, "dashboard_refresh_required": True}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Bill upload failed for user %s", user["id"])
        try:
            service_client().storage.from_(settings.supabase_bills_bucket).remove([storage_path])
        except Exception:
            logger.warning("Unable to roll back storage object %s", storage_path)
        raise HTTPException(502, "Unable to upload and process the bill") from exc
    finally:
        local_path.unlink(missing_ok=True)

@router.post("/chat")
async def chat(payload: Message, user=Depends(current_user)):
    return await message(payload, user)

@router.get("/dashboard")
def get_dashboard(user=Depends(current_user)):
    return dashboard(user)

@router.get("/history")
def history(user=Depends(current_user)):
    try:
        db = service_client()
        bills = db.table("electricity_bills").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute().data
        ocr = db.table("ocr_results").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute().data
        predictions = db.table("predictions").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute().data
        return {"bills": bills, "ocr": ocr, "predictions": predictions}
    except Exception as exc:
        logger.exception("Unable to read history for user %s", user["id"])
        raise HTTPException(502, "Unable to read history") from exc

@router.get("/profile")
def get_profile(user=Depends(current_user)):
    return me(user)

@router.put("/profile")
def put_profile(payload: ProfileUpdate, user=Depends(current_user)):
    return update(payload, user)

@router.delete("/bill")
def remove_bill(bill_id: str = Query(..., min_length=1), user=Depends(current_user)):
    try:
        db = service_client()
        bill = db.table("electricity_bills").select("id,file_url").eq("id", bill_id).eq("user_id", user["id"]).maybe_single().execute().data
        if not bill:
            raise HTTPException(404, "Bill not found")
        db.table("electricity_bills").delete().eq("id", bill_id).eq("user_id", user["id"]).execute()
        if bill.get("file_url"):
            db.storage.from_(settings.supabase_bills_bucket).remove([bill["file_url"]])
        return {"deleted": True, "id": bill_id}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unable to delete bill %s", bill_id)
        raise HTTPException(502, "Unable to delete bill") from exc

@router.get("/bill/{bill_id}/download-url")
def bill_download_url(bill_id: str, user=Depends(current_user)):
    """Creates a short-lived URL only after ownership has been verified."""
    try:
        db = service_client()
        bill = db.table("electricity_bills").select("file_url").eq("id", bill_id).eq("user_id", user["id"]).maybe_single().execute().data
        if not bill:
            raise HTTPException(404, "Bill not found")
        if not bill.get("file_url"):
            raise HTTPException(404, "No file is associated with this bill")
        signed = db.storage.from_(settings.supabase_bills_bucket).create_signed_url(bill["file_url"], 300)
        return {"url": signed.get("signedURL") or signed.get("signedUrl"), "expires_in_seconds": 300}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unable to create signed URL for bill %s", bill_id)
        raise HTTPException(502, "Unable to create secure download URL") from exc
