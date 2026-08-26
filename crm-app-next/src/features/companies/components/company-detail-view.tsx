"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  FileUp,
  Globe,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  PhoneCall,
  StickyNote,
  Trash2,
  User,
  Users,
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { NotesPanel } from "@/components/shared/notes-panel";
import { FilesPanel } from "@/components/shared/files-panel";
import { CompanyFormDialog } from "./company-form-dialog";
import {
  useCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "../hooks/use-companies";
import { contactsService } from "@/services/contacts";
import { activitiesService } from "@/services/activities";
import type { Activity } from "@/types";
import type { CompanyFormValues } from "../schemas/company-schema";

// ---------------------------------------------------------------------------
// Activity helpers
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

export function CompanyDetailView({ companyId }: { companyId: string }) {
  const router = useRouter();
  const { data: company, isLoading } = useCompany(companyId);
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch associated contacts
  const { data: contactsData } = useQuery({
    queryKey: ["contacts", "company", companyId],
    queryFn: () =>
      contactsService.getAll({
        page: 1,
        perPage: 50,
        filters: {},
      }),
    enabled: !!companyId,
    select: (res) => ({
      ...res,
      data: res.data.filter((c) => c.companyId === companyId),
    }),
  });

  // Fetch activities (filter client-side by contacts of this company)
  const contactIds = useMemo(
    () => company?.contactIds ?? [],
    [company]
  );

  const { data: activitiesData } = useQuery({
    queryKey: ["activities", "company", companyId],
    queryFn: () =>
      activitiesService.getAll({
        page: 1,
        perPage: 50,
        sort: { field: "createdAt", direction: "desc" },
      }),
    enabled: !!companyId && contactIds.length > 0,
    select: (res) => ({
      ...res,
      data: res.data.filter((a) => a.contactId && contactIds.includes(a.contactId)),
    }),
  });

  const contacts = contactsData?.data ?? [];
  const activities = activitiesData?.data ?? [];

  if (isLoading) return <CompanyDetailSkeleton />;

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Users className="size-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Company not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This company may have been deleted.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/companies")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Companies
        </Button>
      </div>
    );
  }

  const handleUpdate = (values: CompanyFormValues) => {
    updateMutation.mutate(
      { id: company.id, data: values },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(company.id, {
      onSuccess: () => router.push("/companies"),
    });
  };

  const formatRevenue = (amount?: number) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/companies")}>
          <ArrowLeft className="mr-1.5 size-4" />
          Companies
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
            <AvatarImage src={company.logo} alt={company.name} />
            <AvatarFallback className="text-lg">
              {company.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
            {company.industry && (
              <Badge variant="secondary">{company.industry}</Badge>
            )}
            {company.domain && (
              <p className="text-sm text-muted-foreground">{company.domain}</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {company.phone && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`tel:${company.phone}`)}
            >
              <PhoneCall className="mr-1.5 size-3.5" />
              Call
            </Button>
          )}
          {company.website && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(company.website!, "_blank")}
            >
              <Globe className="mr-1.5 size-3.5" />
              Website
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setActiveTab("notes")}>
            <MessageSquarePlus className="mr-1.5 size-3.5" />
            Add Note
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("files")}>
            <FileUp className="mr-1.5 size-3.5" />
            Upload File
          </Button>
        </div>

        {/* Quick stats */}
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Contacts</span>
            <p className="font-semibold">{company.contactIds.length}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Deals</span>
            <p className="font-semibold">{company.dealIds.length}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Revenue</span>
            <p className="font-semibold">{formatRevenue(company.annualRevenue)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Size</span>
            <p className="font-semibold">{company.employeeCount ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts
            {contacts.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {contacts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activities">
            Activities
            {activities.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {activities.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-6 pt-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">Company Information</h3>
              <Separator className="my-3" />
              <div className="space-y-3">
                {company.phone && (
                  <InfoRow icon={Phone} label="Phone" value={company.phone} href={`tel:${company.phone}`} />
                )}
                {company.website && (
                  <InfoRow icon={Globe} label="Website" value={company.website} href={company.website} />
                )}
                {company.address?.city && (
                  <InfoRow
                    icon={MapPin}
                    label="Location"
                    value={[company.address.city, company.address.state, company.address.country]
                      .filter(Boolean)
                      .join(", ")}
                  />
                )}
                {company.domain && (
                  <InfoRow icon={ExternalLink} label="Domain" value={company.domain} />
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">Details</h3>
              <Separator className="my-3" />
              <div className="space-y-3">
                {company.tags.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {company.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(company.createdAt), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDistanceToNow(new Date(company.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Contacts */}
        <TabsContent value="contacts">
          <div className="rounded-lg border bg-card p-6 mt-4">
            {contacts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No contacts associated with this company.
              </p>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent"
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="text-xs">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize shrink-0">
                      {contact.status}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Deals */}
        <TabsContent value="deals">
          <div className="rounded-lg border bg-card p-6 mt-4">
            <p className="py-8 text-center text-sm text-muted-foreground">
              No deals associated with this company yet.
            </p>
          </div>
        </TabsContent>

        {/* Activities */}
        <TabsContent value="activities">
          <div className="rounded-lg border bg-card p-6 mt-4">
            {activities.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No activities recorded.</p>
            ) : (
              <ActivityTimeline activities={activities} />
            )}
          </div>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes">
          <div className="mt-4">
            <NotesPanel entityType="company" entityId={company.id} />
          </div>
        </TabsContent>

        {/* Files */}
        <TabsContent value="files">
          <div className="mt-4">
            <FilesPanel entityType="company" entityId={company.id} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <CompanyFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        company={company}
        isLoading={updateMutation.isPending}
        onSubmit={handleUpdate}
      />

      {/* Delete dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Company"
        description={`Are you sure you want to delete "${company.name}"? Associated contacts and deals will NOT be deleted, but their company link will be removed.`}
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
            {!isLast && (
              <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-border" />
            )}
            <div className={`z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${colors}`}>
              <Icon className="size-3.5" />
            </div>
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
                <Badge variant="outline" className="text-[10px] capitalize">{activity.type}</Badge>
                {activity.isCompleted && (
                  <Badge variant="secondary" className="text-[10px]">Completed</Badge>
                )}
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
        <a href={href} className="text-primary hover:underline" target={href.startsWith("http") ? "_blank" : undefined}>
          {value}
        </a>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CompanyDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-24" />
      <div className="rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}
