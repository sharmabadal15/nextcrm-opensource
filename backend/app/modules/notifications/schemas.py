"""Notification Pydantic schemas."""

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    read: bool
    link: str | None = None
    created_at: str

    model_config = {"from_attributes": True}
