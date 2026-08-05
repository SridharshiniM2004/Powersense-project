import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..deps import current_user, service_client
from ..config import settings

router = APIRouter(tags=["chat"])
class Message(BaseModel):
    message: str; history: list[dict] = []

@router.post("/chatbot/message")
async def message(payload: Message, user=Depends(current_user)):
    if not settings.openrouter_api_key: raise HTTPException(503,"OPENROUTER_API_KEY is not configured")
    prompt = "You are PowerSense's energy advisor. Explain bills, tariffs, graphs and savings clearly. Never invent ML predictions or claim to run prediction models."
    messages=[{"role":"system","content":prompt}] + [{"role":"assistant" if x.get("sender")=="assistant" else "user","content":x.get("text","")} for x in payload.history[-12:]] + [{"role":"user","content":payload.message}]
    async with httpx.AsyncClient(timeout=30) as client:
        r=await client.post("https://openrouter.ai/api/v1/chat/completions",headers={"Authorization":f"Bearer {settings.openrouter_api_key}","Content-Type":"application/json","HTTP-Referer":settings.frontend_url,"X-Title":"PowerSense"},json={"model":settings.openrouter_model,"messages":messages})
    if r.is_error: raise HTTPException(502,"OpenRouter request failed")
    answer=r.json()["choices"][0]["message"]["content"]
    service_client().table("chat_history").insert({"user_id":user["id"],"message":payload.message,"response":answer,"model":settings.openrouter_model}).execute()
    return {"text":answer}
