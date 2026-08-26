"""User/Team management API routes."""

from fastapi import APIRouter, Depends, Query

from app.core.pagination import PaginationParams, get_pagination_params
from app.dependencies import CurrentUser, DBSession
from app.modules.users.schemas import UserResponse, UserUpdate
from app.modules.users.service import UserService

router = APIRouter()


@router.get("")
async def list_users(
    db: DBSession,
    user: CurrentUser,
    params: PaginationParams = Depends(get_pagination_params),
    role: str | None = Query(None, alias="filters[role]"),
    is_active: bool | None = Query(None, alias="filters[isActive]"),
):
    """List all team members in the organization."""
    service = UserService(db)
    result = await service.get_all(
        organization_id=user["organization_id"],
        params=params,
        role=role,
        is_active=is_active,
    )
    result["data"] = [
        UserResponse.model_validate(u).model_dump() for u in result["data"]
    ]
    return result


@router.get("/{user_id}")
async def get_user(user_id: str, db: DBSession, user: CurrentUser):
    """Get a single user by ID."""
    service = UserService(db)
    found = await service.get_by_id(user_id, user["organization_id"])
    return UserResponse.model_validate(found)


@router.patch("/{user_id}")
async def update_user(user_id: str, body: UserUpdate, db: DBSession, user: CurrentUser):
    """Update user role, active status, or profile."""
    service = UserService(db)
    updated = await service.update(user_id, body, user["organization_id"])
    return UserResponse.model_validate(updated)


@router.delete("/{user_id}", status_code=204)
async def deactivate_user(user_id: str, db: DBSession, user: CurrentUser):
    """Soft-deactivate a user."""
    service = UserService(db)
    await service.deactivate(user_id, user["organization_id"])
