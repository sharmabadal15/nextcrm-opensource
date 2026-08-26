"""Contact Pydantic schemas — request/response validation."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.schemas import CRMBaseSchema


class AddressSchema(BaseModel):
    street: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    country: str | None = None


class SocialProfilesSchema(BaseModel):
    linkedin: str | None = None
    twitter: str | None = None
    facebook: str | None = None
    github: str | None = None


class ContactCreate(CRMBaseSchema):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = None
    title: str | None = None
    company_id: str | None = None
    status: str = "lead"
    source: str | None = None
    owner_id: str | None = None
    tags: list[str] = []
    address: AddressSchema | None = None
    social_profiles: SocialProfilesSchema | None = None
    custom_fields: dict = {}


class ContactUpdate(CRMBaseSchema):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    title: str | None = None
    company_id: str | None = None
    status: str | None = None
    source: str | None = None
    owner_id: str | None = None
    tags: list[str] | None = None
    address: AddressSchema | None = None
    social_profiles: SocialProfilesSchema | None = None
    custom_fields: dict | None = None


class CompanyBrief(BaseModel):
    """Minimal company info for embedding in contact responses."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    domain: str | None = None
    logo: str | None = None


class OwnerBrief(BaseModel):
    """Minimal user info for embedding in contact responses."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    first_name: str
    last_name: str
    email: str
    avatar: str | None = None


class ContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    avatar: str | None = None
    title: str | None = None
    company_id: str | None = None
    company: CompanyBrief | None = None
    status: str
    source: str | None = None
    tags: list[str] = []
    owner_id: str
    owner: OwnerBrief | None = None
    custom_fields: dict = {}
    address: dict | None = None
    social_profiles: dict | None = None
    last_contacted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
