from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..deps import current_user, service_client

router=APIRouter(tags=["engagement"])
@router.get("/recommendations")
def recommendations(user=Depends(current_user)):
    db=service_client(); rows=db.table("recommendations").select("*").eq("user_id",user["id"]).order("created_at",desc=True).execute().data
    return [{"id":x["id"],"title":x["title"],"category":x.get("category","Behavioral Shifting"),"description":x.get("description",""),"estimatedMonthlySavings":x.get("estimated_monthly_savings",0),"estimatedKwhSavings":x.get("estimated_kwh_savings",0),"implementationCost":x.get("implementation_cost", ""),"paybackMonths":x.get("payback_months",0),"impactLevel":x.get("impact_level","Low"),"status":x.get("status","new")} for x in rows]

class Status(BaseModel): status: str
@router.put("/recommendations/{item_id}")
def update_recommendation(item_id:str,payload:Status,user=Depends(current_user)):
    return service_client().table("recommendations").update({"status":payload.status}).eq("id",item_id).eq("user_id",user["id"]).execute().data[0]

@router.get("/settings")
def get_settings(user=Depends(current_user)):
    db=service_client(); row=db.table("user_settings").select("*").eq("user_id",user["id"]).maybe_single().execute().data
    if not row: row=db.table("user_settings").insert({"user_id":user["id"]}).execute().data[0]
    return {"currency":row["currency"],"currencySymbol":"₹" if row["currency"]=="INR" else "$","unitType":row["unit_type"],"alertThresholdPercent":row["alert_threshold_percent"],"emailNotifications":row["email_notifications"],"smsNotifications":row["sms_notifications"],"highBillAlerts":row["high_bill_alerts"],"weeklySummary":row["weekly_summary"],"aiChatModel":"OpenRouter"}
