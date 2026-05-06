const DEFAULT_LANDING_URL = "https://immoflow-maroc.vercel.app";

export function getLandingUrl() {
  return (process.env.NEXT_PUBLIC_LANDING_URL?.trim() || DEFAULT_LANDING_URL).replace(/\/$/, "");
}
