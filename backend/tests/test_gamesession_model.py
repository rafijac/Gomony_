import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from game_session.__main__ import GameSession

def test_gamesession_init():
    session = GameSession("testid")
    assert session.game_id == "testid"
    assert session.current_player == 1
    assert session.move_count == 0
    assert session.players == [1]
    assert session.completed is False
    assert isinstance(session.session_tokens, dict)
    assert 1 in session.session_tokens

def test_gamesession_add_player():
    session = GameSession("testid")
    token2 = session.add_player(2)
    assert 2 in session.players
    assert 2 in session.session_tokens
    assert session.orientations[2] == "north"

def test_gamesession_get_player_by_token():
    session = GameSession("testid")
    token1 = session.session_tokens[1]
    assert session.get_player_by_token(token1) == 1
    assert session.get_player_by_token("invalid") is None
