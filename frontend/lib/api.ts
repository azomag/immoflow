export type AppRole = "super_admin" | "admin" | "agent" | "locataire";
export type AccountStatus = "pending" | "active" | "suspended";

export type AuthenticatedUser = {
  id: number;
  name: string;
  nom?: string | null;
  prenom?: string | null;
  login?: string | null;
  email: string;
  phone: string | null;
  role: AppRole;
  status: AccountStatus;
  avatar_url: string | null;
  permissions: string[];
  last_login_at: string | null;
  profiles: {
    agent: { id: number; code_agent: string } | null;
    locataire: { id: number; adresse: string | null; date_naissance: string | null } | null;
    administrateur: { id: number; niveau_acces: string } | null;
  };
};

export type AuthResponse = {
  message: string;
  token: string | null;
  user: AuthenticatedUser;
};

export type Metric = {
  label: string;
  value: number;
};

export type SummaryResponse = {
  metrics: Metric[];
  recent_users?: Array<Record<string, unknown>>;
  recent_contracts?: Array<Record<string, unknown>>;
  properties?: Array<Record<string, unknown>>;
  contracts?: Array<Record<string, unknown>>;
  available_properties?: Array<Record<string, unknown>>;
};

export type UserRecord = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: AppRole;
  status: AccountStatus;
  avatar_url?: string | null;
  managed_by_id: number | null;
  created_at: string;
  last_login_at: string | null;
  agent_profile?: { id: number; code_agent: string } | null;
  locataire_profile?: { id: number } | null;
  administrateur_profile?: { id: number; niveau_acces: string } | null;
};

export type Commune = {
  id: number;
  nom: string;
  nombre_habitants: number;
  distance_agence: string;
};

export type TypeLogement = {
  id: number;
  nom_type: string;
  charge_forfaitaires: string;
  date: string | null;
};

export type Logement = {
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
  commune: Commune;
  type_logement: TypeLogement;
  agent: {
    id: number;
    code_agent: string;
    user: Pick<AuthenticatedUser, "id" | "name" | "email">;
  };
};

export type Contrat = {
  id: number;
  date_debut: string;
  date_fin: string | null;
  montant: string;
  statut: string;
  signature_status: string;
  signed_at: string | null;
  logement: Pick<Logement, "id" | "adresse" | "loyer">;
  agent: {
    id: number;
    user: Pick<AuthenticatedUser, "id" | "name" | "email">;
  };
  locataire: {
    id: number;
    user: Pick<AuthenticatedUser, "id" | "name" | "email">;
  };
  paiements?: Paiement[];
};

export type Paiement = {
  id: number;
  montant: string;
  date_paiement: string;
  mode: string;
  statut: string;
  contrat: Contrat;
};

export type NotificationRecord = {
  id: number;
  subject: string;
  message: string;
  read_at: string | null;
  created_at: string;
  sender: Pick<AuthenticatedUser, "id" | "name" | "email" | "role" | "avatar_url">;
  recipient: Pick<AuthenticatedUser, "id" | "name" | "email" | "role" | "avatar_url">;
};

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function backendRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const hasBody = init.body !== undefined && !headers.has("Content-Type") && !(init.body instanceof FormData);
  if (hasBody) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody && typeof errorBody.message === "string"
        ? errorBody.message
        : `Backend request failed with status ${response.status}`;

    throw Object.assign(new Error(message), {
      status: response.status,
      body: errorBody,
    });
  }

  return parseJson<T>(response);
}

export async function registerWithBackend(payload: {
  name: string;
  email: string;
  phone?: string;
  login?: string;
  code_agent?: string;
  niveau_acces?: string;
  date_naissance?: string;
  adresse?: string;
  avatar_url?: string;
  role: Exclude<AppRole, "super_admin">;
  password: string;
  password_confirmation: string;
}): Promise<AuthResponse> {
  return backendRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerFormWithBackend(payload: FormData): Promise<AuthResponse> {
  return backendRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function syncGoogleWithBackend(payload: {
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  login?: string;
  role?: Exclude<AppRole, "super_admin">;
}): Promise<AuthResponse> {
  return backendRequest<AuthResponse>("/api/auth/google/sync", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
