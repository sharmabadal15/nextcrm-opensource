"""AI API routes (stubs — implement when AI features are ready)."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/chat")
async def ai_chat():
    """RAG-powered chat — ask questions about CRM data."""
    raise NotImplementedError


@router.post("/draft-email")
async def draft_email():
    """Generate context-aware email draft for a deal/contact."""
    raise NotImplementedError


@router.post("/score-leads")
async def score_leads():
    """Trigger predictive lead scoring for the organization."""
    raise NotImplementedError


@router.post("/transcribe")
async def transcribe_meeting():
    """Upload meeting audio for transcription + action item extraction."""
    raise NotImplementedError
