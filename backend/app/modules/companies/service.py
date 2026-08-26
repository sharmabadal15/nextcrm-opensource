"""Company business logic."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import PaginationParams, apply_sorting, paginate
from app.exceptions import NotFoundError
from app.modules.companies.filters import apply_company_filters, apply_company_search
from app.modules.companies.models import Company
from app.modules.companies.schemas import CompanyCreate, CompanyUpdate


class CompanyService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(
        self,
        organization_id: str,
        params: PaginationParams,
        industry: str | None = None,
        owner_id: str | None = None,
    ) -> dict:
        query = select(Company).where(
            Company.organization_id == organization_id,
            Company.deleted_at.is_(None),
        )
        if params.search:
            query = apply_company_search(query, params.search)
        query = apply_company_filters(query, industry=industry, owner_id=owner_id)
        query = apply_sorting(query, Company, params)
        return await paginate(self.session, query, params)

    async def get_by_id(self, company_id: str, organization_id: str) -> Company:
        result = await self.session.execute(
            select(Company).where(
                Company.id == company_id,
                Company.organization_id == organization_id,
                Company.deleted_at.is_(None),
            )
        )
        company = result.scalar_one_or_none()
        if not company:
            raise NotFoundError("Company", company_id)
        return company

    async def create(self, data: CompanyCreate, organization_id: str) -> Company:
        company = Company(
            **data.model_dump(exclude_unset=True),
            organization_id=organization_id,
        )
        self.session.add(company)
        await self.session.commit()
        await self.session.refresh(company)
        return company

    async def update(self, company_id: str, data: CompanyUpdate, organization_id: str) -> Company:
        company = await self.get_by_id(company_id, organization_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(company, field, value)
        await self.session.commit()
        await self.session.refresh(company)
        return company

    async def delete(self, company_id: str, organization_id: str) -> None:
        company = await self.get_by_id(company_id, organization_id)
        company.deleted_at = datetime.now(timezone.utc)
        await self.session.commit()
