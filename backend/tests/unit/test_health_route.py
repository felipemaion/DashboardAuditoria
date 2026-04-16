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
            "message": "Database connection unavailable",
        }
    }


@patch("backend.app.api.routes.health.check_mysql_connection")
def test_database_health_route_does_not_leak_internal_error_details(
    mock_check_mysql_connection, client: TestClient
) -> None:
    """503 response must not expose host, port, user or any driver internals."""
    sensitive_detail = (
        "Access denied for user 'app_user'@'db-host-01.internal' (using password: YES)"
    )
    mock_check_mysql_connection.side_effect = RuntimeError(sensitive_detail)

    response = client.get("/api/v1/health/database")

    assert response.status_code == 503
    body = response.json()
    assert "app_user" not in str(body)
    assert "db-host-01" not in str(body)
    assert body["detail"]["message"] == "Database connection unavailable"
