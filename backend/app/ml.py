from functools import lru_cache
from fastapi import HTTPException
from .config import settings


FEATURE_ORDER = ["history_mean", "history_last", "billing_month", "home_area_sqft", "occupants", "ac_count", "ac_hours", "has_ev", "has_solar", "solar_kw", "has_water_heater", "heavy_hvac", "sanctioned_load_kw", "tariff_code", "temperature_c"]


def _estimator(artifact, label: str):
    """Extract the trained estimator when joblib stores it with metadata."""
    if hasattr(artifact, "predict"):
        return artifact
    if isinstance(artifact, dict):
        for key in ("model", "pipeline", "estimator", "regressor", f"{label}_model"):
            candidate = artifact.get(key)
            if hasattr(candidate, "predict"):
                return candidate
        for candidate in artifact.values():
            if hasattr(candidate, "predict"):
                return candidate
    raise HTTPException(status_code=503, detail=f"The {label} model file loaded, but no trained estimator was found inside it.")


@lru_cache
def models():
    try:
        import joblib

        return (
            _estimator(joblib.load(settings.units_model_path), "units"),
            _estimator(joblib.load(settings.bill_model_path), "bill"),
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Prediction models are unavailable. Expected units model at {settings.units_model_path} and bill model at {settings.bill_model_path}.") from exc


def load_models_at_startup() -> None:
    """Fail fast when either user-provided trained model is unavailable."""
    models()


def feature_vector(payload: dict) -> list[float]:
    """Canonical inference vector. Sklearn Pipeline models retain their training preprocessing."""
    history = payload["historyUnits"]
    return [sum(history) / len(history), history[-1], payload["billingMonth"], payload["homeAreaSqFt"], payload["occupants"], payload["acCount"], payload["acAverageHoursDaily"], int(payload["hasEvCharger"]), int(payload["hasSolarPanels"]), payload["solarCapacityKw"], int(payload["hasWaterHeater"]), int(payload["heavyHvacUsage"]), payload["sanctionedLoadKw"], {"Residential": 0, "Commercial": 1, "Industrial": 2}[payload["tariffCategory"]], payload["avgTemperatureC"]]


def predict(payload: dict) -> tuple[float, float]:
    try:
        import numpy as np
        units_model, bill_model = models()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Prediction models are unavailable; no estimated result was generated.") from exc

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
