"""Authentication endpoints."""
from fastapi import APIRouter, Header, Request
from fastapi.responses import JSONResponse

from auth import AuthManager
from security import SecurityMiddleware
from session_token_helpers import expire_session_token

router = APIRouter()
auth_manager = AuthManager()
rate_limiter = SecurityMiddleware(max_requests=5, window_seconds=60)


@router.post("/auth/register")
async def auth_register(request: Request):
    data = await request.json()
    username = data.get("username", "")
    # Rate-limit per username to prevent brute-force on specific accounts
    identifier = username if username else (request.client.host if request.client else "guest")
    if not rate_limiter.allow_request(identifier):
        return JSONResponse(status_code=429, content={"error": "Rate limit exceeded"})
    token = auth_manager.register_user(username)
    return {"token": token}


@router.post("/auth/login")
async def auth_login(request: Request):
    data = await request.json()
    username = data.get("username", "")
    identifier = username if username else (request.client.host if request.client else "guest")
    if not rate_limiter.allow_request(identifier):
        return JSONResponse(status_code=429, content={"error": "Rate limit exceeded"})
    token = auth_manager.login_user(username)
    if not token:
        return JSONResponse(status_code=401, content={"error": "Invalid username"})
    return {"token": token}


@router.post("/auth/logout")
async def auth_logout(Authorization: str = Header(None)):
    if not Authorization or not Authorization.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Missing or invalid Authorization header"})
    token = Authorization.split(" ", 1)[1]
    # Validate token exists in auth_manager (not session_token_helpers)
    if token not in auth_manager.tokens.values():
        return JSONResponse(status_code=401, content={"error": "Token already expired or invalid"})
    auth_manager.invalidate_token(token)
    return {"success": True}
