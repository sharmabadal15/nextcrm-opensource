"""Pipeline business logic."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError
from app.modules.deals.models import Deal
from app.modules.pipelines.models import Pipeline, PipelineStage


class PipelineService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self, organization_id: str) -> list[Pipeline]:
        result = await self.session.execute(
            select(Pipeline).where(Pipeline.organization_id == organization_id)
        )
        return list(result.scalars().all())

    async def get_by_id(self, pipeline_id: str, organization_id: str) -> dict:
        """Get pipeline with stages + deal counts/values."""
        result = await self.session.execute(
            select(Pipeline).where(
                Pipeline.id == pipeline_id,
                Pipeline.organization_id == organization_id,
            )
        )
        pipeline = result.scalar_one_or_none()
        if not pipeline:
            raise NotFoundError("Pipeline", pipeline_id)

        # Get deal counts and values per stage
        stats_result = await self.session.execute(
            select(
                Deal.stage_id,
                func.count(Deal.id).label("deal_count"),
                func.coalesce(func.sum(Deal.value), 0).label("total_value"),
            )
            .where(
                Deal.pipeline_id == pipeline_id,
                Deal.status == "open",
                Deal.deleted_at.is_(None),
            )
            .group_by(Deal.stage_id)
        )
        stats = {row.stage_id: {"deal_count": row.deal_count, "total_value": float(row.total_value)} for row in stats_result}

        stages_data = []
        for stage in pipeline.stages:
            s = stats.get(str(stage.id), {"deal_count": 0, "total_value": 0})
            stages_data.append({
                "id": str(stage.id),
                "name": stage.name,
                "order": stage.order,
                "probability": stage.probability,
                "color": stage.color,
                "deal_count": s["deal_count"],
                "total_value": s["total_value"],
            })

        return {
            "id": str(pipeline.id),
            "name": pipeline.name,
            "is_default": pipeline.is_default,
            "stages": stages_data,
        }
