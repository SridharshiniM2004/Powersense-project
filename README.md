# PowerSense — local development

PowerSense runs locally with a React/Vite frontend, FastAPI backend, existing Supabase project, OCR.space online OCR, locally packaged ML models, and OpenRouter.

## Prerequisites

- Node.js 20 or newer
- Python 3.10 or newer
- The model files included in `backend/models/`

## Configure the backend

Copy `backend/.env.example` to `backend/.env`, then enter the credentials for your existing Supabase project and OpenRouter account. Keep the resulting `.env` file private.

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
SUPABASE_BILLS_BUCKET=bills
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
OCR_SPACE_API_KEY=your-free-ocr-space-key
OCR_SPACE_ENDPOINT=https://api.ocr.space/parse/image
OCR_SPACE_ENGINE=2
FRONTEND_URL=http://localhost:5173
UNITS_MODEL_PATH=models/electricity_units_model.pkl
BILL_MODEL_PATH=models/electricity_bill_model.pkl
```

## Configure the frontend

Create `.env.local` in the repository root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
# Optional: normally leave this unset. Vite proxies /api to the local FastAPI server.
# VITE_API_URL=http://localhost:8000/api
```

## Run FastAPI locally

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

FastAPI is available at `http://localhost:8000`; use `/health` for a health response and `/docs` for API documentation.

Node.js is not required to run or use the backend. Open `http://localhost:8000/docs`
to use the interactive API interface. The React/Vite browser interface does require
Node.js to build or serve locally; use an already deployed frontend, another API
client, or the API docs if you do not want to install it.

The deployed backend uses OCR.space for online OCR so the project can stay inside free hosting limits. Get a free OCR API key from `https://ocr.space/ocrapi`.

## Run the frontend locally

```powershell
npm install
npm run dev
```


Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The Vite development server proxies `/api/*` to `http://localhost:8000`, so start
FastAPI first and keep `VITE_API_URL` unset for the standard local setup. If you
set `VITE_API_URL=http://localhost:8000/api`, the backend's default CORS setting
already permits the Vite frontend at `http://localhost:5173`.

## Deploy on Vercel

This repository includes `vercel.json` for a Vite frontend and a Python serverless FastAPI function in `api/index.py`. Configure the Vercel project framework as **Vite**, then add these environment variables in Vercel:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=/api
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BILLS_BUCKET=bills
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
OCR_SPACE_API_KEY=...
OCR_SPACE_ENDPOINT=https://api.ocr.space/parse/image
OCR_SPACE_ENGINE=2
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

This free deployment path uses Vercel for frontend/backend, Supabase free tier for data/auth, OCR.space free API for OCR, and a free OpenRouter model for chat. Free tiers can change and do not guarantee uptime, so keep usage small for demos and coursework.
