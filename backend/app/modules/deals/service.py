"""Deal business logic."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import PaginationParams, apply_sorting, paginate
from app.exceptions import NotFoundError
from app.modules.deals.filters import apply_deal_filters, apply_deal_search
from app.modules.deals.models import Deal
from app.modules.deals.schemas import DealCreate, DealStageUpdate, DealUpdate
from app.modules.pipelines.models import PipelineStage


class DealService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(
        self,
        organization_id: str,
        params: PaginationParams,
        status: str | None = None,
        stage_id: str | None = None,
        owner_id: str | None = None,
        pipeline_id: str | None = None,
    ) -> dict:
        query = select(Deal).where(
            Deal.organization_id == organization_id,
            Deal.deleted_at.is_(None),
        )
        if params.search:
            query = apply_deal_search(query, params.search)
        query = apply_deal_filters(
            query, status=status, stage_id=stage_id,
            owner_id=owner_id, pipeline_id=pipeline_id,
        )
        query = apply_sorting(query, Deal, params)
        return await paginate(self.session, query, params)

    async def get_by_pipeline(self, pipeline_id: str, organization_id: str) -> list[Deal]:
        """Get all deals for a pipeline (Kanban view)."""
        result = await self.session.execute(
            select(Deal).where(
                Deal.pipeline_id == pipeline_id,
                Deal.organization_id == organization_id,
                Deal.deleted_at.is_(None),
            ).order_by(Deal.created_at)
        )
        return list(result.scalars().all())

    async def get_by_id(self, deal_id: str, organization_id: str) -> Deal:
        result = await self.session.execute(
            select(Deal).where(
                Deal.id == deal_id,
                Deal.organization_id == organization_id,
                Deal.deleted_at.is_(None),
            )
        )
        deal = result.scalar_one_or_none()
        if not deal:
            raise NotFoundError("Deal", deal_id)
        return deal

    async def create(self, data: DealCreate, organization_id: str) -> Deal:
        deal = Deal(
            **data.model_dump(exclude_unset=True),
            organization_id=organization_id,
        )
        self.session.add(deal)
        await self.session.commit()
        await self.session.refresh(deal)
        return deal

    async def update(self, deal_id: str, data: DealUpdate, organization_id: str) -> Deal:
        deal = await self.get_by_id(deal_id, organization_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(deal, field, value)
        await self.session.commit()
        await self.session.refresh(deal)
        return deal

    async def update_stage(self, deal_id: str, data: DealStageUpdate, organization_id: str) -> Deal:
        """Move deal to a new stage (Kanban drag-drop)."""
        deal = await self.get_by_id(deal_id, organization_id)
        deal.stage_id = data.stage_id

        # Auto-set status based on target stage name
        stage_result = await self.session.execute(
            select(PipelineStage).where(PipelineStage.id == data.stage_id)
        )
        stage = stage_result.scalar_one_or_none()
        if stage:
            stage_lower = stage.name.lower()
            if "won" in stage_lower:
                deal.status = "won"
                deal.actual_close_date = datetime.now(timezone.utc).date()
            elif "lost" in stage_lower:
                deal.status = "lost"
                deal.actual_close_date = datetime.now(timezone.utc).date()
            else:
                deal.status = "open"
                deal.actual_close_date = None

        await self.session.commit()
        return await self.get_by_id(deal_id, organization_id)

    async def delete(self, deal_id: str, organization_id: str) -> None:
        deal = await self.get_by_id(deal_id, organization_id)
        deal.deleted_at = datetime.now(timezone.utc)
        await self.session.commit()
