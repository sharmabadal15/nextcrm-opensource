"""Dashboard aggregation queries."""

from sqlalchemy.ext.asyncio import AsyncSession


class DashboardService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_stats(self, organization_id: str) -> dict:
        """Aggregate: total contacts, companies, deals, revenue, pipeline value, win rate."""
        raise NotImplementedError
