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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanies } from "@/features/companies/hooks/use-companies";
import { useUsersList } from "@/hooks/use-users";
import {
  contactFormSchema,
  type ContactFormValues,
} from "../schemas/contact-schema";
import type { Contact } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  isLoading?: boolean;
  onSubmit: (values: ContactFormValues) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
  { value: "customer", label: "Customer" },
  { value: "inactive", label: "Inactive" },
] as const;

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "cold_call", label: "Cold Call" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  isLoading = false,
  onSubmit,
}: ContactFormDialogProps) {
  const isEdit = !!contact;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema) as never,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      companyId: "",
      status: "lead",
      source: undefined,
      ownerId: "",
      tags: [],
      address: { street: "", city: "", state: "", zip: "", country: "" },
    },
  });

  useEffect(() => {
    if (contact) {
      reset({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone ?? "",
        title: contact.title ?? "",
        companyId: contact.companyId ?? "",
        status: contact.status,
        source: contact.source,
        ownerId: contact.ownerId,
        tags: contact.tags,
        address: {
          street: contact.address?.street ?? "",
          city: contact.address?.city ?? "",
          state: contact.address?.state ?? "",
          zip: contact.address?.zip ?? "",
          country: contact.address?.country ?? "",
        },
      });
    } else {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        title: "",
        companyId: "",
        status: "lead",
        source: undefined,
        ownerId: "",
        tags: [],
        address: { street: "", city: "", state: "", zip: "", country: "" },
      });
    }
  }, [contact, reset]);

  const statusValue = watch("status");
  const sourceValue = watch("source");
  const companyValue = watch("companyId");
  const ownerValue = watch("ownerId");

  const { data: companiesData } = useCompanies({ page: 1, perPage: 50 });
  const companies = companiesData?.data ?? [];
  const { data: users } = useUsersList();
  const ownerObj = users.find((u) => u.id === ownerValue);

  const companyLabel = companies.find((c) => c.id === companyValue)?.name;
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === statusValue)?.label;
  const sourceLabel = SOURCE_OPTIONS.find((o) => o.value === sourceValue)?.label;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Contact" : "New Contact"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the contact's information below."
              : "Fill in the details to create a new contact."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
        >
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 000-0000"
                {...register("phone")}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              placeholder="VP of Sales"
              {...register("title")}
            />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Select
              value={companyValue}
              onValueChange={(val) => setValue("companyId", val ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select company">
                  {companyLabel ?? "Select company"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status + Source */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select
                value={statusValue}
                onValueChange={(val) =>
                  val && setValue("status", val as ContactFormValues["status"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status">
                    {statusLabel ?? "Select status"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select
                value={sourceValue ?? ""}
                onValueChange={(val) =>
                  setValue("source", (val ?? undefined) as ContactFormValues["source"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source">
                    {sourceLabel ?? "Select source"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              placeholder="Street"
              {...register("address.street")}
            />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="City" {...register("address.city")} />
              <Input placeholder="State" {...register("address.state")} />
              <Input placeholder="Zip" {...register("address.zip")} />
            </div>
          </div>

          {/* Owner */}
          <div className="space-y-1.5">
            <Label>Owner</Label>
            <Select
              value={ownerValue || ""}
              onValueChange={(val) => setValue("ownerId", val ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Auto-assigned to you">
                  {ownerObj
                    ? `${ownerObj.firstName} ${ownerObj.lastName}`
                    : "Auto-assigned to you"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Leave empty to auto-assign to yourself
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
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
                  : "Create Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
