"""Activity-specific filter and search logic."""

from fastapi import Query
from sqlalchemy import Select, or_

from app.modules.activities.models import Activity


def apply_activity_filters(
    query: Select,
    type: str | None = Query(None, alias="filters[type]"),
    priority: str | None = Query(None, alias="filters[priority]"),
    is_completed: bool | None = Query(None, alias="filters[isCompleted]"),
    contact_id: str | None = Query(None, alias="filters[contactId]"),
    deal_id: str | None = Query(None, alias="filters[dealId]"),
    owner_id: str | None = Query(None, alias="filters[ownerId]"),
) -> Select:
    if type:
        query = query.where(Activity.type == type)
    if priority:
        query = query.where(Activity.priority == priority)
    if is_completed is not None:
        query = query.where(Activity.is_completed == is_completed)
    if contact_id:
        query = query.where(Activity.contact_id == contact_id)
    if deal_id:
        query = query.where(Activity.deal_id == deal_id)
    if owner_id:
        query = query.where(Activity.owner_id == owner_id)
    return query


def apply_activity_search(query: Select, search: str) -> Select:
    term = f"%{search}%"
    return query.where(
        or_(
            Activity.subject.ilike(term),
            Activity.description.ilike(term),
        )
    )
