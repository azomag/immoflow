export type BackendPingResponse = {
  message: string;
  timestamp: string;
};

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export async function getBackendPing(): Promise<BackendPingResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/ping`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}`);
  }

  return (await response.json()) as BackendPingResponse;
}
