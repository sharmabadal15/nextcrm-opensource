"""Note Pydantic schemas."""

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    title: str = Field(min_length=1)
    content: str
    entity_type: str
    entity_id: str
    owner_id: str


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    entity_type: str
    entity_id: str
    owner_id: str
    owner: dict | None = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}
