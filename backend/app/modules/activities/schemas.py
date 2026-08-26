"""Activity Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.schemas import CRMBaseSchema


class ActivityCreate(CRMBaseSchema):
    type: str
    subject: str = Field(min_length=1)
    description: str | None = None
    priority: str = "medium"
    due_date: datetime | None = None
    contact_id: str | None = None
    company_id: str | None = None
    deal_id: str | None = None
    owner_id: str | None = None
    participants: list[str] | None = None
    duration: int | None = None
    is_completed: bool = False


class ActivityUpdate(CRMBaseSchema):
    type: str | None = None
    subject: str | None = None
    description: str | None = None
    priority: str | None = None
    due_date: datetime | None = None
    contact_id: str | None = None
    company_id: str | None = None
    deal_id: str | None = None
    owner_id: str | None = None
    participants: list[str] | None = None
    duration: int | None = None
    is_completed: bool | None = None
    outcome: str | None = None


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    subject: str
    description: str | None = None
    rich_description: dict | None = None
    due_date: datetime | None = None
    completed_at: datetime | None = None
    is_completed: bool
    priority: str
    contact_id: str | None = None
    company_id: str | None = None
    deal_id: str | None = None
    owner_id: str
    participants: list[str] | None = None
    duration: int | None = None
    outcome: str | None = None
    created_at: datetime
    updated_at: datetime
