"""Activity API routes."""

from fastapi import APIRouter, Depends, Query

from app.core.pagination import PaginationParams, get_pagination_params
from app.dependencies import CurrentUser, DBSession
from app.modules.activities.schemas import ActivityCreate, ActivityResponse, ActivityUpdate
from app.modules.activities.service import ActivityService

router = APIRouter()


@router.get("")
async def list_activities(
    db: DBSession,
    user: CurrentUser,
    params: PaginationParams = Depends(get_pagination_params),
    type: str | None = Query(None, alias="filters[type]"),
    priority: str | None = Query(None, alias="filters[priority]"),
    is_completed: bool | None = Query(None, alias="filters[isCompleted]"),
    contact_id: str | None = Query(None, alias="filters[contactId]"),
    deal_id: str | None = Query(None, alias="filters[dealId]"),
    owner_id: str | None = Query(None, alias="filters[ownerId]"),
):
    service = ActivityService(db)
    result = await service.get_all(
        organization_id=user["organization_id"],
        params=params,
        type=type,
        priority=priority,
        is_completed=is_completed,
        contact_id=contact_id,
        deal_id=deal_id,
        owner_id=owner_id,
    )
    result["data"] = [
        ActivityResponse.model_validate(a).model_dump() for a in result["data"]
    ]
    return result


@router.get("/{activity_id}")
async def get_activity(activity_id: str, db: DBSession, user: CurrentUser):
    service = ActivityService(db)
    activity = await service.get_by_id(activity_id, user["organization_id"])
    return ActivityResponse.model_validate(activity)


@router.post("", status_code=201)
async def create_activity(body: ActivityCreate, db: DBSession, user: CurrentUser):
    if not body.owner_id:
        body.owner_id = user["id"]
    service = ActivityService(db)
    activity = await service.create(body, user["organization_id"])
    return ActivityResponse.model_validate(activity)


@router.patch("/{activity_id}")
async def update_activity(activity_id: str, body: ActivityUpdate, db: DBSession, user: CurrentUser):
    service = ActivityService(db)
    activity = await service.update(activity_id, body, user["organization_id"])
    return ActivityResponse.model_validate(activity)


@router.patch("/{activity_id}/toggle")
async def toggle_activity(activity_id: str, db: DBSession, user: CurrentUser):
    """Toggle activity completion."""
    service = ActivityService(db)
    activity = await service.toggle_complete(activity_id, user["organization_id"])
    return ActivityResponse.model_validate(activity)


@router.delete("/{activity_id}", status_code=204)
async def delete_activity(activity_id: str, db: DBSession, user: CurrentUser):
    service = ActivityService(db)
    await service.delete(activity_id, user["organization_id"])
