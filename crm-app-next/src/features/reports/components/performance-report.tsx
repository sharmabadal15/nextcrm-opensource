"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useUsersList } from "@/hooks/use-users";

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(val);
}

const CHART_TOOLTIP = {
  contentStyle: {
    background: "rgba(24,24,27,0.95)",
    border: "1px solid rgba(63,63,70,0.5)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#fafafa",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  labelStyle: { color: "#a1a1aa", fontSize: "11px" },
  itemStyle: { color: "#fafafa" },
};

export function PerformanceReport() {
  const { data: dealsData } = useDeals({ page: 1, perPage: 500 });
  const { data: users } = useUsersList();
  const allDeals = dealsData?.data ?? [];

  const data = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Win rate over time from real data
    const wonByMonth = new Map<number, number>();
    const totalByMonth = new Map<number, number>();
    const valueSumByMonth = new Map<number, number>();
    const wonCountByMonth = new Map<number, number>();
    for (let i = 0; i < 12; i++) {
      wonByMonth.set(i, 0);
      totalByMonth.set(i, 0);
      valueSumByMonth.set(i, 0);
      wonCountByMonth.set(i, 0);
    }
    allDeals.forEach((d) => {
      const mi = new Date(d.createdAt).getMonth();
      totalByMonth.set(mi, (totalByMonth.get(mi) ?? 0) + 1);
      if (d.status === "won") {
        wonByMonth.set(mi, (wonByMonth.get(mi) ?? 0) + 1);
        valueSumByMonth.set(mi, (valueSumByMonth.get(mi) ?? 0) + d.value);
        wonCountByMonth.set(mi, (wonCountByMonth.get(mi) ?? 0) + 1);
      }
    });
    const winRateTrend = months.map((m, i) => {
      const total = totalByMonth.get(i) ?? 0;
      const won = wonByMonth.get(i) ?? 0;
      const valSum = valueSumByMonth.get(i) ?? 0;
      const wonCnt = wonCountByMonth.get(i) ?? 0;
      return {
        month: m,
        winRate: total > 0 ? Math.round((won / total) * 100) : 0,
        avgDealSize: wonCnt > 0 ? Math.round(valSum / wonCnt) : 0,
      };
    });

    // Deal size distribution
    const sizeRanges = [
      { label: "$0-10k", min: 0, max: 10000 },
      { label: "$10-25k", min: 10000, max: 25000 },
      { label: "$25-50k", min: 25000, max: 50000 },
      { label: "$50-100k", min: 50000, max: 100000 },
      { label: "$100k+", min: 100000, max: Infinity },
    ];
    const dealSizeDistribution = sizeRanges.map((range) => ({
      name: range.label,
      count: allDeals.filter((d) => d.value >= range.min && d.value < range.max).length,
    }));

    // Rep leaderboard
    const leaderboard = users.map((user) => {
      const userDeals = allDeals.filter((d) => d.ownerId === user.id);
      const won = userDeals.filter((d) => d.status === "won");
      const lost = userDeals.filter((d) => d.status === "lost");
      const revenue = won.reduce((s, d) => s + d.value, 0);
      const winRate = userDeals.length > 0
        ? Math.round((won.length / userDeals.length) * 100)
        : 0;
      const avgSize = won.length > 0 ? revenue / won.length : 0;
      // Compute average cycle from actual close dates
      const cycles = won.filter((d) => d.actualCloseDate).map((d) => {
        const created = new Date(d.createdAt).getTime();
        const closed = new Date(d.actualCloseDate!).getTime();
        return Math.max(1, Math.round((closed - created) / (1000 * 60 * 60 * 24)));
      });
      const avgCycle = cycles.length > 0
        ? Math.round(cycles.reduce((s, c) => s + c, 0) / cycles.length)
        : 0;

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        initials: `${user.firstName[0]}${user.lastName[0]}`,
        totalDeals: userDeals.length,
        won: won.length,
        lost: lost.length,
        revenue,
        winRate,
        avgSize,
        avgCycle,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Summary
    const allWon = allDeals.filter((d) => d.status === "won");
    const allLost = allDeals.filter((d) => d.status === "lost");
    const overallWinRate = allDeals.length > 0
      ? Math.round((allWon.length / allDeals.length) * 100)
      : 0;
    const avgDealSize = allWon.length > 0
      ? allWon.reduce((s, d) => s + d.value, 0) / allWon.length
      : 0;
    // Avg cycle from all won deals
    const allCycles = allWon.filter((d) => d.actualCloseDate).map((d) => {
      const created = new Date(d.createdAt).getTime();
      const closed = new Date(d.actualCloseDate!).getTime();
      return Math.max(1, Math.round((closed - created) / (1000 * 60 * 60 * 24)));
    });
    const avgCycleLength = allCycles.length > 0
      ? Math.round(allCycles.reduce((s, c) => s + c, 0) / allCycles.length)
      : 0;

    return { winRateTrend, dealSizeDistribution, leaderboard, overallWinRate, avgDealSize, avgCycleLength, totalWon: allWon.length, totalLost: allLost.length };
  }, [allDeals, users]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Win Rate", value: `${data.overallWinRate}%` },
          { label: "Avg Deal Size", value: fmt(data.avgDealSize) },
          { label: "Avg Cycle", value: `${data.avgCycleLength} days` },
          { label: "Won / Lost", value: `${data.totalWon} / ${data.totalLost}` },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Win Rate + Avg Deal Size Trend */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Win Rate & Deal Size Trend</h3>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.winRateTrend}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...CHART_TOOLTIP} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="winRate" stroke="#10b981" strokeWidth={2} name="Win Rate %" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="avgDealSize" stroke="#3b82f6" strokeWidth={2} name="Avg Deal Size" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deal Size Distribution */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Deal Size Distribution</h3>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dealSizeDistribution}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                <Tooltip
                  {...CHART_TOOLTIP}
                  formatter={(value) => [value, "Deals"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.dealSizeDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="font-semibold">Sales Rep Leaderboard</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Rank</th>
                <th className="pb-3 pr-4 font-medium">Rep</th>
                <th className="pb-3 pr-4 font-medium text-right">Deals</th>
                <th className="pb-3 pr-4 font-medium text-right">Won</th>
                <th className="pb-3 pr-4 font-medium text-right">Revenue</th>
                <th className="pb-3 pr-4 font-medium text-right">Win Rate</th>
                <th className="pb-3 pr-4 font-medium text-right">Avg Size</th>
                <th className="pb-3 font-medium text-right">Avg Cycle</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.map((rep, i) => (
                <tr key={rep.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarImage src={rep.avatar} />
                        <AvatarFallback className="text-[9px]">
                          {rep.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{rep.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right">{rep.totalDeals}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-green-600 dark:text-green-400">{rep.won}</span>
                    {" / "}
                    <span className="text-red-600 dark:text-red-400">{rep.lost}</span>
                  </td>
                  <td className="py-3 pr-4 text-right font-semibold">{fmt(rep.revenue)}</td>
                  <td className="py-3 pr-4 text-right">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 ${
                        rep.winRate >= 40
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400"
                          : rep.winRate >= 20
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400"
                      }`}
                    >
                      {rep.winRate}%
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-right">{fmt(rep.avgSize)}</td>
                  <td className="py-3 text-right">{rep.avgCycle}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
