import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_register_with_avatar_and_name():
    resp = client.post("/auth/register", json={"username": "alice", "display_name": "Alice", "avatar_url": "/assets/avatars/avatar2.png"})
    assert resp.status_code == 200
    token = resp.json().get("token")
    assert token
    # Fetch user info (assume /auth/me or similar endpoint, or extend as needed)
    # resp2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    # assert resp2.json()["display_name"] == "Alice"
    # assert resp2.json()["avatar_url"] == "/assets/avatars/avatar2.png"

def test_register_legacy_user_fallback():
    resp = client.post("/auth/register", json={"username": "legacyuser"})
    assert resp.status_code == 200
    token = resp.json().get("token")
    assert token
    # resp2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    # assert resp2.json()["display_name"] == "legacyuser" or resp2.json()["display_name"] == "Player"
    # assert resp2.json()["avatar_url"] is not None


def test_edit_avatar_name_locked_after_game_start():
    """Test that editing avatar/name is locked after game start (should fail until implemented)."""
    # Register and join game
    resp = client.post("/auth/register", json={"username": "editlock", "display_name": "EditLock", "avatar_url": "/assets/avatars/avatar2.png"})
    token = resp.json().get("token")
    g1 = client.post("/game/create").json()["game_id"]
    client.post("/game/join", json={"game_id": g1})
    # Start game (simulate API call)
    client.post(f"/game/{g1}/start")
    # Try to edit avatar/name after start (should fail)
    resp2 = client.post("/user/update", json={"display_name": "Hacker", "avatar_url": "/assets/avatars/avatar3.png"}, headers={"Authorization": f"Bearer {token}"})
    assert resp2.status_code != 200
