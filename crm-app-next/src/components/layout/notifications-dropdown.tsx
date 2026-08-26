"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  Handshake,
  ListTodo,
  MessageSquare,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotificationStore } from "@/stores/notification-store";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  info: User,
  success: Handshake,
  warning: ListTodo,
  error: MessageSquare,
};

const TYPE_COLORS: Record<string, string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-orange-500",
  error: "text-red-500",
};

export function NotificationsDropdown() {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  return (
    <Popover>
      <PopoverTrigger className="relative inline-flex size-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="mr-1 size-3" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[340px] overflow-hidden">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No notifications
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = TYPE_ICONS[notif.type] ?? Bell;
              const color = TYPE_COLORS[notif.type] ?? "text-muted-foreground";
              return (
                <div
                  key={notif.id}
                  className={`flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                    !notif.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && !notif.read && markAsRead(notif.id)}
                >
                  <div className={`mt-0.5 shrink-0 ${color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-medium ${!notif.read ? "" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      <button
                        type="button"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
