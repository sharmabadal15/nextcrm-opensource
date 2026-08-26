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
} from "recharts";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useDefaultPipeline } from "@/features/deals/hooks/use-pipelines";

function formatCurrency(val: number) {
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

export function PipelineReport() {
  const { data: dealsData } = useDeals({ page: 1, perPage: 500 });
  const { data: pipeline } = useDefaultPipeline();
  const allDeals = dealsData?.data ?? [];
  const stages = pipeline?.stages ?? [];

  const data = useMemo(() => {
    // Deals by stage
    const byStage = stages.map((stage) => {
      const deals = allDeals.filter(
        (d) => d.stageId === stage.id && d.status !== "lost"
      );
      return {
        name: stage.name,
        count: deals.length,
        value: deals.reduce((s, d) => s + d.value, 0),
        color: stage.color,
        probability: stage.probability,
      };
    });

    // Conversion funnel
    const funnel = stages.map((stage, i) => {
      const stageDeals = allDeals.filter(
        (d) => d.stageId === stage.id && d.status !== "lost"
      );
      const prevCount = i === 0
        ? allDeals.filter((d) => d.status !== "lost").length
        : byStage[i - 1].count;
      const rate = prevCount > 0 ? Math.round((stageDeals.length / prevCount) * 100) : 0;
      return {
        name: stage.name,
        count: stageDeals.length,
        conversionRate: rate,
        color: stage.color,
      };
    });

    // Value distribution for pie
    const valueDistribution = byStage
      .filter((s) => s.value > 0)
      .map((s) => ({ name: s.name, value: s.value, color: s.color }));

    // Summary
    const totalDeals = allDeals.filter((d) => d.status !== "lost").length;
    const totalValue = allDeals
      .filter((d) => d.status !== "lost")
      .reduce((s, d) => s + d.value, 0);
    const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
    const wonCount = allDeals.filter((d) => d.status === "won").length;
    const winRate = allDeals.length > 0 ? Math.round((wonCount / allDeals.length) * 100) : 0;

    return { byStage, funnel, valueDistribution, totalDeals, totalValue, avgDealSize, winRate };
  }, [allDeals, stages]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Deals", value: data.totalDeals.toString() },
          { label: "Pipeline Value", value: formatCurrency(data.totalValue) },
          { label: "Avg Deal Size", value: formatCurrency(data.avgDealSize) },
          { label: "Win Rate", value: `${data.winRate}%` },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Deals by Stage */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Deals by Stage</h3>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byStage}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
                <Tooltip
                  {...CHART_TOOLTIP}
                  formatter={(value) => [value, "Deals"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.byStage.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Value Distribution */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Value Distribution</h3>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.valueDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent, x, y }) => (
                    <text x={x} y={y} fill="#a1a1aa" fontSize={11} textAnchor="middle">
                      {`${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    </text>
                  )}
                  labelLine={false}
                >
                  {data.valueDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  {...CHART_TOOLTIP}
                  formatter={(value) => [formatCurrency(Number(value)), "Value"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="font-semibold">Stage Conversion Rates</h3>
        <div className="mt-4 space-y-3">
          {data.funnel.map((stage, i) => (
            <div key={stage.name} className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium truncate">{stage.name}</div>
              <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all flex items-center px-3"
                  style={{
                    width: `${Math.max(stage.conversionRate, 5)}%`,
                    backgroundColor: stage.color,
                  }}
                >
                  <span className="text-[10px] font-bold text-white">
                    {stage.count} deals
                  </span>
                </div>
              </div>
              <span className="w-14 text-right text-sm font-semibold">
                {stage.conversionRate}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
