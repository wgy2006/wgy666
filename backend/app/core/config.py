from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    github_token: str | None = Field(default=None, validation_alias="GITHUB_TOKEN")
    github_webhook_secret: str | None = Field(default=None, validation_alias="GITHUB_WEBHOOK_SECRET")
    github_api_base_url: str = "https://api.github.com"
    github_api_version: str = "2022-11-28"
    request_timeout_seconds: float = 20.0
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
