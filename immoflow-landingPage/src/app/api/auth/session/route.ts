import { NextRequest, NextResponse } from "next/server";

const PRODUCTION_APP_BASE_URL = "https://immoflow-maroc.vercel.app";

function getAppBaseUrl(request: NextRequest) {
  const configured =
    process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    const host = request.headers.get("host") ?? "127.0.0.1:3000";
    const hostname = host.split(":")[0] || "127.0.0.1";
    return `http://${hostname}:3001`;
  }

  return PRODUCTION_APP_BASE_URL;
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
