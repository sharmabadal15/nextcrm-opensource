"""Auth endpoint tests."""

import pytest


@pytest.mark.asyncio
async def test_login_success(client):
    """Test successful login returns tokens."""
    # TODO: Implement after auth service is complete
    pass


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    """Test login with wrong password returns 401."""
    # TODO: Implement
    pass


@pytest.mark.asyncio
async def test_register_new_user(client):
    """Test user registration."""
    # TODO: Implement
    pass


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    """Test duplicate email returns 409."""
    # TODO: Implement
    pass
