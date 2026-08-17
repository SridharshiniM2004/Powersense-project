import re
from pathlib import Path

import httpx
from fastapi import HTTPException

from .config import settings


def _find(pattern: str, text: str, default=""):
    match = re.search(pattern, text, re.I | re.M)
    return match.group(1).strip() if match else default


def _number(pattern: str, text: str) -> float:
    try:
        return float(_find(pattern, text, "0").replace(",", ""))
    except ValueError:
        return 0.0


def _error_message(payload: dict) -> str:
    message = payload.get("ErrorMessage") or payload.get("ErrorDetails") or "Online OCR failed"
    if isinstance(message, list):
        return "; ".join(str(item) for item in message)
    return str(message)


def extract(path: str) -> dict:
    """Extract bill text with OCR.space so the backend stays small enough for free hosting."""
    source = Path(path)
    if not settings.ocr_space_api_key:
        raise HTTPException(503, "OCR is not configured. Add OCR_SPACE_API_KEY in your deployment environment.")

    try:
        with source.open("rb") as file_obj:
            response = httpx.post(
                settings.ocr_space_endpoint,
                data={
                    "apikey": settings.ocr_space_api_key,
                    "language": "eng",
                    "isOverlayRequired": "false",
                    "detectOrientation": "true",
                    "scale": "true",
                    "OCREngine": str(settings.ocr_space_engine),
                },
                files={"file": (source.name, file_obj)},
                timeout=90,
            )
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(502, "Online OCR service could not process the bill right now") from exc
    except ValueError as exc:
        raise HTTPException(502, "Online OCR service returned an invalid response") from exc

    if payload.get("IsErroredOnProcessing"):
        raise HTTPException(422, _error_message(payload))

    parsed_results = payload.get("ParsedResults") or []
    text = "\n".join((item.get("ParsedText") or "").strip() for item in parsed_results).strip()
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    confidence = 0.85 if lines else 0
    units = _number(r"(?:units?|consumption|kwh)\s*[:\-]?\s*([\d,.]+)", text)
    amount = _number(r"(?:amount\s*(?:due|payable)|total)\s*[:\-]?\s*(?:rs\.?|inr)?\s*([\d,.]+)", text)
    fields = {
        "consumerName": _find(r"(?:consumer|customer)\s*name\s*[:\-]?\s*([^\n]+)", text),
        "consumerNumber": _find(r"(?:consumer|account)\s*(?:no|number|id)\s*[:\-]?\s*([^\n]+)", text),
        "meterNumber": _find(r"meter\s*(?:no|number)\s*[:\-]?\s*([^\n]+)", text),
        "billNumber": _find(r"(?:bill|invoice)\s*(?:no|number)\s*[:\-]?\s*([^\n]+)", text),
        "billingMonth": _find(r"billing\s*(?:month|period)\s*[:\-]?\s*([^\n]+)", text),
        "billingDate": _find(r"(?:bill|issue)\s*date\s*[:\-]?\s*([^\n]+)", text),
        "dueDate": _find(r"due\s*date\s*[:\-]?\s*([^\n]+)", text),
        "unitsConsumedKwh": units,
        "amountDue": amount,
        "tariffCategory": _find(r"tariff\s*[:\-]?\s*([^\n]+)", text),
        "connectionType": _find(r"connection\s*type\s*[:\-]?\s*([^\n]+)", text),
    }
    fields.update(
        {
            "confidenceScore": confidence,
            "detectedFieldsCount": sum(
                bool(value)
                for key, value in fields.items()
                if key not in {"unitsConsumedKwh", "amountDue"}
            )
            + int(units > 0)
            + int(amount > 0),
            "qualityWarnings": (
                ["No OCR text was detected. Upload a sharp, front-facing bill image."]
                if not lines
                else []
            ),
            "rawTextSnippets": lines,
        }
    )
    return fields
