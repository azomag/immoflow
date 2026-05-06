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

export function getLandingUrl() {
  return "/";
}

export function getAppBaseUrl() {
  return "";
}

export function getLoginUrl() {
  return "/login";
}

export function getSignupUrl() {
  return "/signup";
}

export function getLogoutUrl() {
  const fallback = typeof window !== "undefined" ? window.location.origin : "/";
  return `/api/landing/logout?callbackUrl=${encodeURIComponent(fallback)}`;
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
  return `${path}${profile ? "?tab=profile" : ""}`;
}

export function getListingUrl(property: PublicProperty) {
  return `/listings/${property.id}`;
}
