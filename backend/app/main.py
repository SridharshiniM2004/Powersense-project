from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import bills, predictions, chat, dashboard, profile, admin, engagement, backend_api

# OCR engines and trained models load lazily on their first relevant request.
# This keeps local startup independent from optional services.
app = FastAPI(title="PowerSense API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_url], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
for route in (bills.router, predictions.router, chat.router, dashboard.router, profile.router, admin.router, engagement.router):
    app.include_router(route, prefix="/api")
app.include_router(backend_api.router, prefix="/api")
app.include_router(backend_api.router)

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/", include_in_schema=False)
def home():
    return {"status": "ok"}
