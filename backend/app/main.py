from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, issues, repositories
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="GitHub Issue Analysis Platform API",
        version="0.1.0",
        description="Base backend for syncing GitHub repositories and classifying project information.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(repositories.router, prefix="/api")
    app.include_router(issues.router, prefix="/api")
    return app


app = create_app()
