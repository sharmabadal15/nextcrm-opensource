"""Shared FastAPI dependencies — DB session, current user, permissions."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.core.security import get_current_user_from_token

# Type aliases for dependency injection
DBSession = Annotated[AsyncSession, Depends(get_async_session)]
CurrentUser = Annotated[dict, Depends(get_current_user_from_token)]
