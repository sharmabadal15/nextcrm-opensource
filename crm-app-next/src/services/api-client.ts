// ============================================================
// API Client — BFF Proxy Pattern
// All requests go through /api/backend/* (same-origin)
// Auth token is injected server-side by the proxy
// ============================================================

import { signOut } from "next-auth/react";
import type { SearchParams } from "@/types";

// Proxy route — same origin, no CORS, token injected server-side
const API_BASE = "/api/backend";

// ---------------------------------------------------------------------------
// Snake ↔ Camel conversion
// ---------------------------------------------------------------------------

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export function keysToCamel<T>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as T;
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        snakeToCamel(k),
        keysToCamel(v),
      ])
    ) as T;
  }
  return obj as T;
}

export function keysToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToSnake(v));
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        camelToSnake(k),
        keysToSnake(v),
      ])
    );
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Payload sanitisation — strip empty strings so backend gets clean data
// ---------------------------------------------------------------------------

function cleanPayload(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(cleanPayload);
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== "" && v !== undefined)
        .map(([k, v]) => [k, cleanPayload(v)])
    );
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Build query string from SearchParams
// ---------------------------------------------------------------------------

function buildQueryString(params?: SearchParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();

  if (params.page) qs.set("page", String(params.page));
  if (params.perPage) qs.set("perPage", String(params.perPage));
  if (params.search) qs.set("search", params.search);
  if (params.sort?.field) qs.set("sort[field]", params.sort.field);
  if (params.sort?.direction) qs.set("sort[direction]", params.sort.direction);

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (value !== undefined && value !== null && value !== "") {
        qs.set(`filters[${key}]`, String(value));
      }
    }
  }

  const str = qs.toString();
  return str ? `?${str}` : "";
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(keysToSnake(cleanPayload(body))) : undefined,
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    if (res.status === 401) {
      // Token expired — sign out and redirect to login
      signOut({ callbackUrl: "/login" });
      throw new ApiError("Session expired. Redirecting to login…", 401);
    }
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.detail || errorData.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  const data = await res.json();
  return keysToCamel<T>(data);
}

// ---------------------------------------------------------------------------
// Public API Client
// ---------------------------------------------------------------------------

export const apiClient = {
  async get<T>(endpoint: string, params?: SearchParams): Promise<T> {
    return request<T>("GET", `${endpoint}${buildQueryString(params)}`);
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>("POST", endpoint, data);
  },

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>("PATCH", endpoint, data);
  },

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>("PUT", endpoint, data);
  },

  async delete(endpoint: string): Promise<void> {
    return request<void>("DELETE", endpoint);
  },
};
