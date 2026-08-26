"""FileAttachment SQLAlchemy model (polymorphic: contact/company/deal)."""

from sqlalchemy import BigInteger, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FileAttachment(Base):
    __tablename__ = "file_attachments"

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    category: Mapped[str] = mapped_column(
        Enum("contract", "proposal", "nda", "invoice", "other", name="file_category"),
        default="other",
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_by: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    entity_type: Mapped[str] = mapped_column(
        Enum("contact", "company", "deal", name="file_entity_type"), nullable=False
    )
    entity_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )

    # Relationships
    uploader = relationship("User", lazy="selectin")
