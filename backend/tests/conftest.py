"""Pytest fixtures — async DB, test client, auth headers."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    """Async test client for FastAPI."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.fixture
def auth_headers():
    """Generate JWT auth headers for testing."""
    # TODO: Generate a test JWT token
    return {"Authorization": "Bearer test-token"}
