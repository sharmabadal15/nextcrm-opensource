"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/config/pipeline";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function OrganizationSettingsPage() {
  const [orgName, setOrgName] = useState("Acme Corp");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Organization</h3>
        <p className="text-sm text-muted-foreground">
          Manage your organization details and defaults
        </p>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
          <Building2 className="size-6 text-muted-foreground" />
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Logo upload not available in demo")}
          >
            Upload Logo
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG up to 2MB. 200×200px recommended.
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 max-w-xl">
        <div className="space-y-2">
          <Label>Organization Name</Label>
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Default Currency</Label>
            <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={() => toast.success("Organization settings saved")}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
