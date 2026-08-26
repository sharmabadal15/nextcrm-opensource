import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-700 dark:text-green-400",
  inactive: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
  lead: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  prospect: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  customer: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  open: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  won: "bg-green-500/15 text-green-700 dark:text-green-400",
  lost: "bg-red-500/15 text-red-700 dark:text-red-400",
  low: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
  medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  urgent: "bg-red-500/15 text-red-700 dark:text-red-400",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass =
    statusColors[status.toLowerCase()] ??
    "bg-gray-500/15 text-gray-700 dark:text-gray-400";

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent capitalize font-medium",
        colorClass,
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
