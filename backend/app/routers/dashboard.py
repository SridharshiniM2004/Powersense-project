from fastapi import APIRouter, Depends
from ..deps import current_user, service_client

router=APIRouter(tags=["analytics"])
@router.get("/dashboard")
def dashboard(user=Depends(current_user)):
    db=service_client(); bills=db.table("electricity_bills").select("billing_month,units_consumed_kwh,amount_due").eq("user_id",user["id"]).order("billing_month").execute().data
    predictions=db.table("predictions").select("predicted_units,predicted_bill,created_at").eq("user_id",user["id"]).order("created_at",desc=True).limit(12).execute().data
    total_units=sum(x["units_consumed_kwh"] for x in bills); total_bill=sum(x["amount_due"] for x in bills)
    return {"monthly":bills,"predictionHistory":predictions,"metrics":{"totalUnits":total_units,"totalBill":total_bill,"carbonKg":round(total_units*.82,2),"energySavingsKwh":0}}
