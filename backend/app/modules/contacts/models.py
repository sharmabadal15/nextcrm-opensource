"""Contact SQLAlchemy model."""

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Contact(Base):
    __tablename__ = "contacts"

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    avatar: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    company_id: Mapped[str | None] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        Enum("active", "inactive", "lead", "prospect", "customer", name="contact_status"),
        default="lead",
    )
    source: Mapped[str | None] = mapped_column(
        Enum("website", "referral", "linkedin", "cold_call", "event", "other", name="lead_source"),
        nullable=True,
    )
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    custom_fields: Mapped[dict] = mapped_column(JSONB, default=dict)
    address: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    social_profiles: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    last_contacted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    company = relationship("Company", back_populates="contacts", lazy="selectin")
    owner = relationship("User", lazy="selectin")
