"use client";

import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const INTEGRATIONS = [
  {
    name: "Slack",
    description: "Get CRM notifications in Slack channels",
    icon: "💬",
    status: "available" as const,
  },
  {
    name: "Gmail",
    description: "Sync emails with contacts and deals",
    icon: "📧",
    status: "available" as const,
  },
  {
    name: "Google Calendar",
    description: "Sync meetings and activities with Google Calendar",
    icon: "📅",
    status: "available" as const,
  },
  {
    name: "Zapier",
    description: "Connect with 5000+ apps via Zapier automations",
    icon: "⚡",
    status: "available" as const,
  },
  {
    name: "Stripe",
    description: "Sync payment data with deals and revenue reports",
    icon: "💳",
    status: "coming_soon" as const,
  },
  {
    name: "HubSpot",
    description: "Import contacts and companies from HubSpot",
    icon: "🔶",
    status: "coming_soon" as const,
  },
  {
    name: "Mailchimp",
    description: "Sync contacts with email marketing campaigns",
    icon: "🐵",
    status: "coming_soon" as const,
  },
  {
    name: "Twilio",
    description: "Make and log calls directly from the CRM",
    icon: "📞",
    status: "coming_soon" as const,
  },
];

export default function IntegrationsSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect your CRM with third-party tools
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.name}
            className="flex flex-col rounded-lg border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <h4 className="font-semibold">{integration.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {integration.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {integration.status === "available" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.info(`${integration.name} integration coming with backend`)
                  }
                >
                  <ExternalLink className="mr-1.5 size-3.5" />
                  Connect
                </Button>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
