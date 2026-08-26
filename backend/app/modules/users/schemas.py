"""User Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.core.schemas import CRMBaseSchema


class UserUpdate(CRMBaseSchema):
    """Admin-level user update (role, active status)."""
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = None
    is_active: bool | None = None
    avatar: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    first_name: str
    last_name: str
    email: str
    avatar: str | None = None
    role: str
    team_id: str | None = None
    organization_id: str
    is_active: bool
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
