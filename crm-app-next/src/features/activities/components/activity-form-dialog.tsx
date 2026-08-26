"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  activitySchema,
  type ActivityFormValues,
} from "../schemas/activity-schema";
import { useContacts } from "@/features/contacts/hooks/use-contacts";
import { useCompanies } from "@/features/companies/hooks/use-companies";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useUsersList } from "@/hooks/use-users";
import type { Activity } from "@/types";

const ACTIVITY_TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "task", label: "Task" },
  { value: "note", label: "Note" },
  { value: "lunch", label: "Lunch" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity;
  isLoading?: boolean;
  onSubmit: (values: ActivityFormValues) => void;
  defaultType?: Activity["type"];
  defaultDueDate?: string;
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
  isLoading,
  onSubmit,
  defaultType,
  defaultDueDate,
}: ActivityFormDialogProps) {
  const isEdit = !!activity;

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema) as never,
    defaultValues: {
      type: activity?.type ?? defaultType ?? "task",
      subject: activity?.subject ?? "",
      description: activity?.description ?? "",
      priority: activity?.priority ?? "medium",
      dueDate: activity?.dueDate ?? defaultDueDate ?? "",
      contactId: activity?.contactId ?? "",
      companyId: activity?.companyId ?? "",
      dealId: activity?.dealId ?? "",
      ownerId: activity?.ownerId ?? "",
      duration: activity?.duration ?? undefined,
      isCompleted: activity?.isCompleted ?? false,
    },
  });

  const { data: contactsData } = useContacts({ page: 1, perPage: 100 });
  const { data: companiesData } = useCompanies({ page: 1, perPage: 100 });
  const { data: dealsData } = useDeals({ page: 1, perPage: 100 });
  const { data: users } = useUsersList();
  const contacts = contactsData?.data ?? [];
  const companies = companiesData?.data ?? [];
  const deals = dealsData?.data ?? [];
  const ownerValue = form.watch("ownerId");
  const ownerObj = users.find((u) => u.id === ownerValue);

  useEffect(() => {
    if (open) {
      form.reset({
        type: activity?.type ?? defaultType ?? "task",
        subject: activity?.subject ?? "",
        description: activity?.description ?? "",
        priority: activity?.priority ?? "medium",
        dueDate: activity?.dueDate ? activity.dueDate.slice(0, 10) : defaultDueDate ?? "",
        contactId: activity?.contactId ?? "",
        companyId: activity?.companyId ?? "",
        dealId: activity?.dealId ?? "",
        ownerId: activity?.ownerId ?? "",
        duration: activity?.duration ?? undefined,
        isCompleted: activity?.isCompleted ?? false,
      });
    }
  }, [open, activity, defaultType, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Activity" : "Log Activity"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the activity details."
              : "Create a new activity to track interactions."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3"
        >
          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => v && form.setValue("type", v as ActivityFormValues["type"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) => v && form.setValue("priority", v as ActivityFormValues["priority"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label>Subject *</Label>
            <Input
              {...form.register("subject")}
              placeholder="e.g. Follow-up call with client"
            />
            {form.formState.errors.subject && (
              <p className="text-xs text-destructive">
                {form.formState.errors.subject.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              {...form.register("description")}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* Due Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" {...form.register("dueDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                {...form.register("duration")}
                placeholder="30"
              />
            </div>
          </div>

          {/* Associations */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contact</Label>
              <Select
                value={form.watch("contactId") || "none"}
                onValueChange={(v) => form.setValue("contactId", v === "none" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None">
                    {(() => { const c = contacts.find(x => x.id === form.watch("contactId")); return c ? `${c.firstName} ${c.lastName}` : "None"; })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Company</Label>
              <Select
                value={form.watch("companyId") || "none"}
                onValueChange={(v) => form.setValue("companyId", v === "none" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None">
                    {companies.find(x => x.id === form.watch("companyId"))?.name ?? "None"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deal + Owner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Deal</Label>
              <Select
                value={form.watch("dealId") || "none"}
                onValueChange={(v) => form.setValue("dealId", v === "none" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None">
                    {deals.find(x => x.id === form.watch("dealId"))?.title ?? "None"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {deals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select
                value={ownerValue || ""}
                onValueChange={(v) => v && form.setValue("ownerId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Auto-assigned to you">
                    {ownerObj
                      ? `${ownerObj.firstName} ${ownerObj.lastName}`
                      : "Auto-assigned to you"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
