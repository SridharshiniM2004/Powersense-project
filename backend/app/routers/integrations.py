from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from ..deps import current_user, service_client
from ..ml import predict
from .chat import message, Message

router = APIRouter(tags=["integrations"])

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

def save_prediction(payload: dict, user_id: str, units: float, bill: float):
    result = {"predicted_units": round(units, 2), "predicted_bill": round(bill, 2)}
    service_client().table("predictions").insert({"user_id": user_id, "input": payload, "predicted_units": units, "predicted_bill": bill, "result": result}).execute()
    return result

@router.post("/predict-units")
def predict_units(payload: PredictionInput, user=Depends(current_user)):
    units, bill = predict(payload.model_dump())
    return save_prediction(payload.model_dump(), user["id"], units, bill)

@router.post("/predict-bill")
def predict_bill(payload: PredictionInput, user=Depends(current_user)):
    units, bill = predict(payload.model_dump())
    return save_prediction(payload.model_dump(), user["id"], units, bill)

@router.post("/chat")
async def chat(payload: Message, user=Depends(current_user)):
    return await message(payload, user)
