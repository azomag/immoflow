import type { PublicProperty } from "@/lib/public-properties";

export type LandingUser = {
  id: number | string;
  name: string;
  email: string;
  image?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  backendUser?: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    role: string;
  } | null;
};

export type LandingSession = {
  user?: LandingUser | null;
  expires?: string;
};

const FALLBACK_DASHBOARD_BASE_URL = "https://immoflow-gray.vercel.app";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

export function getAppBaseUrl() {
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
  if (dashboardUrl) {
    return normalizeBaseUrl(dashboardUrl);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();
  if (appUrl) {
    return normalizeBaseUrl(appUrl);
  }

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  return FALLBACK_DASHBOARD_BASE_URL;
}

export function getLoginUrl() {
  return `${getAppBaseUrl()}/login`;
}

export function getSignupUrl() {
  return `${getAppBaseUrl()}/signup`;
}

export function getLogoutUrl() {
  const fallback = typeof window !== "undefined" ? window.location.origin : "/";
  return `${getAppBaseUrl()}/api/landing/logout?callbackUrl=${encodeURIComponent(fallback)}`;
}

export function getDashboardUrl(role?: string | null, profile = false) {
  const rolePathMap: Record<string, string> = {
    super_admin: "super-admin",
    admin: "admin",
    agent: "agent",
    locataire: "locataire",
  };
  const rolePath = role ? rolePathMap[role] : null;
  const path = rolePath ? `/dashboard/${rolePath}` : "/dashboard";
  return `${getAppBaseUrl()}${path}${profile ? "?tab=profile" : ""}`;
}

export function getListingUrl(property: PublicProperty) {
  return `/listings/${property.id}`;
}
