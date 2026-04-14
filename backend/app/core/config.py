from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    api_env: Literal["development", "test", "staging", "production"] = "development"
    api_debug: bool = False
    api_host: str = "0.0.0.0"  # nosec B104
    api_port: int = 8000
    api_cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )

    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_database: str = "dashboard_magna"
    mysql_user: str = "app_readonly_user"
    mysql_password: str = "change_me"
    mysql_ssl_mode: str = "REQUIRED"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("api_cors_origins", mode="before")
    @classmethod
    def parse_api_cors_origins(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip().startswith("["):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
