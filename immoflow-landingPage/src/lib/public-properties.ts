export type PublicProperty = {
  id: number;
  adresse: string;
  titre: string | null;
  description: string | null;
  superficie: string;
  loyer: string;
  chambres: number | null;
  salles_bain: number | null;
  etage: string | null;
  parking: boolean;
  chauffage: string | null;
  statut_publication: string;
  images: string[] | null;
  commune: {
    id: number;
    nom: string;
    nombre_habitants?: number;
    distance_agence?: string;
  };
  type_logement: {
    id: number;
    nom_type: string;
    charge_forfaitaires?: string;
    date?: string | null;
  };
  agent: {
    id: number;
    code_agent: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
};

type PublicPropertiesResponse = {
  logements: PublicProperty[];
};

type PublicPropertyResponse = {
  logement: PublicProperty;
};

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8001";
const fallbackImages = ["/images/property-1.png", "/images/property-2.png", "/images/property-3.png"];

export const fallbackPublicProperties: PublicProperty[] = [
  {
    id: 1,
    adresse: "Casablanca Finance City",
    titre: "Palm View Residence",
    description:
      "Appartement lumineux avec salon ouvert, finitions modernes, cuisine equipee et acces rapide aux services du quartier.",
    superficie: "86",
    loyer: "8500",
    chambres: 2,
    salles_bain: 2,
    etage: "4",
    parking: true,
    chauffage: "Climatisation reversible",
    statut_publication: "listed",
    images: ["/images/property-1.png", "/images/property-2.png", "/images/property-3.png"],
    commune: { id: 1, nom: "Casablanca" },
    type_logement: { id: 1, nom_type: "Appartement" },
    agent: {
      id: 1,
      code_agent: "AG-001",
      user: { id: 1, name: "Immoflow Agent", email: "contact@immoflow.app" },
    },
  },
  {
    id: 2,
    adresse: "Agdal, Rabat",
    titre: "Residence Horizon",
    description:
      "Logement familial proche des transports, avec espaces bien distribues, chambres calmes et bonne exposition.",
    superficie: "112",
    loyer: "12000",
    chambres: 3,
    salles_bain: 2,
    etage: "2",
    parking: true,
    chauffage: "Central",
    statut_publication: "listed",
    images: ["/images/property-2.png", "/images/property-1.png", "/images/property-3.png"],
    commune: { id: 2, nom: "Rabat" },
    type_logement: { id: 2, nom_type: "Appartement familial" },
    agent: {
      id: 1,
      code_agent: "AG-001",
      user: { id: 1, name: "Immoflow Agent", email: "contact@immoflow.app" },
    },
  },
  {
    id: 3,
    adresse: "Marina Bay, Tanger",
    titre: "Marina Loft",
    description:
      "Loft contemporain avec vue degagee, grande piece de vie, coin nuit confortable et acces direct au front de mer.",
    superficie: "74",
    loyer: "15000",
    chambres: 1,
    salles_bain: 1,
    etage: "7",
    parking: false,
    chauffage: "Electrique",
    statut_publication: "listed",
    images: ["/images/property-3.png", "/images/property-2.png", "/images/property-1.png"],
    commune: { id: 3, nom: "Tanger" },
    type_logement: { id: 3, nom_type: "Loft" },
    agent: {
      id: 1,
      code_agent: "AG-001",
      user: { id: 1, name: "Immoflow Agent", email: "contact@immoflow.app" },
    },
  },
];

export function getLandingApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return DEFAULT_API_BASE_URL;
  }

  throw new Error(
    "Missing NEXT_PUBLIC_API_BASE_URL in production. Set it to your Railway backend URL.",
  );
}

export function getPropertyImages(property: PublicProperty) {
  const images = property.images?.filter(Boolean) ?? [];
  return images.length > 0 ? images : [fallbackImages[property.id % fallbackImages.length]];
}

export function getPropertyTitle(property: PublicProperty) {
  return property.titre?.trim() || property.adresse;
}

export function getPropertyLocation(property: PublicProperty) {
  return [property.commune?.nom, property.adresse].filter(Boolean).join(", ");
}

export function getPropertyPriceValue(property: PublicProperty) {
  const value = Number.parseFloat(property.loyer);
  return Number.isFinite(value) ? value : 0;
}

export function formatPropertyPrice(property: PublicProperty) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(getPropertyPriceValue(property));
}

export function getPropertyBadge(property: PublicProperty) {
  if (property.chambres && property.chambres > 0) {
    return `${property.chambres} chambre${property.chambres > 1 ? "s" : ""}`;
  }

  return property.type_logement.nom_type;
}

export async function fetchPublicProperties(signal?: AbortSignal) {
  const response = await fetch(`${getLandingApiBaseUrl()}/api/public/logements`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Could not load public properties.");
  }

  const payload = (await response.json()) as PublicPropertiesResponse;
  return payload.logements;
}

export async function fetchPublicProperty(id: string, signal?: AbortSignal) {
  const response = await fetch(`${getLandingApiBaseUrl()}/api/public/logements/${id}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Could not load public property.");
  }

  const payload = (await response.json()) as PublicPropertyResponse;
  return payload.logement;
}
