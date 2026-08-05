from fastapi import Depends, HTTPException, Header, status
from supabase import create_client, Client
from .config import settings


def service_client() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Supabase server configuration is missing")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Supabase session")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        response = service_client().auth.get_user(token)
        if not response.user:
            raise ValueError("No user")
        return {"id": response.user.id, "email": response.user.email, "metadata": response.user.user_metadata or {}}
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired session") from exc


def require_admin(user: dict = Depends(current_user)) -> dict:
    profile = service_client().table("profiles").select("role").eq("id", user["id"]).single().execute().data
    if not profile or profile.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user
