import re
from functools import lru_cache
from fastapi import HTTPException

@lru_cache
def engine():
    try:
        from paddleocr import PaddleOCR
        return PaddleOCR(use_angle_cls=True, lang="en")
    except Exception as exc:
        raise HTTPException(503, "PaddleOCR is not installed or initialized") from exc

def _find(pattern: str, text: str, default=""):
    hit = re.search(pattern, text, re.I | re.M)
    return hit.group(1).strip() if hit else default

def extract(path: str):
    blocks = engine().ocr(path, cls=True)
    pairs = [line for block in blocks or [] for line in block]
    lines = [item[1][0] for item in pairs]
    text = "\n".join(lines)
    number = lambda p: float(_find(p, text, "0").replace(",", ""))
    return {"consumerName": _find(r"(?:consumer|customer)\s*name\s*[:\-]?\s*([^\n]+)", text), "consumerNumber": _find(r"(?:consumer|account)\s*(?:no|number|id)\s*[:\-]?\s*([^\n]+)", text), "meterNumber": _find(r"meter\s*(?:no|number)\s*[:\-]?\s*([^\n]+)", text), "billNumber": _find(r"(?:bill|invoice)\s*(?:no|number)\s*[:\-]?\s*([^\n]+)", text), "billingMonth": _find(r"billing\s*(?:month|period)\s*[:\-]?\s*([^\n]+)", text), "issueDate": _find(r"(?:bill|issue)\s*date\s*[:\-]?\s*([^\n]+)", text), "dueDate": _find(r"due\s*date\s*[:\-]?\s*([^\n]+)", text), "unitsConsumedKwh": number(r"(?:units?|consumption|kwh)\s*[:\-]?\s*([\d,.]+)"), "amountDue": number(r"(?:amount\s*(?:due|payable)|total)\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,.]+)"), "tariffCategory": _find(r"(?:tariff|connection\s*type)\s*[:\-]?\s*([^\n]+)", text), "confidenceScore": round(sum(item[1][1] for item in pairs) / len(pairs), 4) if pairs else 0, "rawTextSnippets": lines}
