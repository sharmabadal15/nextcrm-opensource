"""Pipeline Pydantic schemas."""

from pydantic import BaseModel


class PipelineStageResponse(BaseModel):
    id: str
    name: str
    order: int
    probability: int
    color: str
    deal_count: int = 0
    total_value: float = 0

    model_config = {"from_attributes": True}


class PipelineResponse(BaseModel):
    id: str
    name: str
    is_default: bool
    stages: list[PipelineStageResponse] = []

    model_config = {"from_attributes": True}
