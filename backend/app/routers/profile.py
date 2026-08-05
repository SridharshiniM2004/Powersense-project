from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..deps import current_user, service_client

router = APIRouter(tags=["profile"])
class ProfileUpdate(BaseModel):
    name: str | None = None
    utilityProvider: str | None = None
    consumerNumber: str | None = None
    sanctionedLoadKw: float | None = None
    homeAreaSqFt: float | None = None
    occupants: int | None = None

def present(row):
    return {"id": row["id"], "name": row.get("full_name") or "PowerSense user", "email": row.get("email", ""), "role": row.get("role", "user"), "utilityProvider": row.get("utility_provider", ""), "consumerNumber": row.get("consumer_number", ""), "sanctionedLoadKw": row.get("sanctioned_load_kw", 0), "homeAreaSqFt": row.get("home_area_sqft", 0), "occupants": row.get("occupants", 0), "createdAt": row.get("created_at", "")}

@router.get("/auth/me")
def me(user=Depends(current_user)):
    db = service_client(); row = db.table("profiles").select("*").eq("id", user["id"]).maybe_single().execute().data
    if not row:
        meta = user["metadata"]; row = db.table("profiles").upsert({"id": user["id"], "email": user["email"], "full_name": meta.get("name", user["email"].split("@")[0])}).execute().data[0]
    return {"user": present(row)}

@router.put("/auth/profile")
def update(payload: ProfileUpdate, user=Depends(current_user)):
    fields = {"full_name": payload.name, "utility_provider": payload.utilityProvider, "consumer_number": payload.consumerNumber, "sanctioned_load_kw": payload.sanctionedLoadKw, "home_area_sqft": payload.homeAreaSqFt, "occupants": payload.occupants}
    fields = {k:v for k,v in fields.items() if v is not None}
    row = service_client().table("profiles").update(fields).eq("id", user["id"]).execute().data[0]
    return {"user": present(row)}
