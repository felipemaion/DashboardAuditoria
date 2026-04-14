from collections.abc import Sequence
from typing import Any

import pymysql
from pymysql.cursors import DictCursor

from backend.app.core.config import get_settings
from backend.app.db.connection import build_mysql_connection_options


def fetch_report_rows(query: str, *, limit: int, offset: int) -> list[dict[str, Any]]:
    settings = get_settings()
    connection_options = build_mysql_connection_options(
        host=settings.mysql_host,
        port=settings.mysql_port,
        user=settings.mysql_user,
        password=settings.mysql_password,
        database=settings.mysql_database,
        ssl_mode=settings.mysql_ssl_mode,
    )
    connection_options["cursorclass"] = DictCursor

    with pymysql.connect(**connection_options) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, _build_query_parameters(limit=limit, offset=offset))
            rows = cursor.fetchall()

    return list(rows)


def _build_query_parameters(*, limit: int, offset: int) -> Sequence[int]:
    return (limit, offset)
