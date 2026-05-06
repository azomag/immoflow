import { NextRequest, NextResponse } from "next/server";

const FALLBACK_DASHBOARD_BASE_URL = "https://immoflow-gray.vercel.app";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

function getAppBaseUrl(request: NextRequest) {
  const dashboardUrl =
    process.env.DASHBOARD_BASE_URL?.trim() || process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
  if (dashboardUrl) {
    return normalizeBaseUrl(dashboardUrl);
  }

  const appUrl =
    process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();
  if (appUrl) {
    return normalizeBaseUrl(appUrl);
  }

  if (process.env.NODE_ENV === "development") {
    const host = request.headers.get("host") ?? "127.0.0.1:3000";
    const hostname = host.split(":")[0] || "127.0.0.1";
    return `http://${hostname}:3001`;
  }

  return FALLBACK_DASHBOARD_BASE_URL;
}

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") ?? "";

  if (!cookie) {
    return NextResponse.json({});
  }

  try {
    const response = await fetch(`${getAppBaseUrl(request)}/api/auth/session`, {
      headers: {
        Accept: "application/json",
        Cookie: cookie,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({}, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({});
  }
}
