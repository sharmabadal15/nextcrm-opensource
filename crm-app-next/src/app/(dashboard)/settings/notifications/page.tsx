"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const NOTIFICATION_GROUPS = [
  {
    title: "Deals",
    items: [
      { label: "New deal assigned to me", email: true, inApp: true },
      { label: "Deal stage changed", email: false, inApp: true },
      { label: "Deal won or lost", email: true, inApp: true },
      { label: "Deal approaching close date", email: true, inApp: true },
    ],
  },
  {
    title: "Tasks & Activities",
    items: [
      { label: "Task assigned to me", email: true, inApp: true },
      { label: "Task due today", email: true, inApp: true },
      { label: "Task overdue", email: true, inApp: true },
      { label: "Meeting reminder (30 min before)", email: false, inApp: true },
    ],
  },
  {
    title: "Contacts & Companies",
    items: [
      { label: "New contact added", email: false, inApp: true },
      { label: "Contact assigned to me", email: true, inApp: true },
      { label: "Note added to my contact", email: false, inApp: true },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Weekly activity summary", email: true, inApp: false },
      { label: "Monthly revenue report", email: true, inApp: false },
      { label: "Team member joined", email: false, inApp: true },
      { label: "Import completed", email: true, inApp: true },
    ],
  },
];

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how and when you receive notifications
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center gap-8 text-xs font-medium text-muted-foreground">
        <div className="flex-1" />
        <div className="w-16 text-center">Email</div>
        <div className="w-16 text-center">In-App</div>
      </div>

      {NOTIFICATION_GROUPS.map((group, gi) => (
        <div key={group.title}>
          {gi > 0 && <Separator className="mb-6" />}
          <h4 className="font-medium mb-3">{group.title}</h4>
          <div className="space-y-3">
            {group.items.map((item) => (
              <div key={item.label} className="flex items-center gap-8">
                <span className="flex-1 text-sm">{item.label}</span>
                <div className="w-16 flex justify-center">
                  <Switch defaultChecked={item.email} />
                </div>
                <div className="w-16 flex justify-center">
                  <Switch defaultChecked={item.inApp} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <Button onClick={() => toast.success("Notification preferences saved")}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
