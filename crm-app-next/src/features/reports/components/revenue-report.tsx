"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
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

export function RevenueReport() {
  const { data: dealsData } = useDeals({ page: 1, perPage: 500 });
  const { data: users } = useUsersList();
  const allDeals = dealsData?.data ?? [];

  const data = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const wonDeals = allDeals.filter((d) => d.status === "won");
    const lostDeals = allDeals.filter((d) => d.status === "lost");

    // Revenue over time from real deals
    const wonByMonth = new Map<string, number>();
    const lostByMonth = new Map<string, number>();
    months.forEach((m) => { wonByMonth.set(m, 0); lostByMonth.set(m, 0); });
    wonDeals.forEach((d) => {
      const date = d.actualCloseDate ? new Date(d.actualCloseDate) : new Date(d.createdAt);
      const m = months[date.getMonth()];
      wonByMonth.set(m, (wonByMonth.get(m) ?? 0) + d.value);
    });
    lostDeals.forEach((d) => {
      const date = new Date(d.updatedAt);
      const m = months[date.getMonth()];
      lostByMonth.set(m, (lostByMonth.get(m) ?? 0) + d.value);
    });
    const revenueOverTime = months.map((m) => ({
      month: m,
      won: wonByMonth.get(m) ?? 0,
      lost: lostByMonth.get(m) ?? 0,
    }));

    // Revenue by owner
    const byOwner = users.map((user) => {
      const userDeals = allDeals.filter(
        (d) => d.ownerId === user.id && d.status === "won"
      );
      return {
        name: `${user.firstName} ${user.lastName[0]}.`,
        revenue: userDeals.reduce((s, d) => s + d.value, 0),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Summary
    const totalWon = wonDeals.reduce((s, d) => s + d.value, 0);
    const totalLost = lostDeals.reduce((s, d) => s + d.value, 0);
    const totalOpen = allDeals
      .filter((d) => d.status === "open")
      .reduce((s, d) => s + d.value, 0);
    const avgMonthly = totalWon / 12;

    return { revenueOverTime, byOwner, totalWon, totalLost, totalOpen, avgMonthly };
  }, [allDeals, users]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Won Revenue", value: fmt(data.totalWon) },
          { label: "Lost Revenue", value: fmt(data.totalLost) },
          { label: "Open Pipeline", value: fmt(data.totalOpen) },
          { label: "Avg Monthly", value: fmt(data.avgMonthly) },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue over time: Won vs Lost */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="font-semibold">Revenue: Won vs Lost</h3>
        <p className="text-xs text-muted-foreground">Monthly comparison</p>
        <div className="mt-4 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.revenueOverTime}>
              <defs>
                <linearGradient id="wonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                {...CHART_TOOLTIP}
                formatter={(value) => [fmt(Number(value))]}
              />
              <Legend />
              <Area type="monotone" dataKey="won" stroke="#10b981" strokeWidth={2} fill="url(#wonGrad)" />
              <Area type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} fill="url(#lostGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by Owner */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="font-semibold">Revenue by Rep</h3>
        <div className="mt-4 h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byOwner} layout="vertical" barSize={24}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} width={90} />
              <Tooltip
                {...CHART_TOOLTIP}
                formatter={(value) => [fmt(Number(value)), "Revenue"]}
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {data.byOwner.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
