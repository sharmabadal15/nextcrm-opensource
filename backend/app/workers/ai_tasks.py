"""AI-related Celery tasks (stubs for future implementation)."""

from app.workers.celery_app import celery_app


@celery_app.task(name="generate_embeddings")
def generate_embeddings(entity_type: str, entity_id: str):
    """Generate vector embeddings for a CRM entity (note, activity, email)."""
    raise NotImplementedError


@celery_app.task(name="transcribe_meeting")
def transcribe_meeting(file_id: str):
    """Transcribe meeting audio via Whisper and extract action items."""
    raise NotImplementedError


@celery_app.task(name="score_leads")
def score_leads(organization_id: str):
    """Run predictive lead scoring model for an organization."""
    raise NotImplementedError


@celery_app.task(name="generate_email_draft")
def generate_email_draft(deal_id: str, contact_id: str | None = None):
    """Generate a context-aware email draft for a deal."""
    raise NotImplementedError
