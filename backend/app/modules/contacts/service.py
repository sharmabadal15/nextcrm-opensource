"""Contact business logic."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import PaginationParams, apply_sorting, paginate
from app.exceptions import NotFoundError
from app.modules.contacts.filters import apply_contact_filters, apply_contact_search
from app.modules.contacts.models import Contact
from app.modules.contacts.schemas import ContactCreate, ContactUpdate


class ContactService:
    """Handles contact CRUD operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(
        self,
        organization_id: str,
        params: PaginationParams,
        status: str | None = None,
        source: str | None = None,
        owner_id: str | None = None,
    ) -> dict:
        """List contacts with pagination, search, sort, filters."""
        query = select(Contact).where(
            Contact.organization_id == organization_id,
            Contact.deleted_at.is_(None),
        )

        if params.search:
            query = apply_contact_search(query, params.search)

        query = apply_contact_filters(query, status=status, source=source, owner_id=owner_id)
        query = apply_sorting(query, Contact, params)

        return await paginate(self.session, query, params)

    async def get_by_id(self, contact_id: str, organization_id: str) -> Contact:
        """Get a single contact by ID."""
        result = await self.session.execute(
            select(Contact).where(
                Contact.id == contact_id,
                Contact.organization_id == organization_id,
                Contact.deleted_at.is_(None),
            )
        )
        contact = result.scalar_one_or_none()
        if not contact:
            raise NotFoundError("Contact", contact_id)
        return contact

    async def create(self, data: ContactCreate, organization_id: str) -> Contact:
        """Create a new contact."""
        contact = Contact(
            **data.model_dump(exclude_unset=True),
            organization_id=organization_id,
        )
        self.session.add(contact)
        await self.session.commit()
        await self.session.refresh(contact)
        return contact

    async def update(self, contact_id: str, data: ContactUpdate, organization_id: str) -> Contact:
        """Update a contact."""
        contact = await self.get_by_id(contact_id, organization_id)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contact, field, value)
        await self.session.commit()
        await self.session.refresh(contact)
        return contact

    async def delete(self, contact_id: str, organization_id: str) -> None:
        """Soft-delete a contact."""
        contact = await self.get_by_id(contact_id, organization_id)
        contact.deleted_at = datetime.now(timezone.utc)
        await self.session.commit()
