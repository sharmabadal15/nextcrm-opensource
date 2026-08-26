"""File Pydantic schemas."""

from pydantic import BaseModel


class FileResponse(BaseModel):
    id: str
    name: str
    mime_type: str
    size: int
    category: str
    url: str
    uploaded_by: str
    entity_type: str
    entity_id: str
    created_at: str

    model_config = {"from_attributes": True}
