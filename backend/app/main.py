from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import bills, predictions, chat, dashboard, profile, admin, engagement, backend_api
from .ml import load_models_at_startup

@asynccontextmanager
async def lifespan(_: FastAPI):
    load_models_at_startup()
    yield

app = FastAPI(title="PowerSense API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_url], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
for route in (bills.router, predictions.router, chat.router, dashboard.router, profile.router, admin.router, engagement.router):
    app.include_router(route, prefix="/api")
app.include_router(backend_api.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "powersense-api"}

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def home():
    return """<!doctype html><html><head><title>PowerSense API</title><style>body{margin:0;background:#07111f;color:#dce9f5;font:16px system-ui;display:grid;min-height:100vh;place-items:center}.card{max-width:620px;padding:48px;border:1px solid #1d354d;border-radius:28px;background:#0c1a2b;box-shadow:0 30px 90px #0008}b{color:#45e0bf}a{color:#55d7ff}p{color:#9eb4c8;line-height:1.6}</style></head><body><main class='card'><b>POWERSENSE / API</b><h1>Energy intelligence, securely delivered.</h1><p>The PowerSense service is healthy and ready to process authenticated electricity-bill insights.</p><p><a href='/docs'>Open API documentation</a> &nbsp; <a href='/health'>Service health</a></p></main></body></html>"""
