"""Auth routes — login, register, refresh, me, change-password."""

from fastapi import APIRouter

from app.dependencies import CurrentUser, DBSession
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.modules.auth.service import AuthService

router = APIRouter()


# POST /auth/login
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: DBSession):
    """Authenticate user and return JWT tokens."""
    service = AuthService(db)
    user, tokens = await service.authenticate(body.email, body.password)
    return tokens


# POST /auth/register
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: DBSession):
    """Register a new user and return JWT tokens."""
    service = AuthService(db)
    user, tokens = await service.register(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        password=body.password,
        organization_name=getattr(body, "organization_name", None),
    )
    return tokens


# POST /auth/refresh
@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: DBSession):
    """Refresh JWT access token."""
    service = AuthService(db)
    tokens = await service.refresh_access_token(body.refresh_token)
    return tokens


# POST /auth/logout
@router.post("/logout")
async def logout(user: CurrentUser):
    """Invalidate refresh token (client-side token discard)."""
    return {"message": "Logged out successfully"}


# GET /auth/me
@router.get("/me", response_model=UserResponse)
async def get_current_user(user: CurrentUser, db: DBSession):
    """Get current user profile from JWT."""
    service = AuthService(db)
    db_user = await service.get_user_by_id(user["id"])
    return _user_to_response(db_user)


# PATCH /auth/me
@router.patch("/me", response_model=UserResponse)
async def update_profile(body: UpdateProfileRequest, user: CurrentUser, db: DBSession):
    """Update current user profile."""
    service = AuthService(db)
    db_user = await service.update_profile(user["id"], body.model_dump(exclude_unset=True))
    return _user_to_response(db_user)


# POST /auth/change-password
@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, user: CurrentUser, db: DBSession):
    """Change current user password."""
    service = AuthService(db)
    await service.change_password(user["id"], body.current_password, body.new_password)
    return {"message": "Password changed successfully"}


def _user_to_response(user) -> dict:
    """Convert User model to response dict."""
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "avatar": user.avatar,
        "role": user.role,
        "organization_id": user.organization_id,
        "is_active": user.is_active,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
