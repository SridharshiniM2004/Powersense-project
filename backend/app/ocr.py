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


def _first_number(patterns: list[str], text: str) -> float:
    for pattern in patterns:
        value = _number(pattern, text)
        if value:
            return value
    return 0.0


def _first_text(patterns: list[str], text: str) -> str:
    for pattern in patterns:
        value = _find(pattern, text)
        if value:
            return value
    return ""


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
    units = _first_number([
        r"(?:total\s*)?(?:units?\s*(?:consumed|used)?|consumption|energy\s*consumed|kwh)\s*(?:\([^)]*\))?\s*[:\-]?\s*([\d,.]+)",
        r"([\d,.]+)\s*(?:units?|kwh)\b",
    ], text)
    amount = _first_number([
        r"(?:net\s*)?(?:total\s*)?(?:amount\s*)?(?:due|payable|to\s*be\s*paid|bill\s*amount|current\s*charges|total\s*charges)\s*(?:\([^)]*\))?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,.]+)",
        r"(?:grand\s*total|total\s*amount)\s*(?:\([^)]*\))?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,.]+)",
    ], text)
    fields = {
        "utilityProvider": _first_text([r"(?:electricity\s*)?(?:board|distribution|utility|discom)\s*[:\-]?\s*([^\n]+)"], text),
        "consumerName": _first_text([r"(?:consumer|customer)\s*name\s*[:\-]?\s*([^\n]+)", r"name\s*of\s*(?:consumer|customer)\s*[:\-]?\s*([^\n]+)"], text),
        "consumerNumber": _first_text([r"(?:consumer|account|service|customer)\s*(?:no\.?|number|id)\s*[:\-]?\s*([^\n]+)"], text),
        "meterNumber": _first_text([r"meter\s*(?:no\.?|number|id)\s*[:\-]?\s*([^\n]+)"], text),
        "billNumber": _first_text([r"(?:bill|invoice)\s*(?:no\.?|number)\s*[:\-]?\s*([^\n]+)"], text),
        "billingMonth": _first_text([r"(?:billing\s*(?:month|period)|bill\s*period|period\s*of\s*supply|consumption\s*period)\s*[:\-]?\s*([^\n]+)"], text),
        "issueDate": _first_text([r"(?:bill|issue|reading)\s*date\s*[:\-]?\s*([^\n]+)"], text),
        "dueDate": _first_text([r"(?:due\s*date|last\s*date\s*for\s*payment|pay\s*by)\s*[:\-]?\s*([^\n]+)"], text),
        "previousReading": _first_number([r"(?:previous|old)\s*(?:meter\s*)?(?:reading)\s*[:\-]?\s*([\d,.]+)"], text),
        "currentReading": _first_number([r"(?:current|present|new)\s*(?:meter\s*)?(?:reading)\s*[:\-]?\s*([\d,.]+)"], text),
        "unitsConsumedKwh": units,
        "amountDue": amount,
        "tariffCategory": _first_text([r"(?:tariff|category)\s*[:\-]?\s*([^\n]+)"], text),
        "connectionType": _first_text([r"connection\s*type\s*[:\-]?\s*([^\n]+)"], text),
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
    evidence = sum(bool(re.search(pattern, text, re.I)) for pattern in (
        r"\b(?:electricity|energy|kwh|units?|meter|tariff|discom|utility)\b",
        r"\b(?:bill|invoice|amount\s+(?:due|payable)|total\s+charges)\b",
        r"\b(?:consumer|account|service)\s*(?:no|number|id)\b",
    ))
    fields["isElectricityBill"] = evidence >= 2 and bool(lines)
    fields["identificationEvidence"] = evidence
    if not fields["isElectricityBill"]:
        fields["qualityWarnings"].append("This document does not contain enough electricity-bill evidence to process safely.")
    return fields
