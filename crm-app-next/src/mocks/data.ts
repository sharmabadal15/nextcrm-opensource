import { faker } from "@faker-js/faker";
import type {
  User,
  Organization,
  Contact,
  Company,
  Deal,
  Activity,
  Notification,
  ContactStatus,
  LeadSource,
  DealStatus,
  ActivityType,
  Priority,
  CompanySize,
} from "@/types";
import { DEFAULT_PIPELINE } from "@/config/pipeline";

faker.seed(42);

// --- Organization ---
export const mockOrganization: Organization = {
  id: "org-1",
  name: "Acme Corp",
  slug: "acme-corp",
  logo: undefined,
  plan: "professional",
  settings: {
    currency: "USD",
    timezone: "America/New_York",
    dateFormat: "MM/dd/yyyy",
    fiscalYearStart: 1,
  },
  createdAt: "2024-01-01T00:00:00Z",
};

// --- Users ---
export const mockUsers: User[] = [
  {
    id: "user-1",
    firstName: "Badal",
    lastName: "Sharma",
    email: "badal@acme.com",
    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=badal`,
    role: "admin",
    organizationId: "org-1",
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: "2024-01-01T00:00:00Z",
  },
  ...Array.from({ length: 4 }, (_, i) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
      id: `user-${i + 2}`,
      firstName,
      lastName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${firstName}`,
      role: (["manager", "sales_rep", "sales_rep", "viewer"] as const)[i],
      organizationId: "org-1",
      isActive: true,
      lastLoginAt: faker.date.recent({ days: 7 }).toISOString(),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    };
  }),
];

// --- Companies ---
const industries = [
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

const companySizes: CompanySize[] = [
  "1-10",
  "11-50",
  "51-200",
  "201-1000",
  "1001+",
];

export const mockCompanies: Company[] = Array.from({ length: 20 }, (_, i) => {
  const name = faker.company.name();
  return {
    id: `company-${i + 1}`,
    name,
    domain: faker.internet.domainName(),
    logo: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
    industry: faker.helpers.arrayElement(industries),
    employeeCount: faker.helpers.arrayElement(companySizes),
    annualRevenue: faker.number.int({ min: 100000, max: 50000000 }),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zip: faker.location.zipCode(),
      country: "US",
    },
    phone: faker.phone.number(),
    website: `https://${faker.internet.domainName()}`,
    contactIds: [],
    dealIds: [],
    ownerId: faker.helpers.arrayElement(mockUsers).id,
    tags: faker.helpers.arrayElements(
      ["enterprise", "startup", "partner", "prospect", "key-account"],
      { min: 0, max: 3 }
    ),
    customFields: {},
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
  };
});

// --- Contacts ---
const contactStatuses: ContactStatus[] = [
  "active",
  "inactive",
  "lead",
  "prospect",
  "customer",
];

const leadSources: LeadSource[] = [
  "website",
  "referral",
  "linkedin",
  "cold_call",
  "event",
  "other",
];

