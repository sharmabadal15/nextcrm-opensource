"""Shared Pydantic base schemas and validators.

All Create/Update schemas should inherit from CRMBaseSchema so that
empty-string sanitisation, common validators, and future cross-cutting
concerns (e.g. audit fields, field-level permissions) are applied once
and inherited everywhere.
"""

from pydantic import BaseModel, model_validator


class CRMBaseSchema(BaseModel):
    """Base schema that strips empty-string optional fields from input.

    Empty strings are **removed** (not set to None) so that Pydantic's
    ``exclude_unset=True`` correctly skips them in update operations.
    For create operations the field default (usually None) takes effect.

    This prevents PostgreSQL cast errors (e.g. '' → UUID, '' → DATE)
    without requiring per-field validators in every entity schema.
    """

    @model_validator(mode="before")
    @classmethod
    def strip_empty_strings(cls, values: dict) -> dict:  # type: ignore[override]
        if not isinstance(values, dict):
            return values
        return {
            k: v
            for k, v in values.items()
            if not (isinstance(v, str) and v.strip() == "")
        }
