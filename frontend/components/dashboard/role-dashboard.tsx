"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { gsap } from "gsap";
import {
  backendRequest,
  type AppRole,
  type Commune,
  type Contrat,
  type Logement,
  type NotificationRecord,
  type Paiement,
  type TypeLogement,
  type UserRecord,
} from "@/lib/api";
import { AdminWorkspace } from "@/components/dashboard/admin-workspace";
import { AgentWorkspace } from "@/components/dashboard/agent-workspace";
import { LocataireWorkspace } from "@/components/dashboard/locataire-workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

type DashboardData = {
  users: UserRecord[];
  communes: Commune[];
  types: TypeLogement[];
  logements: Logement[];
  contrats: Contrat[];
  paiements: Paiement[];
  notifications: NotificationRecord[];
};

const DASHBOARD_RETRY_DELAYS_MS = [1500, 2500, 4000, 6500, 9000];

async function fetchDashboardData(
  role: AppRole,
  token: string
): Promise<DashboardData> {
  const [
    logementData,
    contratData,
    paiementData,
    notificationData,
    userData,
    communeData,
    typeData,
  ] = await Promise.all([
    backendRequest<{ logements: Logement[] }>("/api/logements", {}, token),
    backendRequest<{ contrats: Contrat[] }>("/api/contrats", {}, token),
    backendRequest<{ paiements: Paiement[] }>("/api/paiements", {}, token),
    backendRequest<{ notifications: NotificationRecord[] }>(
      "/api/notifications",
      {},
      token
    ),
    backendRequest<{ users: UserRecord[] }>("/api/users", {}, token),
    role === "locataire"
      ? Promise.resolve({ communes: [] as Commune[] })
      : backendRequest<{ communes: Commune[] }>("/api/communes", {}, token),
    role === "locataire"
      ? Promise.resolve({ types: [] as TypeLogement[] })
      : backendRequest<{ types: TypeLogement[] }>(
          "/api/type-logements",
          {},
          token
        ),
  ]);

  return {
    users: userData.users,
    communes: communeData.communes,
    types: typeData.types,
    logements: logementData.logements,
    contrats: contratData.contrats,
    paiements: paiementData.paiements,
    notifications: notificationData.notifications,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatus(error: unknown): number | null {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") {
      return status;
    }
  }

  return null;
}

function isRetryableDashboardError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === null) {
    return true;
  }

  return status >= 500 || status === 429;
}

function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar skeleton */}
      <div className="hidden w-[280px] shrink-0 bg-[var(--sidebar-bg)] p-6 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
          <Skeleton className="h-5 w-24 bg-white/10" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-xl bg-white/6" />
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_320px]">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

function DashboardError({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
      <div className="w-full max-w-md rounded-3xl border border-[rgba(1,42,74,0.2)] bg-white p-10 text-center shadow-[var(--shadow-lg)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl icon-rose">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          Dashboard failed to load
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          {error}
        </p>
        <Button
          className="mt-6 rounded-xl bg-[var(--primary)] px-6 shadow-[var(--shadow-primary)] hover:bg-[var(--primary-hover)]"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}

export function RoleDashboard({ role }: { role: AppRole }) {
  const { data: session, status } = useSession();
  const token = session?.user.backendToken;
  const user = session?.user.backendUser;
  const [data, setData] = useState<DashboardData>({
    users: [],
    communes: [],
    types: [],
    logements: [],
    contrats: [],
    paiements: [],
    notifications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  async function loadData() {
    if (!token) return;
    const dashboardData = await fetchDashboardData(role, token);
    setData(dashboardData);
  }

  async function loadDataWithRetry() {
    if (!token) return;

    let lastError: unknown = null;
    const maxAttempts = DASHBOARD_RETRY_DELAYS_MS.length + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const dashboardData = await fetchDashboardData(role, token);
        setData(dashboardData);
        setError(null);
        return;
      } catch (loadError) {
        lastError = loadError;

        const hasMoreAttempts = attempt < maxAttempts - 1;
        if (!hasMoreAttempts || !isRetryableDashboardError(loadError)) {
          throw loadError;
        }

        await wait(DASHBOARD_RETRY_DELAYS_MS[attempt] ?? 1000);
      }
    }

    throw lastError;
  }

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void loadDataWithRetry()
      .then(() => {
        if (cancelled) return;
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load dashboard."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [role, token]);

  useEffect(() => {
    if (!containerRef.current || loading || error) {
      return;
    }

    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", overwrite: "auto" },
    );
  }, [error, loading, role, data]);

  if (status === "loading" || loading || !user || !token) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <DashboardError
        error={error}
        onRetry={() => {
          setLoading(true);
          setError(null);
          void loadDataWithRetry()
            .catch((loadError) => {
              setError(
                loadError instanceof Error
                  ? loadError.message
                  : "Failed to load dashboard.",
              );
            })
            .finally(() => setLoading(false));
        }}
      />
    );
  }

  if (role === "super_admin" || role === "admin") {
    return (
      <div ref={containerRef}>
        <AdminWorkspace
          role={role}
          token={token}
          user={user}
          users={data.users}
          logements={data.logements}
          contrats={data.contrats}
          paiements={data.paiements}
          notifications={data.notifications}
          communes={data.communes}
          types={data.types}
          reload={loadData}
        />
      </div>
    );
  }

  if (role === "agent") {
    return (
      <div ref={containerRef}>
        <AgentWorkspace
          token={token}
          user={user}
          users={data.users}
          logements={data.logements}
          contrats={data.contrats}
          paiements={data.paiements}
          notifications={data.notifications}
          communes={data.communes}
          types={data.types}
          reload={loadData}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <LocataireWorkspace
        token={token}
        user={user}
        logements={data.logements}
        contrats={data.contrats}
        paiements={data.paiements}
        users={data.users}
        notifications={data.notifications}
        reload={loadData}
      />
    </div>
  );
}
