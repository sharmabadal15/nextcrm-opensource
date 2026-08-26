"""FastAPI application factory — CRM Backend."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.exceptions import register_exception_handlers
from app.middleware.logging import LoggingMiddleware

# Module routers
from app.modules.auth.router import router as auth_router
from app.modules.contacts.router import router as contacts_router
from app.modules.companies.router import router as companies_router
from app.modules.deals.router import router as deals_router
from app.modules.pipelines.router import router as pipelines_router
from app.modules.activities.router import router as activities_router
from app.modules.notes.router import router as notes_router
from app.modules.files.router import router as files_router
from app.modules.notifications.router import router as notifications_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.reports.router import router as reports_router
from app.modules.users.router import router as users_router
from app.modules.ai.router import router as ai_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    yield
    # Shutdown


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom middleware
    app.add_middleware(LoggingMiddleware)

    # Exception handlers
    register_exception_handlers(app)

    # Register routers
    prefix = settings.api_v1_prefix
    app.include_router(auth_router, prefix=f"{prefix}/auth", tags=["Auth"])
    app.include_router(contacts_router, prefix=f"{prefix}/contacts", tags=["Contacts"])
    app.include_router(companies_router, prefix=f"{prefix}/companies", tags=["Companies"])
    app.include_router(deals_router, prefix=f"{prefix}/deals", tags=["Deals"])
    app.include_router(pipelines_router, prefix=f"{prefix}/pipelines", tags=["Pipelines"])
    app.include_router(activities_router, prefix=f"{prefix}/activities", tags=["Activities"])
    app.include_router(notes_router, prefix=f"{prefix}/notes", tags=["Notes"])
    app.include_router(files_router, prefix=f"{prefix}/files", tags=["Files"])
    app.include_router(notifications_router, prefix=f"{prefix}/notifications", tags=["Notifications"])
    app.include_router(dashboard_router, prefix=f"{prefix}/dashboard", tags=["Dashboard"])
    app.include_router(reports_router, prefix=f"{prefix}/reports", tags=["Reports"])
    app.include_router(users_router, prefix=f"{prefix}/users", tags=["Users"])
    app.include_router(ai_router, prefix=f"{prefix}/ai", tags=["AI"])

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    return app


app = create_app()
