"""AI Pydantic schemas."""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    query: str
    context: dict | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict] = []


class DraftEmailRequest(BaseModel):
    deal_id: str | None = None
    contact_id: str | None = None
    tone: str = "professional"
    context: str | None = None


class DraftEmailResponse(BaseModel):
    subject: str
    body: str


class LeadScoreResponse(BaseModel):
    scored_count: int
    top_leads: list[dict] = []
