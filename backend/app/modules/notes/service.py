"""Note business logic."""

from sqlalchemy.ext.asyncio import AsyncSession


class NoteService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_entity(self, entity_type: str, entity_id: str, organization_id: str):
        raise NotImplementedError

    async def create(self, data: dict, organization_id: str):
        raise NotImplementedError

    async def update(self, note_id: str, data: dict, organization_id: str):
        raise NotImplementedError

    async def delete(self, note_id: str, organization_id: str):
        raise NotImplementedError
