"""Deal-specific filter and search logic."""

from fastapi import Query
from sqlalchemy import Select

from app.modules.deals.models import Deal


def apply_deal_filters(
    query: Select,
    status: str | None = Query(None, alias="filters[status]"),
    stage_id: str | None = Query(None, alias="filters[stageId]"),
    owner_id: str | None = Query(None, alias="filters[ownerId]"),
    pipeline_id: str | None = Query(None, alias="filters[pipelineId]"),
) -> Select:
    if status:
        query = query.where(Deal.status == status)
    if stage_id:
        query = query.where(Deal.stage_id == stage_id)
    if owner_id:
        query = query.where(Deal.owner_id == owner_id)
    if pipeline_id:
        query = query.where(Deal.pipeline_id == pipeline_id)
    return query


def apply_deal_search(query: Select, search: str) -> Select:
    term = f"%{search}%"
    return query.where(Deal.title.ilike(term))
