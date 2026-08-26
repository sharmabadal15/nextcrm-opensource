"""Contact-specific filter and search logic."""

from fastapi import Query
from sqlalchemy import Select, func, or_

from app.modules.contacts.models import Contact


def apply_contact_filters(
    query: Select,
    status: str | None = Query(None, alias="filters[status]"),
    source: str | None = Query(None, alias="filters[source]"),
    owner_id: str | None = Query(None, alias="filters[ownerId]"),
) -> Select:
    """Apply filterable fields to contacts query."""
    if status:
        query = query.where(Contact.status == status)
    if source:
        query = query.where(Contact.source == source)
    if owner_id:
        query = query.where(Contact.owner_id == owner_id)
    return query


def apply_contact_search(query: Select, search: str) -> Select:
    """Apply full-text search across contact searchable fields."""
    term = f"%{search}%"
    full_name = func.concat(Contact.first_name, " ", Contact.last_name)
    return query.where(
        or_(
            Contact.first_name.ilike(term),
            Contact.last_name.ilike(term),
            full_name.ilike(term),
            Contact.email.ilike(term),
            Contact.title.ilike(term),
        )
    )
