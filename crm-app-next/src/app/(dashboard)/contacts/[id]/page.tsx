"use client";

import { use } from "react";
import { ContactDetailView } from "@/features/contacts/components/contact-detail-view";

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ContactDetailView contactId={id} />;
}
