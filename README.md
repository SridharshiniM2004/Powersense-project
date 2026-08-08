# PowerSense — local development

PowerSense runs locally with a React/Vite frontend, FastAPI backend, existing Supabase project, PaddleOCR, locally packaged ML models, and OpenRouter.

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
FRONTEND_URL=http://localhost:5173
UNITS_MODEL_PATH=models/electricity_units_model.pkl
BILL_MODEL_PATH=models/electricity_bill_model.pkl
```

## Configure the frontend

Create `.env.local` in the repository root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_API_URL=http://localhost:8000/api
```

## Run FastAPI locally

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

FastAPI is available at `http://localhost:8000`; use `/health` for a health response and `/docs` for API documentation.

## Run the frontend locally

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.
