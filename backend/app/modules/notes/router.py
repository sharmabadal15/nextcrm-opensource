"""Note API routes."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_notes():
    """Get notes by entity_type + entity_id query params."""
    raise NotImplementedError


@router.post("")
async def create_note():
    raise NotImplementedError


@router.patch("/{note_id}")
async def update_note(note_id: str):
    raise NotImplementedError


@router.delete("/{note_id}")
async def delete_note(note_id: str):
    raise NotImplementedError
