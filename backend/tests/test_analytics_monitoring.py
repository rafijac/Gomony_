import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_prometheus_metrics_endpoint_exists():
    """GET /metrics returns 200 and Prometheus format."""
    response = client.get("/metrics")
    # Fails: /metrics endpoint not implemented
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.text.startswith('# HELP'), "Expected Prometheus metrics format"

def test_metrics_no_pii_collected():
    """Metrics endpoint does not expose IP, user ID, or PII."""
    response = client.get("/metrics")
    # Fails: /metrics endpoint not implemented or exposes PII
    assert 'ip' not in response.text.lower(), "Metrics must not contain IP addresses"
    assert 'user' not in response.text.lower(), "Metrics must not contain user IDs"
    assert 'email' not in response.text.lower(), "Metrics must not contain emails"

def test_privacy_policy_mentions_analytics():
    """Privacy policy endpoint or file mentions analytics, opt-out, and no PII."""
    response = client.get("/privacy")
    # Fails: /privacy endpoint not implemented or missing analytics/opt-out/PII info
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    text = response.text.lower()
    assert 'analytics' in text, "Privacy policy must mention analytics"
    assert 'opt-out' in text, "Privacy policy must mention opt-out"
    assert 'pii' in text or 'personally identifiable' in text, "Privacy policy must mention no PII"
