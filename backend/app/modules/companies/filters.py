"""Company-specific filter and search logic."""

from fastapi import Query
from sqlalchemy import Select, or_

from app.modules.companies.models import Company


def apply_company_filters(
    query: Select,
    industry: str | None = Query(None, alias="filters[industry]"),
    owner_id: str | None = Query(None, alias="filters[ownerId]"),
) -> Select:
    if industry:
        query = query.where(Company.industry == industry)
    if owner_id:
        query = query.where(Company.owner_id == owner_id)
    return query


def apply_company_search(query: Select, search: str) -> Select:
    term = f"%{search}%"
    return query.where(
        or_(
            Company.name.ilike(term),
            Company.domain.ilike(term),
            Company.industry.ilike(term),
        )
    )
