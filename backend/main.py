"""Gomony FastAPI backend - app entry point."""
import subprocess
import os
import logging

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from routes.single_player import router as sp_router
from routes.multiplayer import router as mp_router
from routes.auth import router as auth_router

from prometheus_fastapi_instrumentator import Instrumentator
import sentry_sdk

# Sentry integration (optional, set SENTRY_DSN in .env to enable)
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.5,
        send_default_pii=False,  # Never send PII
    )

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s %(message)s',
    handlers=[logging.StreamHandler()]
)

app = FastAPI(title="Gomony", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://gomony-frontend.onrender.com",
        "https://gomony-bz56.onrender.com",
        "https://gomony.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics (no PII/IP)
instrumentator = Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    excluded_handlers=["/metrics"],
    should_instrument_requests_inprogress=True,
)
instrumentator.instrument(app).expose(app, include_in_schema=False, endpoint="/metrics")

app.include_router(sp_router)
app.include_router(mp_router)
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Gomony backend is running!"}

@app.get("/version")
async def version_info():
    try:
        commit = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=os.path.dirname(__file__)
        ).decode().strip()
    except Exception:
        commit = "unknown"
    return {"version": "1.0.0", "commit": commit, "status": "ok"}

# Privacy policy endpoint (mentions analytics, opt-out, no PII)
@app.get("/privacy", response_class=Response, include_in_schema=True)
async def privacy_policy():
    text = (
        "Gomony Privacy Policy\n"
        "- Analytics: We collect only aggregate, anonymized usage metrics via Prometheus.\n"
        "- No PII: We do not collect or store any personally identifiable information (PII), IP addresses, user IDs, or emails in analytics.\n"
        "- Opt-out: You may opt out of analytics by blocking the /metrics endpoint at your network or browser level.\n"
        "- Error Monitoring: Sentry is used for backend error monitoring, but no PII is sent.\n"
    )
    return Response(content=text, media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)