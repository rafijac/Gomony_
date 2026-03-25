"""Pydantic request models."""
from pydantic import BaseModel
from typing import List, Optional


class MoveRequest(BaseModel):
    current_state: Optional[List[List[List[int]]]] = None
    start_pos: List[int]
    end_pos: List[int]


class AIMoveRequest(BaseModel):
    depth: Optional[int] = 2


class JoinGameRequest(BaseModel):
    game_id: str


class SessionMoveRequest(BaseModel):
    start_pos: List[int]
    end_pos: List[int]
    player: int
    session_token: Optional[str] = None
