# Railway environment variables

Set these values in Railway, never in frontend/Vercel variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BILLS_BUCKET=bills
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
FRONTEND_URL=https://your-vercel-project.vercel.app
UNITS_MODEL_PATH=/app/models/electricity_units_model.pkl
BILL_MODEL_PATH=/app/models/electricity_bill_model.pkl
```

The two trained model files are already packaged in `backend/models/`:

- `electricity_units_model.pkl`
- `electricity_bill_model.pkl`

Do not place secrets in source control.
