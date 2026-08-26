"""File business logic — upload to MinIO, CRUD metadata."""

from sqlalchemy.ext.asyncio import AsyncSession


class FileService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_entity(self, entity_type: str, entity_id: str, organization_id: str):
        raise NotImplementedError

    async def upload(self, file, entity_type: str, entity_id: str, category: str, uploaded_by: str, organization_id: str):
        """Upload file to MinIO and save metadata."""
        raise NotImplementedError

    async def delete(self, file_id: str, organization_id: str):
        """Delete file from MinIO and remove metadata."""
        raise NotImplementedError
