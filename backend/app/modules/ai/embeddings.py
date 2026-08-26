"""pgvector embedding storage helpers (stub for future AI features)."""

# When implementing:
# 1. Use pgvector to store embeddings alongside CRM data
# 2. Use OpenAI ada-002 (1536 dims) or newer model for embeddings
# 3. Create embeddings for notes, activities, emails
# 4. Query with cosine similarity for RAG

# Example model:
# class Embedding(Base):
#     __tablename__ = "embeddings"
#     entity_type: Mapped[str]  # "note", "activity", "email"
#     entity_id: Mapped[str]
#     content: Mapped[str]
#     embedding = mapped_column(Vector(1536))
#     organization_id: Mapped[str]
