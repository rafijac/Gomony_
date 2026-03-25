# test_main_auth_endpoints.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_register_and_login_endpoint():
    resp = client.post("/auth/register", json={"username": "testuser"})
    assert resp.status_code == 200
    token = resp.json().get("token")
    assert token
    resp2 = client.post("/auth/login", json={"username": "testuser"})
    assert resp2.status_code == 200
    assert resp2.json().get("token") == token

def test_guest_register():
    resp = client.post("/auth/register", json={"username": ""})
    assert resp.status_code == 200
    assert resp.json().get("token")

def test_logout_endpoint():
    resp = client.post("/auth/register", json={"username": "logoutuser"})
    token = resp.json().get("token")
    resp2 = client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert resp2.status_code == 200
    assert resp2.json().get("success")


def test_token_rotation_on_join():
    # Player 2 joins, should get a new token, and old token should not work for player 2
    resp1 = client.post("/game/create")
    game_id = resp1.json()["game_id"]
    p1_token = resp1.json()["session_token"]
    resp2 = client.post("/game/join", json={"game_id": game_id})
    p2_token = resp2.json()["session_token"]
    # Try to use p1_token as player 2 (should fail)
    move = {"start_pos": [8, 1], "end_pos": [7, 2], "player": 2, "session_token": p1_token}
    resp3 = client.post(f"/game/{game_id}/move", json=move)
    assert resp3.status_code == 401
    # p2_token as player 2 is auth-valid but it's not player 2's turn yet
    move["session_token"] = p2_token
    resp4 = client.post(f"/game/{game_id}/move", json=move)
    # Accept 200 or 400 (invalid move) or 403 (not your turn), but not 401
    assert resp4.status_code in (200, 400, 403)


def test_replay_attack_token_reuse():
    # Use a token after logout/expiration should fail
    resp = client.post("/auth/register", json={"username": "replayuser"})
    token = resp.json().get("token")
    client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    # Try to use token again
    resp2 = client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert resp2.status_code == 401


def test_rate_limit_on_auth():
    # Simulate brute force: repeated register attempts for the same username
    for i in range(10):
        resp = client.post("/auth/register", json={"username": "bruteforce_target"})
        if i < 5:
            assert resp.status_code == 200
        else:
            # Should be rate limited after 5 attempts on the same account
            assert resp.status_code in (429, 403)
