from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# STARTUP SAFETY CHECK: Fail loudly if critical env vars missing
import os
_SUPABASE_URL = os.getenv("SUPABASE_URL")
_SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not _SUPABASE_URL:
    raise RuntimeError("STARTUP FAILED: SUPABASE_URL environment variable is missing")
if not _SUPABASE_SERVICE_KEY:
    raise RuntimeError("STARTUP FAILED: SUPABASE_SERVICE_ROLE_KEY environment variable is missing")

from supabase_client import get_supabase_client
from cfo_competition import router as cfo_router
from admin_router import router as admin_router
from chat_service import router as chat_router
from socketio_server import socket_app

app = FastAPI(title="ModEX Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/socket.io", socket_app)

api_router = APIRouter(prefix="/api")

@api_router.get("/health")
async def health_check():
    try:
        supabase = get_supabase_client()
        supabase.table('user_profiles').select('id').limit(1).execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

app.include_router(api_router)
app.include_router(cfo_router)
app.include_router(admin_router)
app.include_router(chat_router)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("ModEX Backend started on port 8000")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down")
