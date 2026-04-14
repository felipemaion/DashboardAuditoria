from fastapi import FastAPI

from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.reports import router as reports_router
from backend.app.core.config import get_settings


def create_application() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title="Dashboard Magna API",
        debug=settings.api_debug,
        version="0.1.0",
    )
    application.include_router(health_router, prefix="/api/v1")
    application.include_router(reports_router, prefix="/api/v1")
    return application


app = create_application()
