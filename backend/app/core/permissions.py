"""Role-Based Access Control (RBAC) dependencies."""

from functools import wraps

from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user_from_token

ROLE_HIERARCHY = {
    "admin": 4,
    "manager": 3,
    "sales_rep": 2,
    "viewer": 1,
}


def require_role(*allowed_roles: str):
    """Dependency factory: require user to have one of the specified roles."""

    async def role_checker(
        current_user: dict = Depends(get_current_user_from_token),
    ) -> dict:
        user_role = current_user.get("role", "viewer")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role}' is not authorized. Required: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker


def require_minimum_role(minimum_role: str):
    """Dependency factory: require user to have at least the specified role level."""

    min_level = ROLE_HIERARCHY.get(minimum_role, 0)

    async def role_checker(
        current_user: dict = Depends(get_current_user_from_token),
    ) -> dict:
        user_role = current_user.get("role", "viewer")
        user_level = ROLE_HIERARCHY.get(user_role, 0)
        if user_level < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Minimum role required: {minimum_role}",
            )
        return current_user

    return role_checker


# Convenience dependencies
RequireAdmin = Depends(require_role("admin"))
RequireManager = Depends(require_minimum_role("manager"))
RequireSalesRep = Depends(require_minimum_role("sales_rep"))
RequireViewer = Depends(require_minimum_role("viewer"))
