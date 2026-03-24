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
