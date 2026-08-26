"""Company API routes."""

from fastapi import APIRouter, Depends, Query

from app.core.pagination import PaginationParams, get_pagination_params
from app.dependencies import CurrentUser, DBSession
from app.modules.companies.schemas import CompanyCreate, CompanyResponse, CompanyUpdate
from app.modules.companies.service import CompanyService

router = APIRouter()


@router.get("")
async def list_companies(
    db: DBSession,
    user: CurrentUser,
    params: PaginationParams = Depends(get_pagination_params),
    industry: str | None = Query(None, alias="filters[industry]"),
    owner_id: str | None = Query(None, alias="filters[ownerId]"),
):
    service = CompanyService(db)
    result = await service.get_all(
        organization_id=user["organization_id"],
        params=params,
        industry=industry,
        owner_id=owner_id,
    )
    result["data"] = [
        CompanyResponse.model_validate(c).model_dump() for c in result["data"]
    ]
    return result


@router.get("/{company_id}")
async def get_company(company_id: str, db: DBSession, user: CurrentUser):
    service = CompanyService(db)
    company = await service.get_by_id(company_id, user["organization_id"])
    return CompanyResponse.model_validate(company)


@router.post("", status_code=201)
async def create_company(body: CompanyCreate, db: DBSession, user: CurrentUser):
    if not body.owner_id:
        body.owner_id = user["id"]
    service = CompanyService(db)
    company = await service.create(body, user["organization_id"])
    return CompanyResponse.model_validate(company)


@router.patch("/{company_id}")
async def update_company(company_id: str, body: CompanyUpdate, db: DBSession, user: CurrentUser):
    service = CompanyService(db)
    company = await service.update(company_id, body, user["organization_id"])
    return CompanyResponse.model_validate(company)


@router.delete("/{company_id}", status_code=204)
async def delete_company(company_id: str, db: DBSession, user: CurrentUser):
    service = CompanyService(db)
    await service.delete(company_id, user["organization_id"])
