"""Contact API routes."""

from fastapi import APIRouter, Depends, Query

from app.core.pagination import PaginationParams, get_pagination_params
from app.dependencies import CurrentUser, DBSession
from app.modules.contacts.schemas import ContactCreate, ContactResponse, ContactUpdate
from app.modules.contacts.service import ContactService

router = APIRouter()


@router.get("")
async def list_contacts(
    db: DBSession,
    user: CurrentUser,
    params: PaginationParams = Depends(get_pagination_params),
    status: str | None = Query(None, alias="filters[status]"),
    source: str | None = Query(None, alias="filters[source]"),
    owner_id: str | None = Query(None, alias="filters[ownerId]"),
):
    """List contacts with pagination, search, sort, filters."""
    service = ContactService(db)
    result = await service.get_all(
        organization_id=user["organization_id"],
        params=params,
        status=status,
        source=source,
        owner_id=owner_id,
    )
    result["data"] = [
        ContactResponse.model_validate(c).model_dump() for c in result["data"]
    ]
    return result


@router.get("/{contact_id}")
async def get_contact(contact_id: str, db: DBSession, user: CurrentUser):
    """Get a single contact by ID."""
    service = ContactService(db)
    contact = await service.get_by_id(contact_id, user["organization_id"])
    return ContactResponse.model_validate(contact)


@router.post("", status_code=201)
async def create_contact(body: ContactCreate, db: DBSession, user: CurrentUser):
    """Create a new contact."""
    if not body.owner_id:
        body.owner_id = user["id"]
    service = ContactService(db)
    contact = await service.create(body, user["organization_id"])
    return ContactResponse.model_validate(contact)


@router.patch("/{contact_id}")
async def update_contact(contact_id: str, body: ContactUpdate, db: DBSession, user: CurrentUser):
    """Update a contact."""
    service = ContactService(db)
    contact = await service.update(contact_id, body, user["organization_id"])
    return ContactResponse.model_validate(contact)


@router.delete("/{contact_id}", status_code=204)
async def delete_contact(contact_id: str, db: DBSession, user: CurrentUser):
    """Soft-delete a contact."""
    service = ContactService(db)
    await service.delete(contact_id, user["organization_id"])
