"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
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
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Handshake,
  DollarSign,
  Trophy,
  CheckSquare,
  Plus,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useContacts } from "@/features/contacts/hooks/use-contacts";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useActivities } from "@/features/activities/hooks/use-activities";
import { useUsersList } from "@/hooks/use-users";
import { useDefaultPipeline } from "@/features/deals/hooks/use-pipelines";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(val: number, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(val);
}

// ---------------------------------------------------------------------------
// Data derivation
// ---------------------------------------------------------------------------

function useDashboardData() {
  const { data: contactsData, isLoading: contactsLoading } = useContacts({ page: 1, perPage: 1 });
  const { data: dealsData, isLoading: dealsLoading } = useDeals({ page: 1, perPage: 500 });
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities({ page: 1, perPage: 500 });
  const { data: users } = useUsersList();
  const { data: pipeline, isLoading: pipelineLoading } = useDefaultPipeline();

  const isLoading = contactsLoading || dealsLoading || activitiesLoading || pipelineLoading;

  const totalContacts = contactsData?.meta?.total ?? 0;
  const allDeals = dealsData?.data ?? [];
  const allActivities = activitiesData?.data ?? [];
  const stages = pipeline?.stages ?? [];

  const derived = useMemo(() => {
    const openDeals = allDeals.filter((d) => d.status === "open");
    const wonDeals = allDeals.filter((d) => d.status === "won");
    const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
    const wonRevenue = wonDeals.reduce((s, d) => s + d.value, 0);
    const tasksDueToday = allActivities.filter(
      (a) => a.type === "task" && !a.isCompleted
    ).length;

    // KPI cards
    const kpis = [
      {
        label: "Total Contacts",
        value: totalContacts.toString(),
        change: `${totalContacts} total`,
        positive: true,
        icon: Users,
      },
      {
        label: "Open Deals",
        value: openDeals.length.toString(),
        change: `${allDeals.length} total`,
        positive: true,
        icon: Handshake,
      },
      {
        label: "Pipeline Value",
        value: formatCurrency(pipelineValue, true),
        change: `${openDeals.length} deals`,
        positive: true,
        icon: DollarSign,
      },
      {
        label: "Won Revenue",
        value: formatCurrency(wonRevenue, true),
        change: `${wonDeals.length} won`,
        positive: wonDeals.length > 0,
        icon: Trophy,
      },
      {
        label: "Tasks Due",
        value: tasksDueToday.toString(),
        change: tasksDueToday > 3 ? `${tasksDueToday} pending` : "On track",
        positive: tasksDueToday <= 3,
        icon: CheckSquare,
      },
    ];

    // Revenue trend from won deals grouped by month
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth = new Map<string, number>();
    monthNames.forEach((m) => revenueByMonth.set(m, 0));
    wonDeals.forEach((d) => {
      const date = d.actualCloseDate ? new Date(d.actualCloseDate) : new Date(d.createdAt);
      const month = monthNames[date.getMonth()];
      revenueByMonth.set(month, (revenueByMonth.get(month) ?? 0) + d.value);
    });
    const revenueTrend = monthNames.map((m) => ({
      month: m,
      revenue: revenueByMonth.get(m) ?? 0,
    }));

    // Pipeline funnel from real stages
    const pipelineFunnel = stages
      .filter((s) => s.name !== "Closed Lost")
      .map((stage) => {
        const stageDeals = allDeals.filter(
          (d) => d.stageId === stage.id && d.status !== "lost"
        );
        return {
          name: stage.name,
          value: stageDeals.reduce((s, d) => s + d.value, 0),
          count: stageDeals.length,
          color: stage.color,
        };
      });

    // Top deals
    const topDeals = [...openDeals]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((d) => {
        const owner = users.find((u) => u.id === d.ownerId);
        const stage = stages.find((s) => s.id === d.stageId);
        return { ...d, owner, stage };
      });

    // Recent activities
    const recentActivities = [...allActivities]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 8)
      .map((a) => {
        const owner = users.find((u) => u.id === a.ownerId);
        return { ...a, owner };
      });

    return { kpis, revenueTrend, pipelineFunnel, topDeals, recentActivities };
  }, [totalContacts, allDeals, allActivities, users, stages]);

  return { ...derived, isLoading };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const { kpis, revenueTrend, pipelineFunnel, topDeals, recentActivities, isLoading } =
    useDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dashboard"
          description="Your CRM overview at a glance"
        />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push("/contacts")}>
            <UserPlus className="mr-1.5 size-3.5" />
            New Contact
          </Button>
          <Button size="sm" onClick={() => router.push("/deals")}>
            <Plus className="mr-1.5 size-3.5" />
            New Deal
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-5 shadow-sm space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          : kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {kpi.label}
              </p>
              <kpi.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{kpi.value}</p>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {kpi.positive ? (
                <ArrowUpRight className="size-3 text-green-500" />
              ) : (
                <ArrowDownRight className="size-3 text-red-500" />
              )}
              <span
                className={
                  kpi.positive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Trend */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Revenue Trend</h3>
          <p className="text-xs text-muted-foreground">Last 12 months</p>
          <div className="mt-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(24,24,27,0.95)",
                    border: "1px solid rgba(63,63,70,0.5)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fafafa",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  }}
                  labelStyle={{ color: "#a1a1aa", fontSize: "11px" }}
                  itemStyle={{ color: "#fafafa" }}
                  formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Pipeline by Stage</h3>
          <p className="text-xs text-muted-foreground">Deal values per stage</p>
          <div className="mt-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineFunnel} layout="vertical" barSize={28}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(24,24,27,0.95)",
                    border: "1px solid rgba(63,63,70,0.5)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fafafa",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  }}
                  labelStyle={{ color: "#a1a1aa", fontSize: "11px" }}
                  itemStyle={{ color: "#fafafa" }}
                  cursor={{ fill: "rgba(161,161,170,0.1)" }}
                  formatter={(value, _name, props) => [
                    `${formatCurrency(Number(value))} (${(props as { payload: { count: number } }).payload.count} deals)`,
                    "Value",
                  ]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {pipelineFunnel.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Deals */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Top Deals</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => router.push("/deals")}
            >
              View all
            </Button>
          </div>
          <Separator className="my-3" />
          <div className="space-y-3">
            {topDeals.map((deal) => (
              <button
                key={deal.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent"
                onClick={() => router.push(`/deals/${deal.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{deal.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {deal.stage && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                        style={{ borderLeft: `2px solid ${deal.stage.color}` }}
                      >
                        {deal.stage.name}
                      </Badge>
                    )}
                    <span>{deal.probability}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatCurrency(deal.value, true)}
                  </span>
                  {deal.owner && (
                    <Avatar className="size-6">
                      <AvatarImage src={deal.owner.avatar} />
                      <AvatarFallback className="text-[9px]">
                        {deal.owner.firstName[0]}
                        {deal.owner.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Activity</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => router.push("/activities")}
            >
              View all
            </Button>
          </div>
          <Separator className="my-3" />
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                {activity.owner && (
                  <Avatar className="size-7 mt-0.5">
                    <AvatarImage src={activity.owner.avatar} />
                    <AvatarFallback className="text-[9px]">
                      {activity.owner.firstName[0]}
                      {activity.owner.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{activity.subject}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
                      {activity.type}
                    </Badge>
                    {activity.isCompleted && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        Done
                      </Badge>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
