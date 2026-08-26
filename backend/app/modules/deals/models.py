"""Deal SQLAlchemy model."""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Deal(Base):
    __tablename__ = "deals"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    pipeline_id: Mapped[str] = mapped_column(
        ForeignKey("pipelines.id", ondelete="RESTRICT"), nullable=False
    )
    stage_id: Mapped[str] = mapped_column(
        ForeignKey("pipeline_stages.id", ondelete="RESTRICT"), nullable=False
    )
    probability: Mapped[int] = mapped_column(Integer, default=10)
    expected_close_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_close_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("open", "won", "lost", name="deal_status"), default="open"
    )
    lost_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_id: Mapped[str | None] = mapped_column(
        ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True
    )
    company_id: Mapped[str | None] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), nullable=True
    )
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
    pipeline = relationship("Pipeline", lazy="selectin")
    stage = relationship("PipelineStage", lazy="selectin")
    contact = relationship("Contact", lazy="selectin")
    company = relationship("Company", lazy="selectin")
    owner = relationship("User", lazy="selectin")
