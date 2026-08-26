"""Reports API routes."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/pipeline")
async def pipeline_report():
    raise NotImplementedError


@router.get("/revenue")
async def revenue_report():
    raise NotImplementedError


@router.get("/activity")
async def activity_report():
    raise NotImplementedError


@router.get("/performance")
async def performance_report():
    raise NotImplementedError
