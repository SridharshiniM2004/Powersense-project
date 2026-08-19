import re
from datetime import datetime
from pathlib import Path

import httpx
from fastapi import HTTPException

from .config import settings


def _find(pattern: str, text: str, default=""):
    # OCR tables commonly put a label on one line and a value on another. A
    # generic \s in a field pattern crosses that boundary and captures the
    # next label (for example, "Consumer Name" -> "Service Connection No.").
    match = re.search(pattern.replace(r"\s", r"[ \t]"), text, re.I | re.M)
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


def _clean_line(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _number_from_value(value: str) -> float:
    match = re.search(r"(?<!\d)(\d[\d,]*(?:\.\d+)?)", value)
    return float(match.group(1).replace(",", "")) if match else 0.0


def _normalize_date(value: str) -> str:
    value = value.strip()
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            pass
    return value


def _table_values(lines: list[str]) -> dict[str, str]:
    """Read both conventional label:value rows and OCR table label/value runs."""
    aliases = {
        "utilityProvider": ("utility provider", "electricity board", "distribution company", "discom", "provider"),
        "region": ("region",),
        "consumerName": ("consumer name", "customer name", "name of consumer"),
        "consumerNumber": ("consumer no", "consumer number", "account no", "account number", "service connection no", "service no"),
        "meterNumber": ("meter no", "meter number"),
        "billNumber": ("bill no", "bill number", "invoice no", "invoice number"),
        "billingMonth": ("billing month",),
        "billingPeriod": ("billing period", "period of supply", "consumption period"),
        "issueDate": ("bill issue date", "bill date", "issue date"),
        "dueDate": ("due date", "last date for payment"),
        "previousReading": ("previous reading", "old reading"),
        "currentReading": ("current reading", "present reading"),
        "unitsConsumedKwh": ("units consumed", "units consume", "energy consumed", "consumption"),
        "amountDue": ("total bill amount", "amount payable", "amount due", "net amount", "grand total", "total amount"),
        "tariffCategory": ("tariff category", "tariff", "category"),
        "connectionType": ("connection type",),
        "energyCharges": ("energy charges",),
        "fixedCharges": ("fixed charge", "fixed charges"),
        "taxesAndSurcharges": ("electricity tax", "tax", "taxes"),
        "paymentStatus": ("payment status", "status"),
    }
    normalized = [_clean_line(line) for line in lines]
    label_at: dict[int, str] = {}
    for index, line in enumerate(normalized):
        for field, names in aliases.items():
            if any(line == name or line.startswith(f"{name} ") for name in names):
                label_at[index] = field
                break
    values: dict[str, str] = {}
    for index, field in label_at.items():
        raw = lines[index]
        # A same-line label/value pair is the most reliable format.
        for alias in aliases[field]:
            match = re.match(rf"{re.escape(alias)}\s*[:\-]?\s*(.+)$", _clean_line(raw), re.I)
            if match and match.group(1).strip() and match.group(1).strip() != alias:
                values[field] = match.group(1).strip()
                break
    # Some PDFs OCR as a contiguous label column followed by a value column.
    # Pair the two columns by position only when a run has three or more labels.
    start = 0
    while start < len(lines):
        if start not in label_at:
            start += 1
            continue
        end = start
        while end + 1 in label_at:
            end += 1
        labels = [label_at[i] for i in range(start, end + 1)]
        if len(labels) >= 3:
            candidates = [lines[i] for i in range(end + 1, len(lines)) if i not in label_at]
            if len(candidates) >= len(labels):
                for field, value in zip(labels, candidates):
                    values.setdefault(field, value.strip())
        start = end + 1
    # PDF table extraction can also produce all labels in one column and all
    # values in another. Pair the full columns when their counts line up.
    ordered_labels = [label_at[i] for i in sorted(label_at)]
    ordered_values = [line.strip() for i, line in enumerate(lines) if i not in label_at and _clean_line(line) not in {"field", "sample value", "value"}]
    if len(ordered_labels) >= 3 and len(ordered_values) >= len(ordered_labels):
        for field, value in zip(ordered_labels, ordered_values):
            values.setdefault(field, value)
    return values


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
    table = _table_values(lines)
    confidence = 0.85 if lines else 0
    units = _number_from_value(table.get("unitsConsumedKwh", "")) or _first_number([
        r"(?:total\s*)?(?:units?\s*(?:consumed|used)?|consumption|energy\s*consumed|kwh)\s*(?:\([^)]*\))?\s*[:\-]?\s*([\d,.]+)",
        r"([\d,.]+)\s*(?:units?|kwh)\b",
    ], text)
    amount = _number_from_value(table.get("amountDue", "")) or _first_number([
        r"(?:net\s*)?(?:total\s*)?(?:amount\s*)?(?:due|payable|to\s*be\s*paid|bill\s*amount|current\s*charges|total\s*charges)\s*(?:\([^)]*\))?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,.]+)",
        r"(?:grand\s*total|total\s*amount)\s*(?:\([^)]*\))?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,.]+)",
    ], text)
    fields = {
        "utilityProvider": table.get("utilityProvider", "") or _first_text([r"(?:electricity\s*)?(?:board|distribution|utility|discom)\s*[:\-]?\s*([^\n]+)"], text),
        "consumerName": table.get("consumerName", "") or _first_text([r"(?:consumer|customer)\s*name\s*[:\-]?\s*([^\n]+)", r"name\s*of\s*(?:consumer|customer)\s*[:\-]?\s*([^\n]+)"], text),
        "consumerNumber": table.get("consumerNumber", "") or _first_text([r"(?:consumer|account|service|customer)\s*(?:no\.?|number|id)\s*[:\-]?\s*([^\n]+)"], text),
        "meterNumber": table.get("meterNumber", "") or _first_text([r"meter\s*(?:no\.?|number|id)\s*[:\-]?\s*([^\n]+)"], text),
        "billNumber": table.get("billNumber", "") or _first_text([r"(?:bill|invoice)\s*(?:no\.?|number)\s*[:\-]?\s*([^\n]+)"], text),
        "billingMonth": table.get("billingMonth", "") or table.get("billingPeriod", "") or _first_text([r"(?:billing\s*(?:month|period)|bill\s*period|period\s*of\s*supply|consumption\s*period)\s*[:\-]?\s*([^\n]+)"], text),
        "issueDate": _normalize_date(table.get("issueDate", "") or _first_text([r"(?:bill|issue|reading)\s*date\s*[:\-]?\s*([^\n]+)"], text)),
        "dueDate": _normalize_date(table.get("dueDate", "") or _first_text([r"(?:due\s*date|last\s*date\s*for\s*payment|pay\s*by)\s*[:\-]?\s*([^\n]+)"], text)),
        "previousReading": _number_from_value(table.get("previousReading", "")) or _first_number([r"(?:previous|old)\s*(?:meter\s*)?(?:reading)\s*[:\-]?\s*([\d,.]+)"], text),
        "currentReading": _number_from_value(table.get("currentReading", "")) or _first_number([r"(?:current|present|new)\s*(?:meter\s*)?(?:reading)\s*[:\-]?\s*([\d,.]+)"], text),
        "unitsConsumedKwh": units,
        "amountDue": amount,
        "tariffCategory": table.get("tariffCategory", "") or _first_text([r"(?:tariff|category)\s*[:\-]?\s*([^\n]+)"], text),
        "connectionType": table.get("connectionType", "") or _first_text([r"connection\s*type\s*[:\-]?\s*([^\n]+)"], text),
        "breakdown": {key: _number_from_value(table.get(key, "")) for key in ("energyCharges", "fixedCharges", "taxesAndSurcharges") if table.get(key)},
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
