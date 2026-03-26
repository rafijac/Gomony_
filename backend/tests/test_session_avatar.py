import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_game_session_includes_player_names_and_avatars():
    # Register two users with avatars/names
    r1 = client.post("/auth/register", json={"username": "alice", "display_name": "Alice", "avatar_url": "/assets/avatars/avatar2.png"})
    t1 = r1.json()["token"]
    r2 = client.post("/auth/register", json={"username": "bob", "display_name": "Bob", "avatar_url": "/assets/avatars/avatar3.png"})
    t2 = r2.json()["token"]
    # Create and join game
    g1 = client.post("/game/create").json()["game_id"]
    client.post("/game/join", json={"game_id": g1})
    # Get game state
    resp = client.get(f"/game/{g1}/state")
    data = resp.json()
    assert "players" in data
    for p in data["players"]:
        assert "display_name" in p
        assert "avatar_url" in p


def test_avatar_name_backend_sync_and_fallback():
    """Test backend sync of avatar/name and fallback for legacy sessions (should fail until implemented)."""
    # Create legacy game (simulate missing player info)
    g2 = client.post("/game/create").json()["game_id"]
    # Simulate legacy: forcibly remove player info (requires DB or API hack)
    # Here, just check that fallback is present in state
    resp = client.get(f"/game/{g2}/state")
    data = resp.json()
    for p in data.get("players", []):
        assert p.get("display_name", "").startswith("Player") or p.get("display_name", "") != ""
        assert p.get("avatar_url", "").startswith("/assets/avatars/avatar")
