"""
Session token handling for GameSession.
Delegates to session_token_helpers for token creation/validation.
"""
from session_token_helpers import create_session_token
from typing import Dict, Optional
import secrets

def create_player_token(session_tokens: Dict[int, str], player_number: int) -> str:
    """
    Create and store a session token for a player.
    """
    token = create_session_token()
    session_tokens[player_number] = token
    return token

def get_player_by_token(session_tokens: Dict[int, str], token: str) -> Optional[int]:
    """
    Return the player number for a given session token, or None if not found.
    """
    for num, tok in session_tokens.items():
        if secrets.compare_digest(tok, token):
            return num
    return None
