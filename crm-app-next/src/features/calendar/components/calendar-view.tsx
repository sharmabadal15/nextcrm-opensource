"use client";

import { useState, useMemo, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  getHours,
  setHours,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Utensils,
  Video,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUsersList } from "@/hooks/use-users";
import { ActivityFormDialog } from "@/features/activities/components/activity-form-dialog";
import { useActivities, useCreateActivity, useUpdateActivity } from "@/features/activities/hooks/use-activities";
import type { ActivityFormValues } from "@/features/activities/schemas/activity-schema";
import type { Activity, ActivityType } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type ViewMode = "month" | "week" | "day";

const TYPE_COLORS: Record<ActivityType, string> = {
  call: "bg-blue-500",
  email: "bg-purple-500",
  meeting: "bg-orange-500",
  task: "bg-green-500",
  note: "bg-slate-500",
  lunch: "bg-amber-500",
};

const TYPE_ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Video,
  task: ClipboardList,
  note: MessageSquare,
  lunch: Utensils,
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WORK_HOURS = HOURS.filter((h) => h >= 7 && h <= 20);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getActivitiesForDay(date: Date, activities: Activity[]): Activity[] {
  return activities.filter((a) => {
    const d = a.dueDate ? new Date(a.dueDate) : new Date(a.createdAt);
    return isSameDay(d, date);
  });
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CalendarView() {
  const { data: users } = useUsersList();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const createMutation = useCreateActivity();
  const updateMutation = useUpdateActivity();
  const { data: activitiesData } = useActivities({ page: 1, perPage: 500 });
  const allActivities = activitiesData?.data ?? [];

  const goToday = () => setCurrentDate(new Date());

  const navigate = useCallback(
    (dir: 1 | -1) => {
      setCurrentDate((d) => {
        if (view === "month") return dir === 1 ? addMonths(d, 1) : subMonths(d, 1);
        if (view === "week") return dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1);
        return dir === 1 ? addDays(d, 1) : subDays(d, 1);
      });
    },
    [view]
  );

  const title = useMemo(() => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  }, [currentDate, view]);

  const handleCreate = (values: ActivityFormValues) => {
    createMutation.mutate(values as Omit<Activity, "id" | "createdAt" | "updatedAt">, {
      onSuccess: () => setCreateOpen(false),
    });
  };

  const handleUpdate = (values: ActivityFormValues) => {
    if (!editActivity) return;
    updateMutation.mutate(
      { id: editActivity.id, data: values as Partial<Activity> },
      { onSuccess: () => setEditActivity(null) }
    );
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setCreateOpen(true);
  };

  const handleEventClick = (activity: Activity) => {
    setEditActivity(activity);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            Today
          </Button>
          <h2 className="ml-2 text-lg font-semibold">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border">
            {(["month", "week", "day"] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => { setSelectedDate(new Date()); setCreateOpen(true); }}>
            <Plus className="mr-1.5 size-3.5" />
            New Event
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 capitalize">
            <div className={cn("size-2.5 rounded-full", color)} />
            {type}
          </div>
        ))}
      </div>

      {/* Views */}
      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          onDayClick={handleDayClick}
          onEventClick={handleEventClick}
          activities={allActivities}
        />
      )}
      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          onSlotClick={handleDayClick}
          onEventClick={handleEventClick}
          activities={allActivities}
        />
      )}
      {view === "day" && (
        <DayView
          currentDate={currentDate}
          onSlotClick={handleDayClick}
          activities={allActivities}
        />
      )}

      <ActivityFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isLoading={createMutation.isPending}
        onSubmit={handleCreate}
        defaultType="meeting"
        defaultDueDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
      />

      <ActivityFormDialog
        open={!!editActivity}
        onOpenChange={(o) => { if (!o) setEditActivity(null); }}
        activity={editActivity ?? undefined}
        isLoading={updateMutation.isPending}
        onSubmit={handleUpdate}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Month View
// ---------------------------------------------------------------------------

