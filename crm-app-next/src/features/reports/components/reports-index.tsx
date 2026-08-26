"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  DollarSign,
  ListTodo,
  Trophy,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useActivities } from "@/features/activities/hooks/use-activities";
import { useContacts } from "@/features/contacts/hooks/use-contacts";

export function ReportsIndex() {
  const router = useRouter();
  const { data: dealsData } = useDeals({ page: 1, perPage: 500 });
  const { data: activitiesData } = useActivities({ page: 1, perPage: 500 });
  const { data: contactsData } = useContacts({ page: 1, perPage: 1 });

  const allDeals = dealsData?.data ?? [];
  const allActivities = activitiesData?.data ?? [];
  const totalContacts = contactsData?.meta?.total ?? 0;

  const stats = useMemo(() => {
    const openDeals = allDeals.filter((d) => d.status === "open");
    const totalPipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
    const wonDeals = allDeals.filter((d) => d.status === "won");
    const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const winRate =
      allDeals.length > 0
        ? Math.round((wonDeals.length / allDeals.length) * 100)
        : 0;
    const completedActivities = allActivities.filter(
      (a) => a.isCompleted
    ).length;

    return { totalPipelineValue, totalRevenue, winRate, completedActivities, openDeals: openDeals.length };
  }, [allDeals, allActivities]);

  const REPORTS = [
    {
      title: "Pipeline Report",
      description: "Deals by stage, conversion rates, and pipeline value",
      href: "/reports/pipeline",
      icon: BarChart3,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20 hover:border-blue-500/40",
      stat: `$${(stats.totalPipelineValue / 1000).toFixed(0)}k`,
      statLabel: "Pipeline value",
      trend: `${allDeals.length} deals`,
      trendUp: true,
    },
    {
      title: "Revenue Report",
      description: "Revenue over time, by source, and won vs lost",
      href: "/reports/revenue",
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      stat: `$${(stats.totalRevenue / 1000).toFixed(0)}k`,
      statLabel: "Total revenue",
      trend: `${allDeals.filter((d) => d.status === "won").length} won`,
      trendUp: stats.totalRevenue > 0,
    },
    {
      title: "Activity Report",
      description: "Activities by type, per rep, and trends over time",
      href: "/reports/activity",
      icon: ListTodo,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20 hover:border-violet-500/40",
      stat: `${stats.completedActivities}`,
      statLabel: "Completed",
      trend: `${allActivities.length} total`,
      trendUp: true,
    },
    {
      title: "Sales Performance",
      description: "Win rate, deal size, sales cycle, and leaderboard",
      href: "/reports/performance",
      icon: Trophy,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20 hover:border-amber-500/40",
      stat: `${stats.winRate}%`,
      statLabel: "Win rate",
      trend: stats.winRate >= 30 ? "Healthy" : "Needs work",
      trendUp: stats.winRate >= 30,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Deals", value: allDeals.length },
          { label: "Open Deals", value: stats.openDeals },
          { label: "Contacts", value: totalContacts },
          { label: "Activities", value: allActivities.length },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border bg-card px-4 py-3 text-center"
          >
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Report cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => (
          <button
            key={report.href}
            type="button"
            onClick={() => router.push(report.href)}
            className={`group relative flex flex-col rounded-xl border bg-card p-6 text-left transition-all hover:shadow-lg ${report.border}`}
          >
            {/* Top row: icon + trend */}
            <div className="flex items-center justify-between">
              <div
                className={`flex size-11 items-center justify-center rounded-lg ${report.bg}`}
              >
                <report.icon className={`size-5 ${report.color}`} />
              </div>
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  report.trendUp
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {report.trendUp ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {report.trend}
              </div>
            </div>

            {/* Stat */}
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight">{report.stat}</p>
              <p className="text-xs text-muted-foreground">{report.statLabel}</p>
            </div>

            {/* Title + description */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{report.title}</h3>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground leading-snug">
                {report.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
