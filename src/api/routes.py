# src/api/routes.py
from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import uuid
import logging
from src.models.game import GameSession
from src.utils.session_token_helpers import validate_session_token
from shared.validate_move import validate_move
from shared.ai import choose_ai_move

logger = logging.getLogger("gomony")

router = APIRouter()

# ... (API endpoints will be migrated here from main.py)
