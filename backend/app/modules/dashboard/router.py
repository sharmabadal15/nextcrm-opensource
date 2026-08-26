"""Dashboard API routes."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats():
    """Aggregate stats for dashboard overview."""
    raise NotImplementedError
