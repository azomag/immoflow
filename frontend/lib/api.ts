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
  latitude: string | null;
  longitude: string | null;
  city: string | null;
  country: string | null;
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
  signature_data: string | null;
  logement: Pick<Logement, "id" | "adresse" | "loyer">;
  agent: {
    id: number;
    user: Pick<AuthenticatedUser, "id" | "name" | "email" | "avatar_url">;
  };
  locataire: {
    id: number;
    user: Pick<AuthenticatedUser, "id" | "name" | "email" | "avatar_url">;
  };
  paiements?: Paiement[];
};

export type Paiement = {
  id: number;
  montant: string;
  date_paiement: string;
  mode: string;
  rib: string | null;
  reference: string | null;
  cash_note: string | null;
  statut: string;
  approved_by_tenant_at: string | null;
  created_at?: string;
  updated_at?: string;
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

export type ConversationParticipant = Pick<
  AuthenticatedUser,
  "id" | "name" | "email" | "role" | "avatar_url"
>;

export type MessageRecord = {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  read_at: string | null;
  created_at: string;
  sender: ConversationParticipant;
};

export type ConversationRecord = {
  id: number;
  title: string | null;
  created_by_id: number | null;
  last_message_at: string | null;
  participants: ConversationParticipant[];
  messages: MessageRecord[];
  created_at: string;
  updated_at: string;
};

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const API_RETRY_DELAYS_MS = [1200, 2200, 3600, 5200, 7600];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function isSafeMethod(method?: string) {
  if (!method) return true;
  const upper = method.toUpperCase();
  return upper === "GET" || upper === "HEAD" || upper === "OPTIONS";
}

export function getApiBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (process.env.NODE_ENV === "development") {
    return DEFAULT_API_BASE_URL;
  }

  throw new Error(
    "Missing NEXT_PUBLIC_API_BASE_URL in production. Set it in your frontend deployment environment.",
  );
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function extractBackendErrorMessage(errorBody: unknown, fallback: string): string {
  if (errorBody && typeof errorBody === "object") {
    const payload = errorBody as {
      message?: unknown;
      errors?: Record<string, unknown>;
    };

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (payload.errors && typeof payload.errors === "object") {
      for (const value of Object.values(payload.errors)) {
        if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
          return value[0];
        }
        if (typeof value === "string" && value.trim()) {
          return value;
        }
      }
    }
  }

  return fallback;
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

  const requestInit: RequestInit = {
    ...init,
    headers,
    cache: "no-store",
  };

  const canRetry = isSafeMethod(requestInit.method);
  const maxAttempts = canRetry ? API_RETRY_DELAYS_MS.length + 1 : 1;
  let response: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      response = await fetch(`${getApiBaseUrl()}${path}`, requestInit);
    } catch (fetchError) {
      lastError = fetchError;
      const hasMoreAttempts = attempt < maxAttempts - 1;
      if (!canRetry || !hasMoreAttempts) {
        throw fetchError instanceof Error ? fetchError : new Error("Failed to fetch");
      }
      await wait(API_RETRY_DELAYS_MS[attempt] ?? 1000);
      continue;
    }

    if (response.ok) {
      break;
    }

    const hasMoreAttempts = attempt < maxAttempts - 1;
    if (!canRetry || !hasMoreAttempts || !isRetryableStatus(response.status)) {
      break;
    }

    await wait(API_RETRY_DELAYS_MS[attempt] ?? 1000);
  }

  if (!response) {
    throw lastError instanceof Error ? lastError : new Error("Failed to fetch");
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = extractBackendErrorMessage(
      errorBody,
      `Backend request failed with status ${response.status}`,
    );

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
