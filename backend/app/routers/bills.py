import os, tempfile, uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from ..deps import current_user, service_client
from ..config import settings
from ..ocr import extract

router = APIRouter(tags=["bills"])
class Bill(BaseModel):
    billNumber: str; consumerName: str; billingMonth: str; issueDate: str; dueDate: str
    unitsConsumedKwh: float; previousReading: float = 0; currentReading: float = 0
    sanctionedLoadKw: float = 0; powerFactor: float = 0; tariffCategory: str = "Residential"
    amountDue: float; breakdown: dict = {}; status: str = "pending"; ocrConfidence: float = 0

def present(b):
    return {"id":b["id"],"userId":b["user_id"],"billNumber":b.get("bill_number", ""),"consumerName":b.get("consumer_name", ""),"billingMonth":b.get("billing_month", ""),"issueDate":b.get("issue_date", ""),"dueDate":b.get("due_date", ""),"unitsConsumedKwh":b.get("units_consumed_kwh",0),"previousReading":b.get("previous_reading",0),"currentReading":b.get("current_reading",0),"sanctionedLoadKw":b.get("sanctioned_load_kw",0),"powerFactor":b.get("power_factor",0),"tariffCategory":b.get("tariff_category", ""),"amountDue":b.get("amount_due",0),"breakdown":b.get("breakdown",{}),"status":b.get("status","pending"),"fileUrl":b.get("file_url"),"ocrConfidence":b.get("ocr_confidence",0),"createdAt":b.get("created_at","")}

@router.get("/bills")
def list_bills(user=Depends(current_user)):
    rows=service_client().table("electricity_bills").select("*").eq("user_id",user["id"]).order("created_at",desc=True).execute().data
    return [present(x) for x in rows]

@router.post("/bills")
def create_bill(payload: Bill, user=Depends(current_user)):
    p=payload.model_dump(); row={"user_id":user["id"],"bill_number":p["billNumber"],"consumer_name":p["consumerName"],"billing_month":p["billingMonth"],"issue_date":p["issueDate"],"due_date":p["dueDate"],"units_consumed_kwh":p["unitsConsumedKwh"],"previous_reading":p["previousReading"],"current_reading":p["currentReading"],"sanctioned_load_kw":p["sanctionedLoadKw"],"power_factor":p["powerFactor"],"tariff_category":p["tariffCategory"],"amount_due":p["amountDue"],"breakdown":p["breakdown"],"status":p["status"],"ocr_confidence":p["ocrConfidence"]}
    return present(service_client().table("electricity_bills").insert(row).execute().data[0])

@router.delete("/bills/{bill_id}", status_code=204)
def delete_bill(bill_id: str, user=Depends(current_user)):
    service_client().table("electricity_bills").delete().eq("id",bill_id).eq("user_id",user["id"]).execute()

@router.post("/bill/upload-ocr")
async def upload_ocr(file: UploadFile = File(...), user=Depends(current_user)):
    if file.content_type not in {"image/jpeg","image/png","image/webp","application/pdf"}: raise HTTPException(415,"Upload a PNG, JPG, WEBP, or PDF bill.")
    contents=await file.read()
    if len(contents)>10*1024*1024: raise HTTPException(413,"Bill file must be 10 MB or smaller")
    suffix=os.path.splitext(file.filename or "bill.png")[1]; local=os.path.join(tempfile.gettempdir(),f"powersense-{uuid.uuid4()}{suffix}")
    try:
        open(local,"wb").write(contents); parsed=extract(local)
        object_path=f"{user['id']}/{uuid.uuid4()}{suffix}"; service_client().storage.from_(settings.supabase_bills_bucket).upload(object_path,contents,{"content-type":file.content_type})
        parsed["filePath"]=object_path; service_client().table("ocr_results").insert({"user_id":user["id"],"file_path":object_path,"result":parsed,"confidence":parsed["confidenceScore"]}).execute(); return parsed
    finally:
        if os.path.exists(local): os.remove(local)
