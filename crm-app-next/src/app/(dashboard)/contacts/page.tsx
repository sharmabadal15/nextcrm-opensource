"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ContactsTable } from "@/features/contacts/components/contacts-table";

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Manage your contacts and leads"
      />
      <ContactsTable />
    </div>
  );
}
