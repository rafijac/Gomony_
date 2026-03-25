"""Gomony FastAPI backend - app entry point."""
import subprocess
import os
import logging

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.single_player import router as sp_router
from routes.multiplayer import router as mp_router
from routes.auth import router as auth_router

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)