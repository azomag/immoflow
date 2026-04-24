"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  backendRequest,
  type AppRole,
  type Commune,
  type Contrat,
  type Logement,
  type Paiement,
  type TypeLogement,
  type UserRecord,
} from "@/lib/api";
import { AdminWorkspace } from "@/components/dashboard/admin-workspace";
import { AgentWorkspace } from "@/components/dashboard/agent-workspace";
import { LocataireWorkspace } from "@/components/dashboard/locataire-workspace";
import { Card, CardContent } from "@/components/ui/card";

type DashboardData = {
  users: UserRecord[];
  communes: Commune[];
  types: TypeLogement[];
  logements: Logement[];
  contrats: Contrat[];
  paiements: Paiement[];
};

async function fetchDashboardData(role: AppRole, token: string): Promise<DashboardData> {
  const [logementData, contratData, paiementData, userData, communeData, typeData] =
    await Promise.all([
      backendRequest<{ logements: Logement[] }>("/api/logements", {}, token),
      backendRequest<{ contrats: Contrat[] }>("/api/contrats", {}, token),
      backendRequest<{ paiements: Paiement[] }>("/api/paiements", {}, token),
      role === "locataire"
        ? Promise.resolve({ users: [] as UserRecord[] })
        : backendRequest<{ users: UserRecord[] }>("/api/users", {}, token),
      role === "locataire"
        ? Promise.resolve({ communes: [] as Commune[] })
        : backendRequest<{ communes: Commune[] }>("/api/communes", {}, token),
      role === "locataire"
        ? Promise.resolve({ types: [] as TypeLogement[] })
        : backendRequest<{ types: TypeLogement[] }>("/api/type-logements", {}, token),
    ]);

  return {
    users: userData.users,
    communes: communeData.communes,
    types: typeData.types,
    logements: logementData.logements,
    contrats: contratData.contrats,
    paiements: paiementData.paiements,
  };
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (!token) {
      return;
    }

    const dashboardData = await fetchDashboardData(role, token);
    setData(dashboardData);
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    void fetchDashboardData(role, token)
      .then((dashboardData) => {
        if (cancelled) {
          return;
        }

        setData(dashboardData);
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [role, token]);

  if (status === "loading" || loading || !user || !token) {
    return (
      <div className="page-grid min-h-screen px-6 py-10">
        <div className="mx-auto flex max-w-7xl items-center justify-center">
          <Card className="w-full max-w-lg">
            <CardContent className="p-8 text-center text-sm text-[var(--muted-foreground)]">
              Loading dashboard...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-grid min-h-screen px-6 py-10">
        <div className="mx-auto flex max-w-2xl items-center justify-center">
          <Card className="w-full">
            <CardContent className="p-8 text-center text-sm text-[var(--danger)]">
              {error}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (role === "super_admin" || role === "admin") {
    return (
      <AdminWorkspace
        role={role}
        token={token}
        user={user}
        users={data.users}
        logements={data.logements}
        contrats={data.contrats}
        paiements={data.paiements}
        communes={data.communes}
        types={data.types}
        reload={loadData}
      />
    );
  }

  if (role === "agent") {
    return (
      <AgentWorkspace
        token={token}
        user={user}
        users={data.users}
        logements={data.logements}
        contrats={data.contrats}
        paiements={data.paiements}
        communes={data.communes}
        types={data.types}
        reload={loadData}
      />
    );
  }

  return (
    <LocataireWorkspace
      token={token}
      user={user}
      logements={data.logements}
      contrats={data.contrats}
      paiements={data.paiements}
      reload={loadData}
    />
  );
}