export const mockContacts: Contact[] = Array.from({ length: 50 }, (_, i) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const company = faker.helpers.arrayElement(mockCompanies);
  const contact: Contact = {
    id: `contact-${i + 1}`,
    firstName,
    lastName,
    email: faker.internet
      .email({ firstName, lastName, provider: company.domain })
      .toLowerCase(),
    phone: faker.phone.number(),
    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${firstName}${lastName}`,
    title: faker.person.jobTitle(),
    companyId: company.id,
    status: faker.helpers.arrayElement(contactStatuses),
    source: faker.helpers.arrayElement(leadSources),
    tags: faker.helpers.arrayElements(
      ["decision-maker", "influencer", "champion", "vip", "new-lead"],
      { min: 0, max: 2 }
    ),
    ownerId: faker.helpers.arrayElement(mockUsers).id,
    customFields: {},
    address: {
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      country: "US",
    },
    socialProfiles: {
      linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
    },
    lastContactedAt: faker.date.recent({ days: 60 }).toISOString(),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 14 }).toISOString(),
  };
  return contact;
});

// Link contacts back to companies
mockContacts.forEach((contact) => {
  if (contact.companyId) {
    const company = mockCompanies.find((c) => c.id === contact.companyId);
    if (company && !company.contactIds.includes(contact.id)) {
      company.contactIds.push(contact.id);
    }
  }
});

// --- Deals ---
const activePipelineStages = DEFAULT_PIPELINE.stages.filter(
  (s) => s.order < 4
);

export const mockDeals: Deal[] = Array.from({ length: 30 }, (_, i) => {
  const stage = faker.helpers.arrayElement(activePipelineStages);
  const isOpen = stage.order < 4;
  const contact = faker.helpers.arrayElement(mockContacts);
  const status: DealStatus = isOpen
    ? "open"
    : faker.helpers.arrayElement(["won", "lost"]);

  const deal: Deal = {
    id: `deal-${i + 1}`,
    title: `${faker.commerce.productName()} - ${faker.company.name()}`,
    value: faker.number.int({ min: 1000, max: 250000 }),
    currency: "USD",
    pipelineId: DEFAULT_PIPELINE.id,
    stageId: stage.id,
    probability: stage.probability,
    expectedCloseDate: faker.date
      .soon({ days: 90, refDate: new Date() })
      .toISOString(),
    actualCloseDate: status !== "open" ? faker.date.recent({ days: 30 }).toISOString() : undefined,
    status,
    lostReason:
      status === "lost"
        ? faker.helpers.arrayElement([
            "Budget constraints",
            "Chose competitor",
            "Timing not right",
            "No response",
          ])
        : undefined,
    contactId: contact.id,
    companyId: contact.companyId,
    ownerId: faker.helpers.arrayElement(mockUsers).id,
    tags: faker.helpers.arrayElements(["high-value", "urgent", "renewal", "upsell"], {
      min: 0,
      max: 2,
    }),
    customFields: {},
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 7 }).toISOString(),
  };
  return deal;
});

// Link deals to companies
mockDeals.forEach((deal) => {
  if (deal.companyId) {
    const company = mockCompanies.find((c) => c.id === deal.companyId);
    if (company && !company.dealIds.includes(deal.id)) {
      company.dealIds.push(deal.id);
    }
  }
});

// --- Activities ---
const activityTypes: ActivityType[] = [
  "call",
  "email",
  "meeting",
  "task",
  "note",
  "lunch",
];
const priorities: Priority[] = ["low", "medium", "high", "urgent"];

export const mockActivities: Activity[] = Array.from(
  { length: 100 },
  (_, i) => {
    const type = faker.helpers.arrayElement(activityTypes);
    const isCompleted = faker.datatype.boolean({ probability: 0.6 });
    const contact = faker.helpers.arrayElement(mockContacts);
    const deal = faker.helpers.maybe(
      () => faker.helpers.arrayElement(mockDeals),
      { probability: 0.5 }
    );

    return {
      id: `activity-${i + 1}`,
      type,
      subject: getActivitySubject(type),
      description: faker.lorem.sentence(),
      dueDate:
        type === "task" || type === "meeting"
          ? faker.date.soon({ days: 14 }).toISOString()
          : undefined,
      completedAt: isCompleted
        ? faker.date.recent({ days: 7 }).toISOString()
        : undefined,
      isCompleted,
      priority: faker.helpers.arrayElement(priorities),
      contactId: contact.id,
      companyId: contact.companyId,
      dealId: deal?.id,
      ownerId: faker.helpers.arrayElement(mockUsers).id,
      participants:
        type === "meeting"
          ? faker.helpers.arrayElements(
              mockUsers.map((u) => u.id),
              { min: 1, max: 3 }
            )
          : undefined,
      duration:
        type === "call"
          ? faker.number.int({ min: 5, max: 60 })
          : type === "meeting"
            ? faker.number.int({ min: 15, max: 120 })
            : undefined,
      outcome:
        type === "call"
          ? faker.helpers.arrayElement([
              "Left voicemail",
              "Connected",
              "No answer",
              "Busy",
            ])
          : undefined,
      createdAt: faker.date.past({ years: 1 }).toISOString(),
      updatedAt: faker.date.recent({ days: 7 }).toISOString(),
    };
  }
);

function getActivitySubject(type: ActivityType): string {
  switch (type) {
    case "call":
      return `Call with ${faker.person.fullName()}`;
    case "email":
      return `Email: ${faker.lorem.sentence({ min: 3, max: 6 })}`;
    case "meeting":
      return `Meeting: ${faker.company.buzzPhrase()}`;
    case "task":
      return faker.helpers.arrayElement([
        "Follow up on proposal",
        "Send contract",
        "Schedule demo",
        "Prepare presentation",
        "Update CRM records",
        "Research competitor",
        "Review pricing",
        "Prepare quarterly review",
      ]);
    case "note":
      return `Note: ${faker.lorem.sentence({ min: 3, max: 6 })}`;
    case "lunch":
      return `Lunch with ${faker.person.fullName()}`;
    default:
      return faker.lorem.sentence();
  }
}

// --- Notifications ---
export const mockNotifications: Notification[] = Array.from(
  { length: 8 },
  (_, i) => ({
    id: `notification-${i + 1}`,
    title: faker.helpers.arrayElement([
      "New deal assigned",
      "Contact updated",
      "Task overdue",
      "Deal won!",
      "Meeting reminder",
      "New comment",
      "Import complete",
      "Report ready",
    ]),
    message: faker.lorem.sentence(),
    type: faker.helpers.arrayElement(["info", "success", "warning", "error"] as const),
    read: i > 2,
    link: faker.helpers.arrayElement([
      "/deals/deal-1",
      "/contacts/contact-1",
      "/activities",
    ]),
    createdAt: faker.date.recent({ days: 3 }).toISOString(),
  })
);
