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
from .chat import Message, message, personalized_recommendations
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

def _store_prediction(payload: dict, user_id: str, units: float, bill: float, analysis: dict | None = None, bill_id: str | None = None) -> dict:
    result = {"predicted_units": round(units, 2), "predicted_bill": round(bill, 2), **(analysis or {})}
    try:
        service_client().table("predictions").insert({"user_id": user_id, "bill_id": bill_id, "input": payload, "predicted_units": units, "predicted_bill": bill, "result": result}).execute()
        return result
    except Exception as exc:
        logger.exception("Unable to persist prediction for user %s", user_id)
        raise HTTPException(502, "Prediction completed but could not be saved") from exc

def _automatic_prediction(db, user_id: str, extracted: dict, bill_id: str) -> tuple[dict, dict]:
    """Builds inference input from the authenticated user's persisted bill/profile data."""
    profile = db.table("profiles").select("sanctioned_load_kw,home_area_sqft,occupants").eq("id", user_id).maybe_single().execute().data or {}
    history_rows = db.table("electricity_bills").select("units_consumed_kwh").eq("user_id", user_id).order("created_at", desc=True).limit(24).execute().data
    history = [float(row["units_consumed_kwh"] or 0) for row in reversed(history_rows) if row.get("units_consumed_kwh") is not None]
    current_units = extracted.get("unitsConsumedKwh")
    current_bill = extracted.get("amountDue")
    missing = []
    if not current_units:
        missing.append("units consumed")
    for key, label in (("home_area_sqft", "home area"), ("occupants", "occupants"), ("sanctioned_load_kw", "sanctioned load")):
        if not profile.get(key):
            missing.append(label)
    if missing:
        raise HTTPException(422, f"Trained-model prediction requires {'; '.join(missing)}. No prediction was generated.")
    if not history:
        history = [float(current_units)]
    tariff_text = (extracted.get("tariffCategory") or extracted.get("connectionType") or "").lower()
    tariff = "Industrial" if "industrial" in tariff_text else "Commercial" if "commercial" in tariff_text else "Residential"
    now = datetime.now(timezone.utc)
    payload = {"sourceBillId": bill_id, "historyUnits": history, "billingMonth": (now.month % 12) + 1, "homeAreaSqFt": float(profile["home_area_sqft"]), "occupants": int(profile["occupants"]), "acCount": 0, "acAverageHoursDaily": 0, "hasEvCharger": False, "hasSolarPanels": False, "solarCapacityKw": 0, "hasWaterHeater": False, "heavyHvacUsage": False, "sanctionedLoadKw": float(profile["sanctioned_load_kw"]), "tariffCategory": tariff, "avgTemperatureC": 0}
    units, bill = predict(payload)
    current_units = float(current_units)
    current_bill = float(current_bill or 0)
    previous = history[:-1]
    anomaly = None
    if len(previous) >= 2:
        average = sum(previous) / len(previous)
        if average > 0:
            change_percent = round(((current_units - average) / average) * 100, 1)
            if abs(change_percent) >= 20:
                anomaly = {"detected": True, "changePercent": change_percent, "baselineUnits": round(average, 2), "message": f"Current consumption is {abs(change_percent)}% {'above' if change_percent > 0 else 'below'} your previous average."}
    analysis = {
        "carbonKg": round(current_units * 0.82, 2),
        "estimatedSavingsAmount": round(max(0, current_bill - bill), 2),
        "estimatedSavingsKwh": round(max(0, current_units - units), 2),
        "anomaly": anomaly or {"detected": False},
    }
    return _store_prediction(payload, user_id, units, bill, analysis, bill_id), {**analysis, "currentUnits": current_units, "currentBill": current_bill, "historyUnits": history}

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
        if not parsed.get("isElectricityBill"):
            raise HTTPException(422, "The uploaded document could not be identified as an electricity bill.")
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
            "units_consumed_kwh": parsed.get("unitsConsumedKwh") or None,
            "amount_due": parsed.get("amountDue") or None,
            "tariff_category": parsed.get("tariffCategory") or None,
            "connection_type": parsed.get("connectionType") or None,
            "file_url": storage_path,
            "ocr_confidence": parsed["confidenceScore"],
            "breakdown": {},
        }).execute().data[0]
        db.table("profiles").update({"active_bill_id": bill["id"]}).eq("id", user["id"]).execute()
        try:
            prediction, analysis_context = _automatic_prediction(db, user["id"], parsed, bill["id"])
            recommendation_warning = None
            try:
                generated = await personalized_recommendations({**analysis_context, "predictedUnits": prediction["predicted_units"], "predictedBill": prediction["predicted_bill"]})
                for item in generated:
                    db.table("recommendations").insert({
                        "user_id": user["id"], "bill_id": bill["id"], "title": str(item["title"]), "category": str(item.get("category") or "Behavioral Shifting"),
                        "description": str(item["description"]), "estimated_monthly_savings": float(item.get("estimatedMonthlySavings") or 0),
                        "estimated_kwh_savings": float(item.get("estimatedKwhSavings") or 0), "implementation_cost": str(item.get("implementationCost") or ""),
                        "payback_months": float(item.get("paybackMonths") or 0), "impact_level": str(item.get("impactLevel") or "Low"),
                    }).execute()
            except HTTPException as exc:
                logger.warning("Recommendation generation failed after bill %s: %s", bill["id"], exc.detail)
                recommendation_warning = exc.detail
            except Exception:
                logger.exception("Unable to persist recommendations for bill %s", bill["id"])
                recommendation_warning = "Recommendations could not be saved."
            automation = {"status": "completed", "prediction": prediction, "analysis": analysis_context, "recommendation_warning": recommendation_warning}
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

