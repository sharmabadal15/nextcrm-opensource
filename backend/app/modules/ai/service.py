"""AI service stubs — implement when AI features are ready."""

from abc import ABC, abstractmethod


class AIService(ABC):
    """Abstract base for AI operations."""

    @abstractmethod
    async def chat(self, query: str, organization_id: str) -> dict:
        """RAG chat — search CRM data and generate a response."""
        ...

    @abstractmethod
    async def draft_email(self, context: dict) -> dict:
        """Generate a context-aware email draft."""
        ...

    @abstractmethod
    async def score_leads(self, organization_id: str) -> dict:
        """Run predictive lead scoring."""
        ...

    @abstractmethod
    async def transcribe_meeting(self, file_id: str) -> dict:
        """Transcribe audio and extract action items."""
        ...
