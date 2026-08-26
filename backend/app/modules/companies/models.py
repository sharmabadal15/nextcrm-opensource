"""Company SQLAlchemy model."""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo: Mapped[str | None] = mapped_column(Text, nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    employee_count: Mapped[str | None] = mapped_column(
        Enum("1-10", "11-50", "51-200", "201-1000", "1001+", name="company_size"),
        nullable=True,
    )
    annual_revenue: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    address: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    custom_fields: Mapped[dict] = mapped_column(JSONB, default=dict)
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    contacts = relationship("Contact", back_populates="company", lazy="selectin")
    owner = relationship("User", lazy="selectin")
