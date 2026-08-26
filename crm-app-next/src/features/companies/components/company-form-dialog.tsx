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
import { useUsersList } from "@/hooks/use-users";
import {
  companyFormSchema,
  type CompanyFormValues,
} from "../schemas/company-schema";
import type { Company } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INDUSTRY_OPTIONS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Media",
  "Consulting",
  "Energy",
];

const SIZE_OPTIONS = [
  { value: "1-10", label: "1–10" },
  { value: "11-50", label: "11–50" },
  { value: "51-200", label: "51–200" },
  { value: "201-1000", label: "201–1,000" },
  { value: "1001+", label: "1,001+" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  isLoading?: boolean;
  onSubmit: (values: CompanyFormValues) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  isLoading,
  onSubmit,
}: CompanyFormDialogProps) {
  const isEdit = !!company;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema) as never,
    defaultValues: {
      name: "",
      domain: "",
      industry: undefined,
      employeeCount: undefined,
      annualRevenue: undefined,
      phone: "",
      website: "",
      ownerId: "",
      tags: [],
      address: { street: "", city: "", state: "", zip: "", country: "" },
    },
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        domain: company.domain ?? "",
        industry: company.industry ?? undefined,
        employeeCount: company.employeeCount ?? undefined,
        annualRevenue: company.annualRevenue ?? undefined,
        phone: company.phone ?? "",
        website: company.website ?? "",
        ownerId: company.ownerId,
        tags: company.tags,
        address: {
          street: company.address?.street ?? "",
          city: company.address?.city ?? "",
          state: company.address?.state ?? "",
          zip: company.address?.zip ?? "",
          country: company.address?.country ?? "",
        },
      });
    } else {
      reset({
        name: "",
        domain: "",
        industry: undefined,
        employeeCount: undefined,
        annualRevenue: undefined,
        phone: "",
        website: "",
        ownerId: "",
        tags: [],
        address: { street: "", city: "", state: "", zip: "", country: "" },
      });
    }
  }, [company, reset]);

  const industryValue = watch("industry");
  const sizeValue = watch("employeeCount");
  const ownerValue = watch("ownerId");

  const { data: users } = useUsersList();
  const ownerObj = users.find((u) => u.id === ownerValue);

  const industryLabel = industryValue ?? "Select industry";
  const sizeLabel = SIZE_OPTIONS.find((o) => o.value === sizeValue)?.label ?? "Select size";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Company" : "New Company"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the company's information below."
              : "Fill in the details to create a new company."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 py-2"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Company Name *</Label>
            <Input placeholder="Acme Inc." {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Domain + Website */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <Input placeholder="acme.com" {...register("domain")} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input placeholder="https://acme.com" {...register("website")} />
            </div>
          </div>

          {/* Industry + Size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Select
                value={industryValue ?? ""}
                onValueChange={(val) => setValue("industry", val || undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select industry">
                    {industryLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Company Size</Label>
              <Select
                value={sizeValue ?? ""}
                onValueChange={(val) =>
                  setValue("employeeCount", (val || undefined) as CompanyFormValues["employeeCount"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select size">
                    {sizeLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Phone + Revenue */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+1 (555) 000-0000" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Annual Revenue</Label>
              <Input
                type="number"
                placeholder="1000000"
                {...register("annualRevenue")}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input placeholder="Street" {...register("address.street")} />
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : isEdit
                  ? "Update Company"
                  : "Create Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
