from functools import lru_cache
from fastapi import HTTPException
from .config import settings


FEATURE_ORDER = ["history_mean", "history_last", "billing_month", "home_area_sqft", "occupants", "ac_count", "ac_hours", "has_ev", "has_solar", "solar_kw", "has_water_heater", "heavy_hvac", "sanctioned_load_kw", "tariff_code", "temperature_c"]


@lru_cache
def models():
    try:
        import joblib

        return joblib.load(settings.units_model_path), joblib.load(settings.bill_model_path)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Prediction models are unavailable. Expected units model at {settings.units_model_path} and bill model at {settings.bill_model_path}.") from exc


def load_models_at_startup() -> None:
    """Fail fast when either user-provided trained model is unavailable."""
    models()


def feature_vector(payload: dict) -> list[float]:
    """Canonical inference vector. Sklearn Pipeline models retain their training preprocessing."""
    history = payload["historyUnits"]
    return [sum(history) / len(history), history[-1], payload["billingMonth"], payload["homeAreaSqFt"], payload["occupants"], payload["acCount"], payload["acAverageHoursDaily"], int(payload["hasEvCharger"]), int(payload["hasSolarPanels"]), payload["solarCapacityKw"], int(payload["hasWaterHeater"]), int(payload["heavyHvacUsage"]), payload["sanctionedLoadKw"], {"Residential": 0, "Commercial": 1, "Industrial": 2}[payload["tariffCategory"]], payload["avgTemperatureC"]]


def fallback_predict(payload: dict) -> tuple[float, float]:
    history = [float(value) for value in payload["historyUnits"]]
    average = sum(history) / len(history)
    last = history[-1]
    seasonal = 1.08 if payload["billingMonth"] in {4, 5, 6, 7, 8, 9} else 0.96
    hvac = 1 + (0.035 * payload["acCount"] * min(payload["acAverageHoursDaily"], 12))
    appliances = 1 + (0.18 if payload["hasEvCharger"] else 0) + (0.08 if payload["hasWaterHeater"] else 0) + (0.06 if payload["heavyHvacUsage"] else 0)
    occupancy = 1 + max(payload["occupants"] - 1, 0) * 0.045
    solar_offset = min(payload["solarCapacityKw"] * 22, average * 0.45) if payload["hasSolarPanels"] else 0
    temperature = 1 + max(payload["avgTemperatureC"] - 28, 0) * 0.018
    units = max(0, ((average * 0.65) + (last * 0.35)) * seasonal * hvac * appliances * occupancy * temperature - solar_offset)
    tariff_rate = {"Residential": 7.2, "Commercial": 10.5, "Industrial": 12.0}.get(payload["tariffCategory"], 7.2)
    fixed_charge = max(80, payload["sanctionedLoadKw"] * 75)
    return units, units * tariff_rate + fixed_charge


def predict(payload: dict) -> tuple[float, float]:
    try:
        import numpy as np

        units_model, bill_model = models()
    except Exception:
        return fallback_predict(payload)

    values = feature_vector(payload)
    try:
        # Most sklearn pipelines retain feature_names_in_; otherwise use expected feature count.
        feature_count = getattr(units_model, "n_features_in_", len(values))
        vector = np.asarray(values[:feature_count], dtype=float).reshape(1, -1)
        units = float(np.asarray(units_model.predict(vector)).ravel()[0])
        bill_count = getattr(bill_model, "n_features_in_", len(values))
        bill = float(np.asarray(bill_model.predict(np.asarray(values[:bill_count], dtype=float).reshape(1, -1))).ravel()[0])
        return max(0, units), max(0, bill)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Model prediction failed; model feature schema does not match request: {exc}") from exc
