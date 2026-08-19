import json
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..deps import current_user, service_client
from ..config import settings

router = APIRouter(tags=["chat"])
class Message(BaseModel):
    message: str; history: list[dict] = []

async def _completion(messages: list[dict], *, json_mode: bool = False) -> str:
    if not settings.openrouter_api_key:
        raise HTTPException(503, "OPENROUTER_API_KEY is not configured")
    payload = {"model": settings.openrouter_model, "messages": messages}
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.openrouter_api_key}", "Content-Type": "application/json", "HTTP-Referer": settings.frontend_url, "X-Title": "PowerSense"},
            json=payload,
        )
    if response.is_error:
        raise HTTPException(502, "OpenRouter request failed")
    return response.json()["choices"][0]["message"]["content"]

async def personalized_recommendations(context: dict) -> list[dict]:
    """Uses the configured PowerSense OpenRouter model; never invents a local fallback."""
    prompt = (
        "You are PowerSense's energy advisor. Using only the supplied measured and model-predicted values, "
        "return JSON with a recommendations array containing at most 3 actionable, personalized electricity-saving suggestions. "
        "Each item must have title, category, description, estimatedMonthlySavings, estimatedKwhSavings, implementationCost, paybackMonths, impactLevel. "
        "Use 0 for an estimate that cannot be justified by the supplied data. Do not claim appliance-level or peak-hour facts that are not in the data.\n"
        + json.dumps(context)
    )
    try:
        data = json.loads(await _completion([{"role": "system", "content": "Return valid JSON only."}, {"role": "user", "content": prompt}], json_mode=True))
        items = data.get("recommendations", [])
        if not isinstance(items, list):
            raise ValueError("recommendations is not a list")
        return [item for item in items[:3] if isinstance(item, dict) and item.get("title") and item.get("description")]
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(502, "OpenRouter returned an invalid recommendation response") from exc

@router.post("/chatbot/message")
async def message(payload: Message, user=Depends(current_user)):
    prompt = "You are PowerSense's energy advisor. Explain bills, tariffs, graphs and savings clearly. Never invent ML predictions or claim to run prediction models."
    messages=[{"role":"system","content":prompt}] + [{"role":"assistant" if x.get("sender")=="assistant" else "user","content":x.get("text","")} for x in payload.history[-12:]] + [{"role":"user","content":payload.message}]
    answer = await _completion(messages)
    service_client().table("chat_history").insert({"user_id":user["id"],"message":payload.message,"response":answer,"model":settings.openrouter_model}).execute()
    return {"text":answer}
