import type { Contrat, Logement, Paiement } from "@/lib/api";

export type Tone = "neutral" | "success" | "warning" | "danger";

export type PropertySnapshot = {
  logement: Logement;
  ref: string;
  status: "Available" | "Pending" | "Occupied";
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

export function formatShortDate(value: string | null, fallback = "Pending"): string {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatLongDate(value: string | null, fallback = "Not set"): string {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function relativeTime(value: string | null): string {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / 3_600_000));

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
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

  if (["pending", "listed"].includes(normalized)) {
    return "warning";
  }

  if (["suspended", "rejected", "cancelled"].includes(normalized)) {
    return "danger";
  }

  return "neutral";
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
  const status: PropertySnapshot["status"] = activeContract
    ? activeContract.signature_status.toLowerCase() === "signed"
      ? "Occupied"
      : "Pending"
    : propertyContracts.length > 0
      ? "Pending"
      : "Available";

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
