"""Deal API routes."""

from fastapi import APIRouter, Depends, Query

from app.core.pagination import PaginationParams, get_pagination_params
from app.dependencies import CurrentUser, DBSession
from app.modules.deals.schemas import DealCreate, DealResponse, DealStageUpdate, DealUpdate
from app.modules.deals.service import DealService

router = APIRouter()


@router.get("")
async def list_deals(
    db: DBSession,
    user: CurrentUser,
    params: PaginationParams = Depends(get_pagination_params),
    status: str | None = Query(None, alias="filters[status]"),
    stage_id: str | None = Query(None, alias="filters[stageId]"),
    owner_id: str | None = Query(None, alias="filters[ownerId]"),
    pipeline_id: str | None = Query(None, alias="filters[pipelineId]"),
):
    service = DealService(db)
    result = await service.get_all(
        organization_id=user["organization_id"],
        params=params,
        status=status,
        stage_id=stage_id,
        owner_id=owner_id,
        pipeline_id=pipeline_id,
    )
    result["data"] = [
        DealResponse.model_validate(d).model_dump() for d in result["data"]
    ]
    return result


@router.get("/pipeline/{pipeline_id}")
async def get_deals_by_pipeline(pipeline_id: str, db: DBSession, user: CurrentUser):
    """All open deals for Kanban view (not paginated)."""
    service = DealService(db)
    deals = await service.get_by_pipeline(pipeline_id, user["organization_id"])
    return [DealResponse.model_validate(d) for d in deals]


@router.get("/{deal_id}")
async def get_deal(deal_id: str, db: DBSession, user: CurrentUser):
    service = DealService(db)
    deal = await service.get_by_id(deal_id, user["organization_id"])
    return DealResponse.model_validate(deal)


@router.post("", status_code=201)
async def create_deal(body: DealCreate, db: DBSession, user: CurrentUser):
    if not body.owner_id:
        body.owner_id = user["id"]
    service = DealService(db)
    deal = await service.create(body, user["organization_id"])
    return DealResponse.model_validate(deal)


@router.patch("/{deal_id}")
async def update_deal(deal_id: str, body: DealUpdate, db: DBSession, user: CurrentUser):
    service = DealService(db)
    deal = await service.update(deal_id, body, user["organization_id"])
    return DealResponse.model_validate(deal)


@router.patch("/{deal_id}/stage")
async def update_deal_stage(deal_id: str, body: DealStageUpdate, db: DBSession, user: CurrentUser):
    """Kanban drag-drop — update deal stage."""
    service = DealService(db)
    deal = await service.update_stage(deal_id, body, user["organization_id"])
    return DealResponse.model_validate(deal)


@router.delete("/{deal_id}", status_code=204)
async def delete_deal(deal_id: str, db: DBSession, user: CurrentUser):
    service = DealService(db)
    await service.delete(deal_id, user["organization_id"])
