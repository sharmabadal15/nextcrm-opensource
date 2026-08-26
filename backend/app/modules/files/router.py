"""File API routes."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_files():
    """Get files by entity_type + entity_id query params."""
    raise NotImplementedError


@router.post("/upload")
async def upload_file():
    """Multipart file upload."""
    raise NotImplementedError


@router.delete("/{file_id}")
async def delete_file(file_id: str):
    raise NotImplementedError
