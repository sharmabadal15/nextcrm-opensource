"""Reusable pagination, sorting, and filtering utilities."""

from dataclasses import dataclass

from fastapi import Query
from sqlalchemy import Select, asc, desc, func
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class PaginationParams:
    """Query parameters for pagination."""
    page: int = 1
    per_page: int = 10
    search: str | None = None
    sort_field: str | None = None
    sort_direction: str = "asc"


def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number"),
    perPage: int = Query(10, ge=1, le=500, alias="perPage", description="Items per page"),
    search: str | None = Query(None, description="Search term"),
    sort_field: str | None = Query(None, alias="sort[field]", description="Sort field"),
    sort_direction: str = Query("asc", alias="sort[direction]", description="Sort direction"),
) -> PaginationParams:
    """Parse pagination query parameters."""
    return PaginationParams(
        page=page,
        per_page=perPage,
        search=search,
        sort_field=sort_field,
        sort_direction=sort_direction,
    )


async def paginate(
    session: AsyncSession,
    query: Select,
    params: PaginationParams,
) -> dict:
    """Execute a paginated query and return data + meta."""
    # Count total
    count_query = query.with_only_columns(func.count()).order_by(None)
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    total_pages = max(1, (total + params.per_page - 1) // params.per_page)
    offset = (params.page - 1) * params.per_page
    paginated_query = query.offset(offset).limit(params.per_page)

    result = await session.execute(paginated_query)
    data = result.scalars().all()

    return {
        "data": data,
        "meta": {
            "total": total,
            "page": params.page,
            "perPage": params.per_page,
            "totalPages": total_pages,
        },
    }


def apply_sorting(query: Select, model, params: PaginationParams) -> Select:
    """Apply sorting to a SQLAlchemy query."""
    if params.sort_field and hasattr(model, params.sort_field):
        column = getattr(model, params.sort_field)
        if params.sort_direction == "desc":
            query = query.order_by(desc(column))
        else:
            query = query.order_by(asc(column))
    else:
        query = query.order_by(desc(model.created_at))
    return query
