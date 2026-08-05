import re
import tempfile
from functools import lru_cache
from pathlib import Path
from fastapi import HTTPException

@lru_cache
def engine():
    try:
        from paddleocr import PaddleOCR
        return PaddleOCR(use_angle_cls=True, lang="en")
    except Exception as exc:
        raise HTTPException(503, "PaddleOCR is not installed or initialized") from exc

def _find(pattern: str, text: str, default=""):
    match = re.search(pattern, text, re.I | re.M)
    return match.group(1).strip() if match else default

def _number(pattern: str, text: str) -> float:
    try:
        return float(_find(pattern, text, "0").replace(",", ""))
    except ValueError:
        return 0.0

def extract(path: str) -> dict:
    """OCR an image or render page one of a PDF at a high enough OCR resolution."""
    source, temporary = Path(path), None
    try:
        if source.suffix.lower() == ".pdf":
            try:
                import fitz
                document = fitz.open(source)
                if document.page_count < 1: raise ValueError("empty PDF")
                pixmap = document.load_page(0).get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                temporary = Path(tempfile.gettempdir()) / f"powersense-ocr-{source.stem}.png"
                pixmap.save(str(temporary)); document.close(); source = temporary
            except Exception as exc:
                raise HTTPException(422, "The PDF could not be rendered for OCR") from exc
        blocks = engine().ocr(str(source), cls=True)
        pairs = [line for block in blocks or [] for line in block]
        lines = [item[1][0] for item in pairs]
    finally:
        if temporary: temporary.unlink(missing_ok=True)
    text = "\n".join(lines)
    confidence = round(sum(item[1][1] for item in pairs) / len(pairs), 4) if pairs else 0
    units = _number(r"(?:units?|consumption|kwh)\s*[:\-]?\s*([\d,.]+)", text)
    amount = _number(r"(?:amount\s*(?:due|payable)|total)\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,.]+)", text)
    fields = {"consumerName": _find(r"(?:consumer|customer)\s*name\s*[:\-]?\s*([^\n]+)", text), "consumerNumber": _find(r"(?:consumer|account)\s*(?:no|number|id)\s*[:\-]?\s*([^\n]+)", text), "meterNumber": _find(r"meter\s*(?:no|number)\s*[:\-]?\s*([^\n]+)", text), "billNumber": _find(r"(?:bill|invoice)\s*(?:no|number)\s*[:\-]?\s*([^\n]+)", text), "billingMonth": _find(r"billing\s*(?:month|period)\s*[:\-]?\s*([^\n]+)", text), "billingDate": _find(r"(?:bill|issue)\s*date\s*[:\-]?\s*([^\n]+)", text), "dueDate": _find(r"due\s*date\s*[:\-]?\s*([^\n]+)", text), "unitsConsumedKwh": units, "amountDue": amount, "tariffCategory": _find(r"tariff\s*[:\-]?\s*([^\n]+)", text), "connectionType": _find(r"connection\s*type\s*[:\-]?\s*([^\n]+)", text)}
    fields.update({"confidenceScore": confidence, "detectedFieldsCount": sum(bool(value) for key, value in fields.items() if key not in {"unitsConsumedKwh", "amountDue"}) + int(units > 0) + int(amount > 0), "qualityWarnings": (["No OCR text was detected. Upload a sharp, front-facing bill image."] if not lines else []) + (["OCR confidence is low; review extracted data before relying on it."] if 0 < confidence < .65 else []), "rawTextSnippets": lines})
    return fields
