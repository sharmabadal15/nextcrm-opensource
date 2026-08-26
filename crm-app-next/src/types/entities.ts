// ============================================================
// CRM Core Entity Types
// ============================================================

// --- Enums / Union Types ---

export type ContactStatus =
  | "active"
  | "inactive"
  | "lead"
  | "prospect"
  | "customer";

export type LeadSource =
  | "website"
  | "referral"
  | "linkedin"
  | "cold_call"
  | "event"
  | "other";

export type DealStatus = "open" | "won" | "lost";

export type ActivityType =
  | "call"
  | "email"
  | "meeting"
  | "task"
  | "note"
  | "lunch";

export type Priority = "low" | "medium" | "high" | "urgent";

export type UserRole = "admin" | "manager" | "sales_rep" | "viewer";

export type CompanySize =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-1000"
  | "1001+";

export type FileCategory =
  | "contract"
  | "proposal"
  | "nda"
  | "invoice"
  | "other";

export type OrgPlan = "free" | "starter" | "professional" | "enterprise";

// --- Shared Types ---

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface SocialProfiles {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  github?: string;
}

// --- Core Entities ---

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: UserRole;
  teamId?: string;
  organizationId: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  plan: OrgPlan;
  settings: OrganizationSettings;
  createdAt: string;
}

export interface OrganizationSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: number;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  title?: string;
  companyId?: string;
  company?: Company;
  status: ContactStatus;
  source?: LeadSource;
  tags: string[];
  ownerId: string;
  owner?: User;
  customFields: Record<string, unknown>;
  address?: Address;
  socialProfiles?: SocialProfiles;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  logo?: string;
  industry?: string;
  employeeCount?: CompanySize;
  annualRevenue?: number;
  address?: Address;
  phone?: string;
  website?: string;
  contactIds: string[];
  dealIds: string[];
  ownerId: string;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  pipelineId: string;
  stageId: string;
  stage?: PipelineStage;
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  status: DealStatus;
  lostReason?: string;
  contactId?: string;
  contact?: Contact;
  companyId?: string;
  company?: Company;
  ownerId: string;
  owner?: User;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color: string;
  dealCount?: number;
  totalValue?: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  richDescription?: Record<string, unknown>;
  dueDate?: string;
  completedAt?: string;
  isCompleted: boolean;
  priority: Priority;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  ownerId: string;
  participants?: string[];
  duration?: number;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  url: string;
  uploadedBy: string;
  entityType: "contact" | "company" | "deal";
  entityId: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // HTML from Tiptap
  entityType: "contact" | "company" | "deal";
  entityId: string;
  ownerId: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  link?: string;
  createdAt: string;
}
