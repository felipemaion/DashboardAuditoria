from fastapi import APIRouter, HTTPException, status

from backend.app.core.config import get_settings
from backend.app.db.connection import check_mysql_connection
from backend.app.schemas.health import DatabaseHealthResponse, HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service="dashboard-magna-backend",
        environment=settings.api_env,
    )


@router.get("/health/database", response_model=DatabaseHealthResponse)
def database_healthcheck() -> DatabaseHealthResponse:
    try:
        connection_status = check_mysql_connection()
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "ok": False,
                "message": "Database connection unavailable",
            },
        ) from error

    return DatabaseHealthResponse(
        ok=bool(connection_status["ok"]),
        message=str(connection_status["message"]),
    )
