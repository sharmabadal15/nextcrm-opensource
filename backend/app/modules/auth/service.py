"""Auth business logic — registration, login, token management."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.modules.auth.models import Organization, User


class AuthService:
    """Handles authentication and user management operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def authenticate(self, email: str, password: str) -> tuple[User, dict]:
        """Verify credentials and return user + tokens."""
        result = await self.session.execute(
            select(User).where(User.email == email, User.deleted_at.is_(None))
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.password_hash):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("Account is deactivated")

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        await self.session.commit()

        tokens = self._create_tokens(user)
        return user, tokens

    async def register(
        self,
        first_name: str,
        last_name: str,
        email: str,
        password: str,
        organization_name: str | None = None,
    ) -> tuple[User, dict]:
        """Create a new user account with organization."""
        # Check duplicate email
        existing = await self.session.execute(
            select(User).where(User.email == email, User.deleted_at.is_(None))
        )
        if existing.scalar_one_or_none():
            raise ConflictError("Email already registered")

        # Create or use default organization
        if organization_name:
            slug = organization_name.lower().replace(" ", "-")
            org = Organization(name=organization_name, slug=slug, plan="free")
            self.session.add(org)
            await self.session.flush()
            org_id = org.id
            role = "admin"
        else:
            # For demo: assign to first org found, or create one
            result = await self.session.execute(select(Organization).limit(1))
            org = result.scalar_one_or_none()
            if not org:
                org = Organization(name="Default Org", slug="default-org", plan="free")
                self.session.add(org)
                await self.session.flush()
            org_id = org.id
            role = "sales_rep"

        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=hash_password(password),
            role=role,
            organization_id=org_id,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)

        tokens = self._create_tokens(user)
        return user, tokens

    async def refresh_access_token(self, refresh_token: str) -> dict:
        """Validate refresh token and issue new access token."""
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid refresh token")

        user_id = payload.get("sub")
        user = await self.get_user_by_id(user_id)
        return self._create_tokens(user)

    async def change_password(
        self, user_id: str, current_password: str, new_password: str
    ) -> None:
        """Change user password."""
        user = await self.get_user_by_id(user_id)
        if not verify_password(current_password, user.password_hash):
            raise AuthenticationError("Current password is incorrect")

        user.password_hash = hash_password(new_password)
        await self.session.commit()

    async def get_user_by_id(self, user_id: str) -> User:
        """Fetch user by ID."""
        result = await self.session.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None))
        )
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User", user_id)
        return user

    async def update_profile(self, user_id: str, data: dict) -> User:
        """Update user profile fields."""
        user = await self.get_user_by_id(user_id)
        for field in ("first_name", "last_name", "avatar"):
            if field in data and data[field] is not None:
                setattr(user, field, data[field])
        await self.session.commit()
        await self.session.refresh(user)
        return user

    def _create_tokens(self, user: User) -> dict:
        """Generate access + refresh token pair for a user."""
        token_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "organization_id": user.organization_id,
        }
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "token_type": "bearer",
        }
