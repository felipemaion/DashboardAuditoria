from collections.abc import Mapping
from typing import Any

import pymysql

from backend.app.core.config import get_settings


def build_mysql_connection_options(
    host: str,
    port: int,
    user: str,
    password: str,
    database: str,
    ssl_mode: str,
) -> dict[str, Any]:
    ssl_options: dict[str, str] | None = None
    if ssl_mode and ssl_mode.upper() != "DISABLED":
        ssl_options = {"ssl_mode": ssl_mode}

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "database": database,
        "connect_timeout": 5,
        "ssl": ssl_options,
    }


def check_mysql_connection() -> Mapping[str, str | bool]:
    settings = get_settings()
    connection_options = build_mysql_connection_options(
        host=settings.mysql_host,
        port=settings.mysql_port,
        user=settings.mysql_user,
        password=settings.mysql_password,
        database=settings.mysql_database,
        ssl_mode=settings.mysql_ssl_mode,
    )

    with pymysql.connect(**connection_options) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")

    return {
        "ok": True,
        "message": "MySQL connection established successfully.",
    }
