from unittest.mock import MagicMock, patch

from backend.app.db.connection import build_mysql_connection_options, check_mysql_connection


def test_build_mysql_connection_options_uses_settings_values() -> None:
    connection_options = build_mysql_connection_options(
        host="db.internal",
        port=3307,
        user="readonly",
        password="secret",
        database="analytics",
        ssl_mode="REQUIRED",
    )

    assert connection_options == {
        "host": "db.internal",
        "port": 3307,
        "user": "readonly",
        "password": "secret",
        "database": "analytics",
        "connect_timeout": 5,
        "ssl": {"ssl_mode": "REQUIRED"},
    }


@patch("backend.app.db.connection.pymysql.connect")
def test_check_mysql_connection_returns_success_when_query_completes(
    mock_connect: MagicMock,
) -> None:
    mock_cursor = MagicMock()
    mock_connection = MagicMock()
    mock_connection.cursor.return_value.__enter__.return_value = mock_cursor
    mock_connect.return_value.__enter__.return_value = mock_connection

    result = check_mysql_connection()

    assert result["ok"] is True
    assert result["message"] == "MySQL connection established successfully."
    mock_cursor.execute.assert_called_once_with("SELECT 1")