function MonthView({
  currentDate,
  onDayClick,
  onEventClick,
  activities,
}: {
  currentDate: Date;
  onDayClick: (date: Date) => void;
  onEventClick: (activity: Activity) => void;
  activities: Activity[];
}) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayActivities = getActivitiesForDay(day, activities);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-[90px] border-b border-r p-1.5 text-left transition-colors hover:bg-accent/50",
                !inMonth && "bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs",
                  today && "bg-primary text-primary-foreground font-bold",
                  !inMonth && "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayActivities.slice(0, 3).map((a) => {
                  const Icon = TYPE_ICONS[a.type];
                  return (
                    <div
                      key={a.id}
                      role="button"
                      onClick={(e) => { e.stopPropagation(); onEventClick(a); }}
                      className={cn(
                        "flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-white truncate cursor-pointer hover:opacity-80",
                        TYPE_COLORS[a.type]
                      )}
                    >
                      <Icon className="size-2.5 shrink-0" />
                      <span className="truncate">{a.subject}</span>
                    </div>
                  );
                })}
                {dayActivities.length > 3 && (
                  <span className="block text-[10px] text-muted-foreground pl-1">
                    +{dayActivities.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Week View
// ---------------------------------------------------------------------------

function WeekView({
  currentDate,
  onSlotClick,
  onEventClick,
  activities,
}: {
  currentDate: Date;
  onSlotClick: (date: Date) => void;
  onEventClick: (activity: Activity) => void;
  activities: Activity[];
}) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({
      start,
      end: endOfWeek(currentDate, { weekStartsOn: 0 }),
    });
  }, [currentDate]);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
        <div className="border-r" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "border-r py-2 text-center",
              isToday(day) && "bg-primary/5"
            )}
          >
            <div className="text-xs text-muted-foreground">
              {format(day, "EEE")}
            </div>
            <div
              className={cn(
                "mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-medium",
                isToday(day) && "bg-primary text-primary-foreground"
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="max-h-[500px] overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          {WORK_HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="border-b border-r py-3 pr-2 text-right text-[10px] text-muted-foreground">
                {format(setHours(new Date(), hour), "ha")}
              </div>
              {weekDays.map((day) => {
                const dayActivities = getActivitiesForDay(day, activities).filter((a) => {
                  const d = a.dueDate ? new Date(a.dueDate) : new Date(a.createdAt);
                  return getHours(d) === hour;
                });

                return (
                  <button
                    key={`${day.toISOString()}-${hour}`}
                    type="button"
                    onClick={() => onSlotClick(setHours(day, hour))}
                    className={cn(
                      "min-h-[48px] border-b border-r p-0.5 text-left transition-colors hover:bg-accent/30",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    {dayActivities.map((a) => (
                      <div
                        key={a.id}
                        role="button"
                        onClick={(e) => { e.stopPropagation(); onEventClick(a); }}
                        className={cn(
                          "mb-0.5 rounded px-1 py-0.5 text-[10px] text-white truncate cursor-pointer hover:opacity-80",
                          TYPE_COLORS[a.type]
                        )}
                      >
                        {a.subject}
                      </div>
                    ))}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day View
// ---------------------------------------------------------------------------

function DayView({
  currentDate,
  onSlotClick,
  activities,
}: {
  currentDate: Date;
  onSlotClick: (date: Date) => void;
  activities: Activity[];
}) {
  const { data: users } = useUsersList();
  const dayActivities = useMemo(
    () => getActivitiesForDay(currentDate, activities),
    [currentDate, activities]
  );

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* All-day summary */}
      {dayActivities.length > 0 && (
        <div className="border-b p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {dayActivities.length} activities this day
          </p>
          <div className="flex flex-wrap gap-1.5">
            {dayActivities.map((a) => {
              const Icon = TYPE_ICONS[a.type];
              return (
                <Badge
                  key={a.id}
                  variant="secondary"
                  className="gap-1 text-xs"
                >
                  <Icon className="size-3" />
                  {a.subject}
                  {a.isCompleted && (
                    <span className="text-green-500 ml-1">✓</span>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Hourly grid */}
      <div className="max-h-[500px] overflow-y-auto">
        {WORK_HOURS.map((hour) => {
          const hourActivities = dayActivities.filter((a) => {
            const d = a.dueDate ? new Date(a.dueDate) : new Date(a.createdAt);
            return getHours(d) === hour;
          });

          return (
            <button
              key={hour}
              type="button"
              onClick={() => onSlotClick(setHours(currentDate, hour))}
              className="flex w-full items-start border-b transition-colors hover:bg-accent/30"
            >
              <div className="w-[60px] shrink-0 border-r py-3 pr-2 text-right text-[10px] text-muted-foreground">
                {format(setHours(new Date(), hour), "h:mm a")}
              </div>
              <div className="flex-1 min-h-[48px] p-1">
                {hourActivities.map((a) => {
                  const Icon = TYPE_ICONS[a.type];
                  const owner = users.find((u) => u.id === a.ownerId);
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "mb-1 flex items-center gap-2 rounded px-2 py-1.5 text-xs text-white",
                        TYPE_COLORS[a.type]
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="flex-1 truncate">{a.subject}</span>
                      {a.duration && (
                        <span className="flex items-center gap-0.5 text-[10px] opacity-80">
                          <Clock className="size-2.5" />
                          {a.duration}m
                        </span>
                      )}
                      {owner && (
                        <span className="text-[10px] opacity-80">
                          {owner.firstName[0]}{owner.lastName[0]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