@router.get("/bills/{bill_id}/analysis")
def bill_analysis(bill_id: str, user=Depends(current_user)):
    """Returns only the analysis associated with one verified bill selection."""
    try:
        db = service_client()
        bill = db.table("electricity_bills").select("*").eq("id", bill_id).eq("user_id", user["id"]).maybe_single().execute().data
        if not bill:
            raise HTTPException(404, "Bill not found")
        ocr = db.table("ocr_results").select("*").eq("user_id", user["id"]).eq("file_path", bill.get("file_url") or "").order("created_at", desc=True).limit(1).execute().data
        prediction = db.table("predictions").select("*").eq("user_id", user["id"]).eq("bill_id", bill_id).order("created_at", desc=True).limit(1).execute().data
        recommendations = db.table("recommendations").select("*").eq("user_id", user["id"]).eq("bill_id", bill_id).order("created_at", desc=True).execute().data
        analysis_state = None
        if not prediction:
            analysis_state = "No trained-model prediction is stored for this bill. Add home area, occupants, and sanctioned load in Profile, then upload or reprocess the bill."
        elif not recommendations:
            analysis_state = "Prediction is available, but no recommendations were saved. Check the existing OpenRouter configuration and retry processing this bill."
        return {"bill": bill, "ocr": ocr[0] if ocr else None, "prediction": prediction[0] if prediction else None, "recommendations": recommendations, "analysis_state": analysis_state}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unable to load analysis for bill %s", bill_id)
        raise HTTPException(502, "Unable to load this bill's analysis") from exc

@router.put("/bills/{bill_id}/active")
def set_active_bill(bill_id: str, user=Depends(current_user)):
    db = service_client()
    bill = db.table("electricity_bills").select("id").eq("id", bill_id).eq("user_id", user["id"]).maybe_single().execute().data
    if not bill:
        raise HTTPException(404, "Bill not found")
    db.table("profiles").update({"active_bill_id": bill_id}).eq("id", user["id"]).execute()
    return {"active_bill_id": bill_id}

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
