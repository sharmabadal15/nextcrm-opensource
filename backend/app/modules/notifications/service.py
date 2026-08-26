"""Notification business logic."""

from sqlalchemy.ext.asyncio import AsyncSession


class NotificationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_for_user(self, user_id: str, organization_id: str):
        raise NotImplementedError

    async def mark_read(self, notification_id: str, organization_id: str):
        raise NotImplementedError

    async def mark_all_read(self, user_id: str, organization_id: str):
        raise NotImplementedError

    async def delete(self, notification_id: str, organization_id: str):
        raise NotImplementedError

    async def create(self, data: dict, organization_id: str):
        """Create a notification (typically called internally)."""
        raise NotImplementedError
