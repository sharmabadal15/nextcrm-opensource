import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "http://localhost:8000/api/v1";

/**
 * BFF Proxy — forwards all /api/backend/* requests to the FastAPI backend.
 *
 * Benefits:
 * - Backend URL stays server-side (never exposed to browser)
 * - Auth token injected server-side (no getSession() client round-trip)
 * - No CORS needed (same-origin)
 * - Single place for caching, rate-limiting, error transform
 */
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const backendPath = `/${path.join("/")}`;
  const url = new URL(`${BACKEND_API_URL}${backendPath}`);

  // Forward query params
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // Get auth token server-side
  const session = await auth();
  const headers: Record<string, string> = {};

  if (req.headers.get("content-type")) {
    headers["Content-Type"] = req.headers.get("content-type")!;
  }

  if (session?.backendToken) {
    headers["Authorization"] = `Bearer ${session.backendToken}`;
  }

  // Forward request to backend
  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    if (body) fetchOptions.body = body;
  }

  try {
    const backendRes = await fetch(url.toString(), fetchOptions);

    // 204 No Content
    if (backendRes.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await backendRes.json().catch(() => null);

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("[BFF Proxy] Backend request failed:", error);
    return NextResponse.json(
      { detail: "Backend service unavailable" },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
