"""User management business logic."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import PaginationParams, apply_sorting, paginate
from app.exceptions import NotFoundError
from app.modules.auth.models import User
from app.modules.users.schemas import UserUpdate


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(
        self,
        organization_id: str,
        params: PaginationParams,
        role: str | None = None,
        is_active: bool | None = None,
    ) -> dict:
        """List all users in the organization with pagination."""
        query = select(User).where(
            User.organization_id == organization_id,
            User.deleted_at.is_(None),
        )

        if role:
            query = query.where(User.role == role)
        if is_active is not None:
            query = query.where(User.is_active == is_active)

        if params.search:
            term = f"%{params.search}%"
            query = query.where(
                User.first_name.ilike(term)
                | User.last_name.ilike(term)
                | User.email.ilike(term)
            )

        query = apply_sorting(query, User, params)
        return await paginate(self.session, query, params)

    async def get_by_id(self, user_id: str, organization_id: str) -> User:
        """Get a single user by ID."""
        result = await self.session.execute(
            select(User).where(
                User.id == user_id,
                User.organization_id == organization_id,
                User.deleted_at.is_(None),
            )
        )
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User", user_id)
        return user

    async def update(
        self, user_id: str, data: UserUpdate, organization_id: str
    ) -> User:
        """Update user (role, active status, profile)."""
        user = await self.get_by_id(user_id, organization_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def deactivate(self, user_id: str, organization_id: str) -> None:
        """Soft-deactivate a user."""
        user = await self.get_by_id(user_id, organization_id)
        user.is_active = False
        user.deleted_at = datetime.now(timezone.utc)
        await self.session.commit()
