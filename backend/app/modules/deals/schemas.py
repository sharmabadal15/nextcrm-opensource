"""Deal Pydantic schemas."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.schemas import CRMBaseSchema


class DealCreate(CRMBaseSchema):
    title: str = Field(min_length=1, max_length=200)
    value: float = Field(ge=0)
    currency: str = "USD"
    pipeline_id: str
    stage_id: str
    probability: int = Field(ge=0, le=100, default=10)
    expected_close_date: date | None = None
    contact_id: str | None = None
    company_id: str | None = None
    owner_id: str | None = None
    tags: list[str] = []
    custom_fields: dict = {}


class DealUpdate(CRMBaseSchema):
    title: str | None = None
    value: float | None = None
    currency: str | None = None
    pipeline_id: str | None = None
    stage_id: str | None = None
    probability: int | None = None
    expected_close_date: date | None = None
    actual_close_date: date | None = None
    status: str | None = None
    lost_reason: str | None = None
    contact_id: str | None = None
    company_id: str | None = None
    owner_id: str | None = None
    tags: list[str] | None = None
    custom_fields: dict | None = None


class DealStageUpdate(BaseModel):
    stage_id: str


class StageBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    order: int
    probability: int
    color: str


class ContactBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    first_name: str
    last_name: str
    email: str


class CompanyBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str


class OwnerBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    first_name: str
    last_name: str
    email: str
    avatar: str | None = None


class DealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    value: float
    currency: str
    pipeline_id: str
    stage_id: str
    stage: StageBrief | None = None
    probability: int
    expected_close_date: date | None = None
    actual_close_date: date | None = None
    status: str
    lost_reason: str | None = None
    contact_id: str | None = None
    contact: ContactBrief | None = None
    company_id: str | None = None
    company: CompanyBrief | None = None
    owner_id: str
    owner: OwnerBrief | None = None
    tags: list[str] = []
    custom_fields: dict = {}
    created_at: datetime
    updated_at: datetime
