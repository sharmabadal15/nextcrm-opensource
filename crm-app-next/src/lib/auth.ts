import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000/api/v1";

declare module "next-auth" {
  interface User {
    role?: string;
    firstName?: string;
    lastName?: string;
    backendToken?: string;
    refreshToken?: string;
    organizationId?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: string;
      firstName: string;
      lastName: string;
      organizationId: string;
    };
    backendToken?: string;
  }
}

// @ts-expect-error — next-auth v5 beta doesn't expose this module for augmentation yet
declare module "@auth/core/jwt" {  // eslint-disable-line
  interface JWT {
    role?: string;
    firstName?: string;
    lastName?: string;
    backendToken?: string;
    refreshToken?: string;
    backendTokenExpiry?: number;
    organizationId?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
    // signOut: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // Authenticate against the real backend
          const loginRes = await fetch(`${BACKEND_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!loginRes.ok) return null;

          const tokens = await loginRes.json();

          // Fetch user profile with the access token
          const meRes = await fetch(`${BACKEND_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });

          if (!meRes.ok) return null;

          const user = await meRes.json();

          return {
            id: user.id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            image: user.avatar ?? null,
            backendToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            organizationId: user.organization_id,
          };
        } catch (error) {
          console.error("Backend auth error:", error);
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? "sales_rep";
        token.firstName = user.firstName ?? token.name?.split(" ")[0] ?? "";
        token.lastName = user.lastName ?? token.name?.split(" ").slice(1).join(" ") ?? "";
        token.backendToken = user.backendToken;
        token.refreshToken = user.refreshToken;
        // Backend access token expires in 15 min — store expiry with 1 min buffer
        token.backendTokenExpiry = Date.now() + 14 * 60 * 1000;
        token.organizationId = user.organizationId;
      }

      // Auto-refresh backend token if expired
      if (typeof token.backendTokenExpiry === "number" && Date.now() > token.backendTokenExpiry && token.refreshToken) {
        try {
          const res = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: token.refreshToken }),
          });
          if (res.ok) {
            const tokens = await res.json();
            token.backendToken = tokens.access_token;
            token.refreshToken = tokens.refresh_token;
            token.backendTokenExpiry = Date.now() + 14 * 60 * 1000;
          } else {
            // Refresh failed — force re-login
            token.backendToken = undefined;
            token.refreshToken = undefined;
          }
        } catch {
          // Network error — keep existing token, will retry next request
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      session.user.role = (token.role as string) ?? "sales_rep";
      session.user.firstName = (token.firstName as string) ?? "";
      session.user.lastName = (token.lastName as string) ?? "";
      session.user.organizationId = (token.organizationId as string) ?? "";
      session.backendToken = token.backendToken as string;
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/contacts") ||
        nextUrl.pathname.startsWith("/companies") ||
        nextUrl.pathname.startsWith("/deals") ||
        nextUrl.pathname.startsWith("/activities") ||
        nextUrl.pathname.startsWith("/calendar") ||
        nextUrl.pathname.startsWith("/reports") ||
        nextUrl.pathname.startsWith("/settings");
      const isOnAuth = nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
});
