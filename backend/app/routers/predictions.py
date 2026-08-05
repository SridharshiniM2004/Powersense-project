from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from ..deps import current_user, service_client
from ..ml import predict

router = APIRouter(tags=["predictions"])

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
    tariffCategory: str
    avgTemperatureC: float

@router.post("/bill/predict")
def create_prediction(payload: PredictionInput, user=Depends(current_user)):
    data = payload.model_dump()
    units, amount = predict(data)
    previous = data["historyUnits"][-1]
    response = {"predictedUnitsKwh": round(units, 2), "predictedAmount": round(amount, 2), "confidenceLowerUnits": round(units * .88, 2), "confidenceUpperUnits": round(units * 1.12, 2), "confidenceLowerAmount": round(amount * .88, 2), "confidenceUpperAmount": round(amount * 1.12, 2), "monthOverMonthChangePercent": round((units - previous) / max(previous, 1) * 100, 1), "peakDemandKw": round(max(1, units / 150), 2), "co2EmissionsKg": round(units * .82, 2), "tierBreakdown": [], "keyCostDrivers": []}
    service_client().table("predictions").insert({"user_id": user["id"], "input": data, "predicted_units": units, "predicted_bill": amount, "result": response}).execute()
    return response
