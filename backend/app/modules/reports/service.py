"""Reports analytics queries."""

from sqlalchemy.ext.asyncio import AsyncSession


class ReportsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def pipeline_report(self, organization_id: str) -> dict:
        """Pipeline stage distribution."""
        raise NotImplementedError

    async def revenue_report(self, organization_id: str) -> dict:
        """Revenue by month, by owner."""
        raise NotImplementedError

    async def activity_report(self, organization_id: str) -> dict:
        """Activity counts by type, by rep, over time."""
        raise NotImplementedError

    async def performance_report(self, organization_id: str) -> dict:
        """Rep leaderboard, conversion rates."""
        raise NotImplementedError
