"""Company Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.schemas import CRMBaseSchema
from app.modules.contacts.schemas import AddressSchema


class CompanyCreate(CRMBaseSchema):
    name: str = Field(min_length=1, max_length=200)
    domain: str | None = None
    industry: str | None = None
    employee_count: str | None = None
    annual_revenue: int | None = None
    phone: str | None = None
    website: str | None = None
    owner_id: str | None = None
    tags: list[str] = []
    address: AddressSchema | None = None
    custom_fields: dict = {}


class CompanyUpdate(CRMBaseSchema):
    name: str | None = None
    domain: str | None = None
    industry: str | None = None
    employee_count: str | None = None
    annual_revenue: int | None = None
    phone: str | None = None
    website: str | None = None
    owner_id: str | None = None
    tags: list[str] | None = None
    address: AddressSchema | None = None
    custom_fields: dict | None = None


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    domain: str | None = None
    logo: str | None = None
    industry: str | None = None
    employee_count: str | None = None
    annual_revenue: int | None = None
    address: dict | None = None
    phone: str | None = None
    website: str | None = None
    contact_ids: list[str] = []
    deal_ids: list[str] = []
    owner_id: str
    tags: list[str] = []
    custom_fields: dict = {}
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def extract_relation_ids(cls, data):
        """Extract contact and deal IDs from relationships."""
        if hasattr(data, "contacts"):
            data.contact_ids = [str(c.id) for c in (data.contacts or [])]  # type: ignore
        if hasattr(data, "deals"):
            data.deal_ids = [str(d.id) for d in (data.deals or [])] if hasattr(data, "deals") else []  # type: ignore
        return data
