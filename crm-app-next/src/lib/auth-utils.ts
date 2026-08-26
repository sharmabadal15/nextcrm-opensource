import { hashSync, compareSync } from "bcryptjs";

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string; // hashed
  avatar?: string;
  role: "admin" | "manager" | "sales_rep" | "viewer";
  organizationId: string;
}

// Pre-seeded users — passwords are bcrypt hashed
// Default password for all: "password123"
const HASHED_PASSWORD = hashSync("password123", 10);

const mockUserDB: MockUser[] = [
  {
    id: "user-1",
    firstName: "Badal",
    lastName: "Sharma",
    email: "badal@acme.com",
    password: HASHED_PASSWORD,
    avatar: undefined,
    role: "admin",
    organizationId: "org-1",
  },
  {
    id: "user-2",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah@acme.com",
    password: HASHED_PASSWORD,
    avatar: undefined,
    role: "manager",
    organizationId: "org-1",
  },
  {
    id: "user-3",
    firstName: "Mike",
    lastName: "Chen",
    email: "mike@acme.com",
    password: HASHED_PASSWORD,
    avatar: undefined,
    role: "sales_rep",
    organizationId: "org-1",
  },
];

export function findUserByEmail(email: string): MockUser | undefined {
  return mockUserDB.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}

export function registerUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): MockUser | { error: string } {
  if (findUserByEmail(data.email)) {
    return { error: "User with this email already exists" };
  }

  const newUser: MockUser = {
    id: `user-${Date.now()}`,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: hashSync(data.password, 10),
    role: "sales_rep",
    organizationId: "org-1",
  };

  mockUserDB.push(newUser);
  return newUser;
}
