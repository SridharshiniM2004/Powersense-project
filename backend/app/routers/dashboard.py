from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from ..deps import current_user, service_client

router = APIRouter(tags=["analytics"])

@router.get("/dashboard")
def dashboard(user=Depends(current_user)):
    """Dashboard payload built entirely from the authenticated user's persisted data."""
    try:
        db = service_client()
        bills = db.table("electricity_bills").select("id,billing_month,units_consumed_kwh,amount_due,created_at").eq("user_id", user["id"]).order("created_at").execute().data
        predictions = db.table("predictions").select("id,predicted_units,predicted_bill,created_at").eq("user_id", user["id"]).order("created_at", desc=True).limit(24).execute().data
        recommendations = db.table("recommendations").select("estimated_kwh_savings,estimated_monthly_savings,status").eq("user_id", user["id"]).execute().data
        monthly = [{"month": row.get("billing_month") or row["created_at"][:7], "units": float(row.get("units_consumed_kwh") or 0), "bill": float(row.get("amount_due") or 0)} for row in bills]
        seasons = defaultdict(lambda: {"units": 0.0, "bill": 0.0, "count": 0})
        for item in monthly:
            month = int(item["month"][5:7]) if len(item["month"]) >= 7 and item["month"][5:7].isdigit() else 0
            season = "Winter" if month in (12, 1, 2) else "Summer" if month in (3, 4, 5) else "Monsoon" if month in (6, 7, 8, 9) else "Autumn"
            seasons[season]["units"] += item["units"]; seasons[season]["bill"] += item["bill"]; seasons[season]["count"] += 1
        seasonal = [{"season": name, "averageUnits": round(value["units"] / value["count"], 2), "averageBill": round(value["bill"] / value["count"], 2)} for name, value in seasons.items()]
        current = monthly[-1] if monthly else None
        latest_prediction = predictions[0] if predictions else None
        savings_kwh = sum(float(row.get("estimated_kwh_savings") or 0) for row in recommendations if row.get("status") == "completed")
        savings_amount = sum(float(row.get("estimated_monthly_savings") or 0) for row in recommendations if row.get("status") == "completed")
        total_units = sum(item["units"] for item in monthly)
        return {"monthlyConsumption": monthly, "monthlyBills": monthly, "currentBill": current, "latestPrediction": latest_prediction, "currentVsPredicted": {"currentUnits": current["units"] if current else None, "currentBill": current["bill"] if current else None, "predictedUnits": float(latest_prediction["predicted_units"]) if latest_prediction else None, "predictedBill": float(latest_prediction["predicted_bill"]) if latest_prediction else None}, "seasonalTrends": seasonal, "predictionHistory": predictions, "metrics": {"totalUnits": total_units, "totalBill": sum(item["bill"] for item in monthly), "carbonKg": round(total_units * .82, 2), "energySavingsKwh": savings_kwh, "energySavingsAmount": savings_amount}}
    except Exception as exc:
        raise HTTPException(502, "Unable to load dashboard analytics") from exc
