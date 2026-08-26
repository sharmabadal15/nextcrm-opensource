"""Notification API routes."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_notifications():
    """Current user's notifications."""
    raise NotImplementedError


@router.patch("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    raise NotImplementedError


@router.patch("/read-all")
async def mark_all_notifications_read():
    raise NotImplementedError


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    raise NotImplementedError
