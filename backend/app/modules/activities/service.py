"""Activity business logic."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import PaginationParams, apply_sorting, paginate
from app.exceptions import NotFoundError
from app.modules.activities.filters import apply_activity_filters, apply_activity_search
from app.modules.activities.models import Activity
from app.modules.activities.schemas import ActivityCreate, ActivityUpdate


class ActivityService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(
        self,
        organization_id: str,
        params: PaginationParams,
        type: str | None = None,
        priority: str | None = None,
        is_completed: bool | None = None,
        contact_id: str | None = None,
        deal_id: str | None = None,
        owner_id: str | None = None,
    ) -> dict:
        query = select(Activity).where(
            Activity.organization_id == organization_id,
            Activity.deleted_at.is_(None),
        )
        if params.search:
            query = apply_activity_search(query, params.search)
        query = apply_activity_filters(
            query, type=type, priority=priority, is_completed=is_completed,
            contact_id=contact_id, deal_id=deal_id, owner_id=owner_id,
        )
        query = apply_sorting(query, Activity, params)
        return await paginate(self.session, query, params)

    async def get_by_id(self, activity_id: str, organization_id: str) -> Activity:
        result = await self.session.execute(
            select(Activity).where(
                Activity.id == activity_id,
                Activity.organization_id == organization_id,
                Activity.deleted_at.is_(None),
            )
        )
        activity = result.scalar_one_or_none()
        if not activity:
            raise NotFoundError("Activity", activity_id)
        return activity

    async def create(self, data: ActivityCreate, organization_id: str) -> Activity:
        activity = Activity(
            **data.model_dump(exclude_unset=True),
            organization_id=organization_id,
        )
        self.session.add(activity)
        await self.session.commit()
        await self.session.refresh(activity)
        return activity

    async def update(self, activity_id: str, data: ActivityUpdate, organization_id: str) -> Activity:
        activity = await self.get_by_id(activity_id, organization_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(activity, field, value)
        await self.session.commit()
        await self.session.refresh(activity)
        return activity

    async def toggle_complete(self, activity_id: str, organization_id: str) -> Activity:
        """Toggle is_completed and set/clear completed_at."""
        activity = await self.get_by_id(activity_id, organization_id)
        activity.is_completed = not activity.is_completed
        activity.completed_at = datetime.now(timezone.utc) if activity.is_completed else None
        await self.session.commit()
        await self.session.refresh(activity)
        return activity

    async def delete(self, activity_id: str, organization_id: str) -> None:
        activity = await self.get_by_id(activity_id, organization_id)
        activity.deleted_at = datetime.now(timezone.utc)
        await self.session.commit()
