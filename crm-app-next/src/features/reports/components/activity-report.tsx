"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useActivities } from "@/features/activities/hooks/use-activities";
import { useUsersList } from "@/hooks/use-users";
import type { ActivityType } from "@/types";

const TYPE_COLORS: Record<ActivityType, string> = {
  call: "#3b82f6",
  email: "#8b5cf6",
  meeting: "#f97316",
  task: "#10b981",
  note: "#64748b",
  lunch: "#f59e0b",
};

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

export function ActivityReport() {
  const { data: activitiesData } = useActivities({ page: 1, perPage: 500 });
  const { data: users } = useUsersList();
  const allActivities = activitiesData?.data ?? [];

  const data = useMemo(() => {
    // By type
    const types: ActivityType[] = ["call", "email", "meeting", "task", "note", "lunch"];
    const byType = types.map((type) => ({
      name: type,
      count: allActivities.filter((a) => a.type === type).length,
      color: TYPE_COLORS[type],
    }));

    // By rep
    const byRep = users.map((user) => {
      const userActivities = allActivities.filter((a) => a.ownerId === user.id);
      return {
        name: `${user.firstName} ${user.lastName[0]}.`,
        total: userActivities.length,
        completed: userActivities.filter((a) => a.isCompleted).length,
      };
    }).sort((a, b) => b.total - a.total);

    // Trends from real data grouped by month
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendMap = new Map<string, { calls: number; emails: number; meetings: number; tasks: number }>();
    months.forEach((m) => trendMap.set(m, { calls: 0, emails: 0, meetings: 0, tasks: 0 }));
    allActivities.forEach((a) => {
      const m = months[new Date(a.createdAt).getMonth()];
      const entry = trendMap.get(m);
      if (!entry) return;
      if (a.type === "call") entry.calls++;
      else if (a.type === "email") entry.emails++;
      else if (a.type === "meeting") entry.meetings++;
      else if (a.type === "task") entry.tasks++;
    });
    const trends = months.map((m) => ({ month: m, ...trendMap.get(m)! }));

    // Summary
    const total = allActivities.length;
    const completed = allActivities.filter((a) => a.isCompleted).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgPerDay = Math.round(total / 30);

    return { byType, byRep, trends, total, completed, completionRate, avgPerDay };
  }, [allActivities, users]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Activities", value: data.total.toString() },
          { label: "Completed", value: data.completed.toString() },
          { label: "Completion Rate", value: `${data.completionRate}%` },
          { label: "Avg/Day", value: data.avgPerDay.toString() },
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
        {/* By Type (Pie) */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Activities by Type</h3>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byType}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  dataKey="count"
                  label={({ name, value, x, y }) => (
                    <text x={x} y={y} fill="#a1a1aa" fontSize={11} textAnchor="middle">
                      {`${name} (${value})`}
                    </text>
                  )}
                  labelLine={false}
                >
                  {data.byType.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  {...CHART_TOOLTIP}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Rep (Bar) */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Activities per Rep</h3>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byRep}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                <Tooltip {...CHART_TOOLTIP} />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trends */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="font-semibold">Activity Trends</h3>
        <p className="text-xs text-muted-foreground">Monthly breakdown by type</p>
        <div className="mt-4 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Legend />
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="emails" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="meetings" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
