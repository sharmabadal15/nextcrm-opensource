"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  PhoneCall,
  Plus,
  StickyNote,
  Trash2,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { NotesPanel } from "@/components/shared/notes-panel";
import { FilesPanel } from "@/components/shared/files-panel";
import { ContactFormDialog } from "./contact-form-dialog";
import {
  useContact,
  useUpdateContact,
  useDeleteContact,
} from "../hooks/use-contacts";
import { activitiesService } from "@/services/activities";
import type { Activity } from "@/types";
import type { ContactFormValues } from "../schemas/contact-schema";

// ---------------------------------------------------------------------------
// Activity icon map
// ---------------------------------------------------------------------------

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  call: PhoneCall,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle2,
  note: StickyNote,
  lunch: User,
};

const ACTIVITY_COLORS: Record<string, string> = {
  call: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  email: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  meeting: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  task: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  note: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  lunch: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactDetailView({ contactId }: { contactId: string }) {
  const router = useRouter();
  const { data: contact, isLoading } = useContact(contactId);
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch activities for this contact
  const { data: activitiesData } = useQuery({
    queryKey: ["activities", "contact", contactId],
    queryFn: () =>
      activitiesService.getAll({
        page: 1,
        perPage: 50,
        filters: { contactId },
        sort: { field: "createdAt", direction: "desc" },
      }),
    enabled: !!contactId,
  });

  const activities = activitiesData?.data ?? [];

  if (isLoading) return <ContactDetailSkeleton />;

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <User className="size-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Contact not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This contact may have been deleted.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/contacts")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Contacts
        </Button>
      </div>
    );
  }

  const handleUpdate = (values: ContactFormValues) => {
    updateMutation.mutate(
      { id: contact.id, data: values },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(contact.id, {
      onSuccess: () => router.push("/contacts"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/contacts")}
        >
          <ArrowLeft className="mr-1.5 size-4" />
          Contacts
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="mr-1.5 size-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 size-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start gap-4">
          <Avatar className="size-16">
            <AvatarImage
              src={contact.avatar}
              alt={`${contact.firstName} ${contact.lastName}`}
            />
            <AvatarFallback className="text-lg">
              {contact.firstName[0]}
              {contact.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {contact.firstName} {contact.lastName}
              </h1>
              <StatusBadge status={contact.status} />
            </div>
            {contact.title && (
              <p className="text-muted-foreground">{contact.title}</p>
            )}
            {contact.company && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="size-3.5" />
                <span>{contact.company.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {contact.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`mailto:${contact.email}`)}
            >
              <Mail className="mr-1.5 size-3.5" />
              Email
            </Button>
          )}
          {contact.phone && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`tel:${contact.phone}`)}
            >
              <PhoneCall className="mr-1.5 size-3.5" />
              Call
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Plus className="mr-1.5 size-3.5" />
            Create Task
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("notes")}>
            <MessageSquarePlus className="mr-1.5 size-3.5" />
            Add Note
          </Button>
        </div>
      </div>

      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">
            Activities
            {activities.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {activities.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 pt-4 md:grid-cols-2">
            {/* Contact info */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">Contact Information</h3>
              <Separator className="my-3" />
              <div className="space-y-3">
                <InfoRow icon={Mail} label="Email" value={contact.email} href={`mailto:${contact.email}`} />
                {contact.phone && (
                  <InfoRow icon={Phone} label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />
                )}
                {contact.address?.city && (
                  <InfoRow
                    icon={MapPin}
                    label="Location"
                    value={[contact.address.city, contact.address.state, contact.address.country]
                      .filter(Boolean)
                      .join(", ")}
                  />
                )}
                {contact.source && (
                  <InfoRow icon={User} label="Source" value={contact.source.replace(/_/g, " ")} />
                )}
              </div>
            </div>

            {/* Details */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">Details</h3>
              <Separator className="my-3" />
              <div className="space-y-3">
                {contact.owner && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Owner</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5">
                        <AvatarImage src={contact.owner.avatar} />
                        <AvatarFallback className="text-[10px]">
                          {contact.owner.firstName[0]}{contact.owner.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{contact.owner.firstName} {contact.owner.lastName}</span>
                    </div>
                  </div>
                )}
                {contact.tags.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(contact.createdAt), "MMM d, yyyy")}</span>
                </div>
                {contact.lastContactedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Contacted</span>
                    <span>{formatDistanceToNow(new Date(contact.lastContactedAt), { addSuffix: true })}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDistanceToNow(new Date(contact.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            {/* Recent activity timeline */}
            <div className="rounded-lg border bg-card p-6 md:col-span-2">
              <h3 className="font-semibold">Recent Activity</h3>
              <Separator className="my-3" />
              {activities.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No activities yet.</p>
              ) : (
                <ActivityTimeline activities={activities.slice(0, 5)} />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Activities tab */}
        <TabsContent value="activities">
          <div className="rounded-lg border bg-card p-6 mt-4">
            {activities.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No activities recorded.</p>
            ) : (
              <ActivityTimeline activities={activities} />
            )}
          </div>
        </TabsContent>

        {/* Deals tab */}
        <TabsContent value="deals">
          <div className="rounded-lg border bg-card p-6 mt-4">
            <p className="py-8 text-center text-sm text-muted-foreground">
              No deals associated with this contact yet.
            </p>
          </div>
        </TabsContent>

        {/* Notes tab */}
        <TabsContent value="notes">
          <div className="mt-4">
            <NotesPanel entityType="contact" entityId={contact.id} />
          </div>
        </TabsContent>

        {/* Files tab */}
        <TabsContent value="files">
          <div className="mt-4">
            <FilesPanel entityType="contact" entityId={contact.id} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <ContactFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={contact}
        isLoading={updateMutation.isPending}
        onSubmit={handleUpdate}
      />

      {/* Delete dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Contact"
        description={`Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Timeline
// ---------------------------------------------------------------------------

function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <div className="relative space-y-0">
      {activities.map((activity, index) => {
        const Icon = ACTIVITY_ICONS[activity.type] ?? Clock;
        const colors = ACTIVITY_COLORS[activity.type] ?? "bg-gray-100 text-gray-700";
        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-border" />
            )}
            {/* Icon */}
            <div className={`z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${colors}`}>
              <Icon className="size-3.5" />
            </div>
            {/* Content */}
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium leading-tight">{activity.subject}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </span>
              </div>
              {activity.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {activity.type}
                </Badge>
                {activity.isCompleted && (
                  <Badge variant="secondary" className="text-[10px]">
                    Completed
                  </Badge>
                )}
                {activity.priority === "high" || activity.priority === "urgent" ? (
                  <Badge variant="destructive" className="text-[10px] capitalize">
                    {activity.priority}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// InfoRow helper
// ---------------------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      {href ? (
        <a href={href} className="text-primary hover:underline">{value}</a>
      ) : (
        <span className="capitalize">{value}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ContactDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-24" />
      <div className="rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-64 rounded-lg md:col-span-2" />
      </div>
    </div>
  );
}
