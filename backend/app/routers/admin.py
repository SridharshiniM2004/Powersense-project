from fastapi import APIRouter, Depends
from ..deps import require_admin, service_client
router=APIRouter(tags=["admin"])
@router.get("/admin/users")
def users(_=Depends(require_admin)):
    return service_client().table("profiles").select("*").execute().data
@router.get("/admin/stats")
def stats(_=Depends(require_admin)):
    db=service_client(); users=db.table("profiles").select("id",count="exact").execute(); bills=db.table("electricity_bills").select("units_consumed_kwh",count="exact").execute()
    return {"totalUsers":users.count or 0,"totalBillsProcessed":bills.count or 0,"totalKwhAnalyzed":sum(x["units_consumed_kwh"] for x in bills.data),"totalSavingsGeneratedAmount":0,"ocrAccuracyPercent":0,"modelMaeKwh":0,"activeUsers24h":0,"monthlyTrend":[],"tariffDistribution":[],"recentActivity":[]}
