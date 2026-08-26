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
import { CURRENCIES } from "@/config/pipeline";
import { useContacts } from "@/features/contacts/hooks/use-contacts";
import { useCompanies } from "@/features/companies/hooks/use-companies";
import { useUsersList } from "@/hooks/use-users";
import { useDefaultPipeline } from "../hooks/use-pipelines";
import { dealFormSchema, type DealFormValues } from "../schemas/deal-schema";
import type { Deal } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  defaultStageId?: string;
  isLoading?: boolean;
  onSubmit: (values: DealFormValues) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  defaultStageId,
  isLoading,
  onSubmit,
}: DealFormDialogProps) {
  const isEdit = !!deal;
  const { data: pipeline } = useDefaultPipeline();
  const stages = pipeline?.stages ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema) as never,
    defaultValues: {
      title: "",
      value: 0,
      currency: "USD",
      pipelineId: pipeline?.id ?? "",
      stageId: defaultStageId ?? stages[0]?.id ?? "",
      probability: stages[0]?.probability ?? 10,
      expectedCloseDate: "",
      contactId: "",
      companyId: "",
      ownerId: "",
      tags: [],
    },
  });

  useEffect(() => {
    if (deal) {
      reset({
        title: deal.title,
        value: deal.value,
        currency: deal.currency,
        pipelineId: deal.pipelineId,
        stageId: deal.stageId,
        probability: deal.probability,
        expectedCloseDate: deal.expectedCloseDate?.slice(0, 10) ?? "",
        contactId: deal.contactId ?? "",
        companyId: deal.companyId ?? "",
        ownerId: deal.ownerId,
        tags: deal.tags,
      });
    } else {
      reset({
        title: "",
        value: 0,
        currency: "USD",
        pipelineId: pipeline?.id ?? "",
        stageId: defaultStageId ?? stages[0]?.id ?? "",
        probability: stages[0]?.probability ?? 10,
        expectedCloseDate: "",
        contactId: "",
        companyId: "",
        ownerId: "",
        tags: [],
      });
    }
  }, [deal, defaultStageId, reset, stages]);

  const stageValue = watch("stageId");
  const contactValue = watch("contactId");
  const companyValue = watch("companyId");
  const currencyValue = watch("currency");

  const { data: contactsData } = useContacts({ page: 1, perPage: 50 });
  const { data: companiesData } = useCompanies({ page: 1, perPage: 50 });
  const { data: users } = useUsersList();
  const contacts = contactsData?.data ?? [];
  const companies = companiesData?.data ?? [];
  const ownerValue = watch("ownerId");
  const ownerObj = users.find((u) => u.id === ownerValue);

  const stageLabel = stages.find((s) => s.id === stageValue)?.name ?? "Select stage";
  const contactObj = contacts.find((c) => c.id === contactValue);
  const contactLabel = contactObj ? `${contactObj.firstName} ${contactObj.lastName}` : "Select contact";
  const companyLabel = companies.find((c) => c.id === companyValue)?.name ?? "Select company";
  const currencyLabel = CURRENCIES.find((c) => c.value === currencyValue)?.label ?? "USD ($)";

  const handleStageChange = (val: string | null) => {
    if (!val) return;
    setValue("stageId", val);
    const stage = stages.find((s) => s.id === val);
    if (stage) setValue("probability", stage.probability);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Deal" : "New Deal"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the deal information below."
              : "Fill in the details to create a new deal."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Deal Title *</Label>
            <Input placeholder="Enterprise License - Acme" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Value + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Value *</Label>
              <Input type="number" placeholder="25000" {...register("value")} />
              {errors.value && (
                <p className="text-xs text-destructive">{errors.value.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={currencyValue}
                onValueChange={(val) => setValue("currency", val ?? "USD")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{currencyLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stage + Probability */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stage *</Label>
              <Select value={stageValue} onValueChange={handleStageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>{stageLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Probability (%)</Label>
              <Input type="number" min={0} max={100} {...register("probability")} />
            </div>
          </div>

          {/* Expected Close */}
          <div className="space-y-1.5">
            <Label>Expected Close Date</Label>
            <Input type="date" {...register("expectedCloseDate")} />
          </div>

          {/* Contact + Company */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contact</Label>
              <Select
                value={contactValue || "none"}
                onValueChange={(val) => setValue("contactId", val === "none" ? "" : (val ?? ""))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{contactValue ? contactLabel : "Select contact"}</SelectValue>
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
                value={companyValue || "none"}
                onValueChange={(val) => setValue("companyId", val === "none" ? "" : (val ?? ""))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{companyValue ? companyLabel : "Select company"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {isLoading ? "Saving..." : isEdit ? "Update Deal" : "Create Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
