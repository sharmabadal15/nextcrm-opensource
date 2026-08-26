"""Email-related Celery tasks."""

from app.workers.celery_app import celery_app


@celery_app.task(name="send_notification_email")
def send_notification_email(user_email: str, subject: str, body: str):
    """Send a notification email to a user."""
    raise NotImplementedError


@celery_app.task(name="send_bulk_emails")
def send_bulk_emails(email_ids: list[str]):
    """Process and send bulk email campaigns."""
    raise NotImplementedError
