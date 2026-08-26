#!/bin/bash
# Run Alembic migrations
echo "🔄 Running migrations..."
alembic upgrade head
echo "✓ Migrations complete"
