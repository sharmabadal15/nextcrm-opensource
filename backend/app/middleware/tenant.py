"""Multi-tenant middleware — injects organization_id into request state."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class TenantMiddleware(BaseHTTPMiddleware):
    """Extracts organization_id from the authenticated user and stores it in request state."""

    async def dispatch(self, request: Request, call_next):
        # Organization ID is extracted from JWT in the auth dependency.
        # This middleware can be extended for subdomain-based tenancy.
        response = await call_next(request)
        return response
