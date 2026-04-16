"""Tests for CORS middleware configuration."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.app.core.config import Settings
from backend.app.main import create_application

ALLOWED_ORIGIN = "http://localhost:5173"
DISALLOWED_ORIGIN = "http://evil.example.com"


@pytest.fixture()
def client_with_cors() -> TestClient:
    """Client backed by an app with a known CORS origin list."""
    mock_settings = Settings(api_cors_origins=[ALLOWED_ORIGIN])
    with patch("backend.app.main.get_settings", return_value=mock_settings):
        app = create_application()
    return TestClient(app, raise_server_exceptions=True)


def test_cors_allows_configured_origin(client_with_cors: TestClient) -> None:
    """GET from an allowed origin must receive Access-Control-Allow-Origin."""
    response = client_with_cors.get(
        "/api/v1/health",
        headers={"Origin": ALLOWED_ORIGIN},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN


def test_cors_rejects_unknown_origin(client_with_cors: TestClient) -> None:
    """GET from an unknown origin must not receive Access-Control-Allow-Origin."""
    response = client_with_cors.get(
        "/api/v1/health",
        headers={"Origin": DISALLOWED_ORIGIN},
    )
    assert response.status_code == 200  # request still succeeds; CORS is browser-enforced
    assert "access-control-allow-origin" not in response.headers


def test_cors_preflight_allowed_origin(client_with_cors: TestClient) -> None:
    """Preflight OPTIONS from an allowed origin must return 200 with CORS headers."""
    response = client_with_cors.options(
        "/api/v1/health",
        headers={
            "Origin": ALLOWED_ORIGIN,
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == ALLOWED_ORIGIN


def test_cors_only_exposes_get_method(client_with_cors: TestClient) -> None:
    """Preflight must advertise only GET in Access-Control-Allow-Methods."""
    response = client_with_cors.options(
        "/api/v1/health",
        headers={
            "Origin": ALLOWED_ORIGIN,
            "Access-Control-Request-Method": "GET",
        },
    )
    allowed_methods = response.headers.get("access-control-allow-methods", "")
    assert "GET" in allowed_methods
    assert "POST" not in allowed_methods
    assert "DELETE" not in allowed_methods
