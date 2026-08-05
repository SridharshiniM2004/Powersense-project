# PowerSense

PowerSense is an AI-assisted electricity-bill SaaS: Supabase owns authentication, sessions, data and files; FastAPI runs secure OCR, model inference and OpenRouter chat; React provides the dashboard.

## Run locally

1. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL=http://localhost:8000/api`.
2. In Supabase SQL Editor, run [supabase/schema.sql](supabase/schema.sql). Enable Email confirmations and set its Site URL / redirect URLs to your frontend URL.
3. Copy `backend/.env.example` to `backend/.env`, set the Supabase service-role key, OpenRouter credentials and exact model-file paths.
4. Start the API: `cd backend && python -m venv .venv && .venv\Scripts\pip install -r requirements.txt && .venv\Scripts\uvicorn app.main:app --reload --port 8000`.
5. Start the interface: `npm install && npm run dev`.

The two supplied `.pkl` files remain outside the repository by default; the backend reads them from `UNITS_MODEL_PATH` and `BILL_MODEL_PATH`. Do not commit them or any `.env` file.

## Deployment

Deploy `backend/` to Render with [render.yaml](render.yaml), set its environment secrets, then deploy the repository root to Vercel. Set `VITE_API_URL` in Vercel to `https://your-render-service.onrender.com/api`. [vercel.json](vercel.json) provides the SPA fallback for password recovery and application routes.
