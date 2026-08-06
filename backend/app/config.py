from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_bills_bucket: str = "bills"
    openrouter_api_key: str = ""
    openrouter_model: str = "nvidia/nemotron-3-ultra-550b-a55b:free"
    frontend_url: str = "http://localhost:5173"
    # Railway/Linux default. Local Windows paths may still be supplied through .env.
    units_model_path: Path = BACKEND_DIR / "models" / "electricity_units_model.pkl"
    bill_model_path: Path = BACKEND_DIR / "models" / "electricity_bill_model.pkl"


settings = Settings()
