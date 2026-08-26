"""Pipeline API routes."""

from fastapi import APIRouter

from app.dependencies import CurrentUser, DBSession
from app.modules.pipelines.schemas import PipelineResponse
from app.modules.pipelines.service import PipelineService

router = APIRouter()


@router.get("")
async def list_pipelines(db: DBSession, user: CurrentUser):
    service = PipelineService(db)
    pipelines = await service.get_all(user["organization_id"])
    return [PipelineResponse.model_validate(p) for p in pipelines]


@router.get("/{pipeline_id}")
async def get_pipeline(pipeline_id: str, db: DBSession, user: CurrentUser):
    """Pipeline with stages + deal counts/values."""
    service = PipelineService(db)
    return await service.get_by_id(pipeline_id, user["organization_id"])
