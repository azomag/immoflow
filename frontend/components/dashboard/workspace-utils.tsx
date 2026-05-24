import type { Commune, Contrat, Logement, Paiement } from "@/lib/api";

export type Tone = "neutral" | "success" | "warning" | "danger";
export type PropertyDisplayStatus =
  | "Available"
  | "Reservation in progress"
  | "Reserved"
  | "Pending"
  | "Occupied"
  | "Draft"
  | "Maintenance";

export const PROPERTY_STATUS_OPTIONS = [
  { value: "disponible", label: "Available" },
  { value: "en_cours_reservation", label: "Reservation in progress" },
  { value: "reserve", label: "Reserved" },
] as const;

export type PropertySnapshot = {
  logement: Logement;
  ref: string;
  status: PropertyDisplayStatus;
  activeContract: Contrat | null;
  latestContract: Contrat | null;
  tenantName: string | null;
  nextEventDate: string | null;
  collectionsTotal: number;
  paymentCount: number;
};

export function formatMoney(value: number | string): string {
  const amount =
    typeof value === "number" ? value : Number.parseFloat(value || "0");

  return new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function uniqueAddressParts(address: string): string[] {
  const seen = new Set<string>();

  return address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const key = part.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function limitText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

export function propertyDisplayTitle(logement: Logement): string {
  const title = logement.titre?.trim();
  if (title) {
    return limitText(title, 72);
  }

  const [primaryAddress] = uniqueAddressParts(logement.adresse);
  return limitText(primaryAddress || logement.adresse || "Property", 72);
}

export function propertyDisplaySubtitle(logement: Logement): string {
  const cityCountry = [logement.city, logement.country].filter(Boolean).join(", ");
  if (cityCountry) {
    return cityCountry;
  }

  return limitText(uniqueAddressParts(logement.adresse).slice(1, 4).join(", "), 96);
}

function normalizeLocationText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function autoCommuneId(
  communes: Commune[],
  location: { address?: string; city?: string; country?: string },
): string {
  const hayPart = /(?:^|,\s*)(hay\s+[^,]+)/i.exec(location.address ?? "")?.[1] ?? "";
  const candidates = [location.city, hayPart, ...(location.address ?? "").split(",")]
    .filter((candidate): candidate is string => Boolean(candidate?.trim()))
    .map(normalizeLocationText);

  const matched = communes.find((commune) => {
    const communeName = normalizeLocationText(commune.nom);
    return candidates.some(
      (candidate) =>
        candidate === communeName ||
        candidate.includes(communeName) ||
        communeName.includes(candidate),
    );
  });

  return matched ? String(matched.id) : "";
}

export function getLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), 12);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatShortDate(value: string | null, fallback = "Pending"): string {
  const date = parseDateValue(value);
  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatLongDate(value: string | null, fallback = "Not set"): string {
  const date = parseDateValue(value);
  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null, fallback = "Not recorded"): string {
  const date = parseDateValue(value);
  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function relativeTime(value: string | null): string {
  const date = parseDateValue(value);
  if (!date) {
    return "Recently";
  }

  const diffMs = Date.now() - date.getTime();
  const isFuture = diffMs < 0;
  const diffHours = Math.max(1, Math.round(Math.abs(diffMs) / 3_600_000));
  const suffix = isFuture ? "from now" : "ago";

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ${suffix}`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ${suffix}`;
  }

  return formatShortDate(value);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function toneForStatus(status: string): Tone {
  const normalized = status.toLowerCase();

  if (["active", "occupied", "paid", "signed", "available"].includes(normalized)) {
    return "success";
  }

  if (
    [
      "pending",
      "listed",
      "awaiting_tenant_approval",
      "partial",
      "reservation in progress",
    ].includes(normalized)
  ) {
    return "warning";
  }

  if (["suspended", "rejected", "cancelled", "reserved"].includes(normalized)) {
    return "danger";
  }

  return "neutral";
}

export function propertyStatusLabel(status: string | null | undefined): PropertyDisplayStatus | null {
  switch (status) {
    case "disponible":
      return "Available";
    case "en_cours_reservation":
      return "Reservation in progress";
    case "reserve":
      return "Reserved";
    case "draft":
      return "Draft";
    case "maintenance":
      return "Maintenance";
    default:
      return null;
  }
}

export function buildPropertySnapshot(
  logement: Logement,
  contrats: Contrat[],
  paiements: Paiement[],
): PropertySnapshot {
  const propertyContracts = contrats
    .filter((contrat) => contrat.logement.id === logement.id)
    .sort(
      (left, right) =>
        new Date(right.date_debut).getTime() - new Date(left.date_debut).getTime(),
    );

  const activeContract =
    propertyContracts.find((contrat) => contrat.statut.toLowerCase() === "active") ?? null;
  const latestContract = propertyContracts[0] ?? null;
  const paymentItems = paiements.filter(
    (paiement) => paiement.contrat.logement.id === logement.id,
  );
  const status: PropertySnapshot["status"] =
    propertyStatusLabel(logement.statut_publication) ??
    (activeContract
      ? activeContract.signature_status.toLowerCase() === "signed"
        ? "Occupied"
        : "Pending"
      : propertyContracts.length > 0
        ? "Pending"
        : "Available");

  return {
    logement,
    ref: `PRP-${String(logement.id).padStart(4, "0")}`,
    status,
    activeContract,
    latestContract,
    tenantName:
      activeContract?.locataire.user.name ?? latestContract?.locataire.user.name ?? null,
    nextEventDate:
      activeContract?.date_fin ??
      latestContract?.date_debut ??
      paymentItems[0]?.date_paiement ??
      null,
    collectionsTotal: paymentItems.reduce(
      (total, paiement) => total + Number.parseFloat(paiement.montant || "0"),
      0,
    ),
    paymentCount: paymentItems.length,
  };
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
