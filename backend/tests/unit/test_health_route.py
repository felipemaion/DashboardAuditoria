from unittest.mock import patch

from fastapi.testclient import TestClient


def test_health_route_returns_service_status(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "dashboard-magna-backend",
        "environment": "development",
    }


@patch("backend.app.api.routes.health.check_mysql_connection")
def test_database_health_route_returns_database_status(
    mock_check_mysql_connection, client: TestClient
) -> None:
    mock_check_mysql_connection.return_value = {
        "ok": True,
        "message": "MySQL connection established successfully.",
    }

    response = client.get("/api/v1/health/database")

    assert response.status_code == 200
    assert response.json() == {
        "ok": True,
        "message": "MySQL connection established successfully.",
    }


@patch("backend.app.api.routes.health.check_mysql_connection")
def test_database_health_route_returns_error_when_database_is_unavailable(
    mock_check_mysql_connection, client: TestClient
) -> None:
    mock_check_mysql_connection.side_effect = RuntimeError("Authentication failed.")

    response = client.get("/api/v1/health/database")

    assert response.status_code == 503
    assert response.json() == {
        "detail": {
            "ok": False,
            "message": "Authentication failed.",
        }
    }
