"use client";

import { startTransition, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronLeft,
  CircleHelp,
  CreditCard,
  Ellipsis,
  FileText,
  Landmark,
  LayoutGrid,
  Mail,
  Plus,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import type {
  AppRole,
  AuthenticatedUser,
  Commune,
  Contrat,
  Logement,
  NotificationRecord,
  Paiement,
  TypeLogement,
  UserRecord,
} from "@/lib/api";
import { backendRequest } from "@/lib/api";
import { AvatarMenu } from "@/components/dashboard/avatar-menu";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildPropertySnapshot,
  downloadTextFile,
  formatLongDate,
  formatMoney,
  formatShortDate,
  initials,
  relativeTime,
  toneForStatus,
} from "@/components/dashboard/workspace-utils";

type AdminWorkspaceProps = {
  role: Extract<AppRole, "super_admin" | "admin">;
  token: string;
  user: AuthenticatedUser;
  users: UserRecord[];
  logements: Logement[];
  contrats: Contrat[];
  paiements: Paiement[];
  notifications: NotificationRecord[];
  communes: Commune[];
  types: TypeLogement[];
  reload: () => Promise<void>;
};

type AdminTab = "dashboard" | "properties" | "contracts" | "payments" | "tenants" | "users" | "notifications" | "profile" | "settings";
type UserView = "agents" | "locataires" | "admins";

function emptyPropertyForm() {
  return {
    agent_id: "",
    type_logement_id: "",
    commune_id: "",
    adresse: "",
    titre: "",
    description: "",
    superficie: "",
    loyer: "",
    chambres: "",
    salles_bain: "",
    etage: "",
    parking: false,
    chauffage: "",
    statut_publication: "listed",
    images_text: "",
  };
}

export function AdminWorkspace({
  role,
  token,
  user,
  users,
  logements,
  contrats,
  paiements,
  notifications,
  communes,
  types,
  reload,
}: AdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [communeFilter, setCommuneFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [userView, setUserView] = useState<UserView>(role === "super_admin" ? "admins" : "agents");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);
  const [communeForm, setCommuneForm] = useState({
    nom: "",
    nombre_habitants: "",
    distance_agence: "",
  });
  const [typeForm, setTypeForm] = useState({
    nom_type: "",
    charge_forfaitaires: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    contrat_id: "",
    montant: "",
    date_paiement: new Date().toISOString().slice(0, 10),
    mode: "Virement",
    statut: "paid",
  });
  const [contractForm, setContractForm] = useState({
    agent_id: "",
    locataire_id: "",
    logement_id: "",
    date_debut: "",
    date_fin: "",
    montant: "",
    statut: "active",
  });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    login: "",
    role: role === "super_admin" ? "admin" : "agent",
    status: "active",
    code_agent: "",
    niveau_acces: "admin",
    date_naissance: "",
    adresse: "",
    password: "",
    password_confirmation: "",
  });
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    login: user.login ?? "",
    avatar_url: user.avatar_url ?? "",
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const agentUsers = useMemo(
    () => users.filter((entry) => entry.role === "agent" && entry.agent_profile),
    [users],
  );

  const tenantUsers = useMemo(
    () => users.filter((entry) => entry.role === "locataire"),
    [users],
  );

  const adminUsers = useMemo(
    () => users.filter((entry) => entry.role === "admin"),
    [users],
  );

  const propertySnapshots = useMemo(
    () => logements.map((logement) => buildPropertySnapshot(logement, contrats, paiements)),
    [contrats, logements, paiements],
  );

  const propertyTypeTabs = useMemo(() => {
    return ["All", ...new Set(logements.map((entry) => entry.type_logement.nom_type))];
  }, [logements]);

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return propertySnapshots.filter((snapshot) => {
      const typeMatch = typeFilter === "All" || snapshot.logement.type_logement.nom_type === typeFilter;
      const communeMatch = communeFilter === "All" || snapshot.logement.commune.nom === communeFilter;
      const statusMatch = statusFilter === "All" || snapshot.status === statusFilter;
      const searchMatch =
        query.length === 0 ||
        [
          snapshot.ref,
          snapshot.logement.adresse,
          snapshot.logement.commune.nom,
          snapshot.logement.type_logement.nom_type,
          snapshot.logement.agent.user.name,
          snapshot.tenantName ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return typeMatch && communeMatch && statusMatch && searchMatch;
    });
  }, [communeFilter, propertySnapshots, search, statusFilter, typeFilter]);

  const selectedProperty =
    propertySnapshots.find((snapshot) => snapshot.logement.id === selectedPropertyId) ?? null;

  const pendingVisits = useMemo(
    () =>
      propertySnapshots.filter(
        (snapshot) => snapshot.status === "Pending" || snapshot.activeContract === null,
      ).length,
    [propertySnapshots],
  );

  const collectionsTotal = useMemo(
    () =>
      paiements.reduce(
        (total, paiement) => total + Number.parseFloat(paiement.montant || "0"),
        0,
      ),
    [paiements],
  );

  const activeContractsCount = useMemo(
    () => contrats.filter((contrat) => contrat.statut.toLowerCase() === "active").length,
    [contrats],
  );

  const expectedRevenue = useMemo(
    () =>
      contrats
        .filter((contrat) => contrat.statut.toLowerCase() === "active")
        .reduce((total, contrat) => total + Number.parseFloat(contrat.montant || "0"), 0),
    [contrats],
  );

  const overdueBalance = useMemo(
    () =>
      paiements
        .filter((paiement) => paiement.statut.toLowerCase() !== "paid")
        .reduce((total, paiement) => total + Number.parseFloat(paiement.montant || "0"), 0),
    [paiements],
  );

  const collectionRate = expectedRevenue > 0
    ? Math.min(100, Math.round((collectionsTotal / expectedRevenue) * 1000) / 10)
    : 0;

  const recentActivity = useMemo(() => {
    const items = [
      ...contrats.map((contrat) => ({
        id: `contract-${contrat.id}`,
        title: contrat.signature_status.toLowerCase() === "signed" ? "Contract Signed" : "Contract Opened",
        description: `${contrat.locataire.user.name} on ${contrat.logement.adresse}`,
        when: relativeTime(contrat.signed_at ?? contrat.date_debut),
        createdAt: contrat.signed_at ?? contrat.date_debut,
      })),
      ...paiements.map((paiement) => ({
        id: `payment-${paiement.id}`,
        title: "Payment Received",
        description: `${formatMoney(paiement.montant)} MAD for ${paiement.contrat.logement.adresse}`,
        when: relativeTime(paiement.date_paiement),
        createdAt: paiement.date_paiement,
      })),
      ...users.map((entry) => ({
        id: `user-${entry.id}`,
        title: entry.status === "pending" ? "User Pending Approval" : "User Updated",
        description: `${entry.name} • ${entry.role.replace("_", " ")}`,
        when: relativeTime(entry.created_at),
        createdAt: entry.created_at,
      })),
    ];

    return items
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, 4);
  }, [contrats, paiements, users]);

  const visibleUsers = useMemo(() => {
    const pool =
      userView === "admins"
        ? adminUsers
        : userView === "agents"
          ? agentUsers
          : tenantUsers;

    const query = search.trim().toLowerCase();
    if (!query) {
      return pool;
    }

    return pool.filter((entry) =>
      [entry.name, entry.email, entry.phone ?? "", entry.role].join(" ").toLowerCase().includes(query),
    );
  }, [adminUsers, agentUsers, search, tenantUsers, userView]);

  const tenantRows = useMemo(() => {
    return tenantUsers.map((tenant) => {
      const tenantContracts = contrats.filter(
        (contrat) => contrat.locataire.user.id === tenant.id,
      );
      const activeContract =
        tenantContracts.find((contrat) => contrat.statut.toLowerCase() === "active") ?? null;

      return {
        user: tenant,
        activeContract,
        residence: activeContract?.logement.adresse ?? "No active property",
        rent: activeContract?.montant ?? null,
      };
    });
  }, [contrats, tenantUsers]);

  async function runMutation(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await action();
      await reload();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  function resetPropertyEditor() {
    setEditingPropertyId(null);
    setPropertyForm(emptyPropertyForm());
  }

  function openTab(tab: AdminTab) {
    setActiveTab(tab);
    setSelectedPropertyId(null);
    resetPropertyEditor();
  }

  function openCreateProperty() {
    openTab("properties");
  }

  function openPropertyDetail(propertyId: number) {
    setActiveTab("properties");
    setSelectedPropertyId(propertyId);
  }

  function beginEditProperty(snapshot: (typeof propertySnapshots)[number]) {
    setEditingPropertyId(snapshot.logement.id);
    setPropertyForm({
      agent_id: String(snapshot.logement.agent.id),
      type_logement_id: String(snapshot.logement.type_logement.id),
      commune_id: String(snapshot.logement.commune.id),
      adresse: snapshot.logement.adresse,
      titre: snapshot.logement.titre ?? "",
      description: snapshot.logement.description ?? "",
      superficie: snapshot.logement.superficie,
      loyer: snapshot.logement.loyer,
      chambres: snapshot.logement.chambres ? String(snapshot.logement.chambres) : "",
      salles_bain: snapshot.logement.salles_bain ? String(snapshot.logement.salles_bain) : "",
      etage: snapshot.logement.etage ?? "",
      parking: snapshot.logement.parking ?? false,
      chauffage: snapshot.logement.chauffage ?? "",
      statut_publication: snapshot.logement.statut_publication ?? "listed",
      images_text: (snapshot.logement.images ?? []).join("\n"),
    });
  }

  async function handlePropertySubmit() {
    const payload = {
      agent_id: Number(propertyForm.agent_id),
      type_logement_id: Number(propertyForm.type_logement_id),
      commune_id: Number(propertyForm.commune_id),
      adresse: propertyForm.adresse,
      titre: propertyForm.titre || null,
      description: propertyForm.description || null,
      superficie: Number(propertyForm.superficie),
      loyer: Number(propertyForm.loyer),
      chambres: propertyForm.chambres ? Number(propertyForm.chambres) : null,
      salles_bain: propertyForm.salles_bain ? Number(propertyForm.salles_bain) : null,
      etage: propertyForm.etage || null,
      parking: propertyForm.parking,
      chauffage: propertyForm.chauffage || null,
      statut_publication: propertyForm.statut_publication,
      images: propertyForm.images_text.split("\n").map((entry) => entry.trim()).filter(Boolean),
    };

    await runMutation(async () => {
      if (editingPropertyId) {
        await backendRequest(`/api/logements/${editingPropertyId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        }, token);
        setNotice("Property updated.");
      } else {
        await backendRequest("/api/logements", {
          method: "POST",
          body: JSON.stringify(payload),
        }, token);
        setNotice("Property created.");
      }

      resetPropertyEditor();
    });
  }

  async function handleStatusUpdate(userId: number, nextStatus: string, label: string) {
    await runMutation(async () => {
      await backendRequest(`/api/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      }, token);
      setNotice(`${label} updated to ${nextStatus}.`);
    });
  }

  async function handleCreateCommune() {
    await runMutation(async () => {
      await backendRequest("/api/communes", {
        method: "POST",
        body: JSON.stringify({
          nom: communeForm.nom,
          nombre_habitants: Number(communeForm.nombre_habitants),
          distance_agence: Number(communeForm.distance_agence),
        }),
      }, token);
      setCommuneForm({ nom: "", nombre_habitants: "", distance_agence: "" });
      setNotice("Commune created.");
    });
  }

  async function handleCreateType() {
    await runMutation(async () => {
      await backendRequest("/api/type-logements", {
        method: "POST",
        body: JSON.stringify({
          nom_type: typeForm.nom_type,
          charge_forfaitaires: Number(typeForm.charge_forfaitaires),
        }),
      }, token);
      setTypeForm({ nom_type: "", charge_forfaitaires: "" });
      setNotice("Housing type created.");
    });
  }

  async function handleRecordPayment() {
    await runMutation(async () => {
      await backendRequest("/api/paiements", {
        method: "POST",
        body: JSON.stringify({
          contrat_id: Number(paymentForm.contrat_id),
          montant: Number(paymentForm.montant),
          date_paiement: paymentForm.date_paiement,
          mode: paymentForm.mode,
          statut: paymentForm.statut,
        }),
      }, token);
      setNotice("Payment recorded.");
      setPaymentForm((current) => ({
        ...current,
        montant: "",
        statut: "paid",
      }));
    });
  }

  async function handleContractSubmit() {
    await runMutation(async () => {
      await backendRequest("/api/contrats", {
        method: "POST",
        body: JSON.stringify({
          agent_id: Number(contractForm.agent_id),
          locataire_id: Number(contractForm.locataire_id),
          logement_id: Number(contractForm.logement_id),
          date_debut: contractForm.date_debut,
          date_fin: contractForm.date_fin || null,
          montant: Number(contractForm.montant),
          statut: contractForm.statut,
        }),
      }, token);

      setContractForm({
        agent_id: "",
        locataire_id: "",
        logement_id: "",
        date_debut: "",
        date_fin: "",
        montant: "",
        statut: "active",
      });
      setNotice("Contract created.");
    });
  }

  async function handleCreateUser() {
    await runMutation(async () => {
      await backendRequest("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone || null,
          login: userForm.login || undefined,
          role: userForm.role,
          status: userForm.status,
          code_agent: userForm.role === "agent" ? userForm.code_agent || undefined : undefined,
          niveau_acces: userForm.role === "admin" ? userForm.niveau_acces : undefined,
          date_naissance: userForm.role === "locataire" ? userForm.date_naissance || undefined : undefined,
          adresse: userForm.role === "locataire" ? userForm.adresse || undefined : undefined,
          password: userForm.password,
          password_confirmation: userForm.password_confirmation,
        }),
      }, token);

      setUserForm((current) => ({
        ...current,
        name: "",
        email: "",
        phone: "",
        login: "",
        code_agent: "",
        date_naissance: "",
        adresse: "",
        password: "",
        password_confirmation: "",
      }));
      setNotice("User created.");
    });
  }

  async function handleProfileSubmit() {
    await runMutation(async () => {
      await backendRequest("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone || null,
          login: profileForm.login || undefined,
          avatar_url: profileForm.avatar_url || null,
          current_password: profileForm.current_password || undefined,
          password: profileForm.password || undefined,
          password_confirmation: profileForm.password_confirmation || undefined,
        }),
      }, token);

      setProfileForm((current) => ({
        ...current,
        current_password: "",
        password: "",
        password_confirmation: "",
      }));
      setNotice("Profile updated. Sign out and in again to refresh the header identity.");
    });
  }

  function handleShareProperty(snapshot: (typeof propertySnapshots)[number]) {
    const text = `${snapshot.logement.adresse} • ${snapshot.logement.commune.nom} • ${formatMoney(
      snapshot.logement.loyer,
    )} MAD`;

    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setNotice("Property details copied.");
      return;
    }

    setNotice(text);
  }

  function handleInvoice(snapshot: (typeof propertySnapshots)[number]) {
    const contract = snapshot.activeContract ?? snapshot.latestContract;
    if (!contract) {
      setError("No contract found for this property.");
      return;
    }

    downloadTextFile(
      `invoice-${snapshot.ref.toLowerCase()}.txt`,
      [
        "ImmoFlow Invoice",
        `Property: ${snapshot.logement.adresse}`,
        `Reference: ${snapshot.ref}`,
        `Commune: ${snapshot.logement.commune.nom}`,
        `Tenant: ${contract.locataire.user.name}`,
        `Agent: ${contract.agent.user.name}`,
        `Rent: ${formatMoney(contract.montant)} MAD`,
        `Contract start: ${formatLongDate(contract.date_debut)}`,
        `Contract end: ${formatLongDate(contract.date_fin, "Open")}`,
        `Status: ${contract.statut}`,
      ].join("\n"),
    );
    setNotice("Invoice generated.");
  }

  const navItems: Array<{ id: AdminTab; label: string; icon: typeof LayoutGrid }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "properties", label: "Properties", icon: Building2 },
    { id: "contracts", label: "Contracts", icon: FileText },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "tenants", label: "Tenants", icon: Users },
    { id: "users", label: "User Management", icon: UserCog },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: UserCog },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfb] text-[#171411]">
      <div className="grid min-h-screen lg:grid-cols-[306px_minmax(0,1fr)]">
        <aside className="flex flex-col border-r border-black/8 bg-[#eef2f6] px-5 py-6">
          <div className="space-y-1 px-2">
            <div className="text-[18px] font-bold tracking-tight">ImmoFlow</div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/45">
              Real Estate SaaS
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-[15px] font-medium transition ${
                  activeTab === item.id
                    ? "bg-white text-black shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                    : "text-black/60 hover:bg-white/70 hover:text-black"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-5 pt-10">
            <Button className="w-full rounded-2xl" onClick={openCreateProperty}>
              <Plus className="h-4 w-4" />
              Add Property
            </Button>

            <div className="space-y-2 border-t border-black/8 pt-4 text-[15px] text-black/60">
              <button type="button" className="flex items-center gap-3 px-2 py-2">
                <CircleHelp className="h-5 w-5" />
                <span>Support</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-3 px-2 py-2"
                onClick={() => startTransition(() => void signOut({ callbackUrl: "/login" }))}
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-6 py-5 md:px-10 md:py-6">
          <header className="flex flex-col gap-4 border-b border-black/6 pb-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-[720px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/35" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeTab === "users"
                    ? "Search users or roles..."
                    : "Search by reference, name or tenant..."
                }
                className="h-12 rounded-2xl border-black/8 bg-white pl-12 shadow-none"
              />
            </div>

            <div className="flex items-center justify-end gap-4">
              <button type="button" className="rounded-full p-2 text-black/55 transition hover:bg-black/5">
                <Bell className="h-5 w-5" />
              </button>
              <button type="button" className="rounded-full p-2 text-black/55 transition hover:bg-black/5">
                <CircleHelp className="h-5 w-5" />
              </button>
              <AvatarMenu user={user} onProfile={() => openTab("profile")} />
            </div>
          </header>

          {error ? (
            <div className="mt-5 rounded-2xl bg-[rgba(186,74,69,0.12)] px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="mt-5 rounded-2xl bg-[rgba(47,143,98,0.12)] px-4 py-3 text-sm text-[var(--success)]">
              {notice}
            </div>
          ) : null}

          <div className="mt-8 space-y-8">
            {activeTab === "dashboard" ? (
              <>
                <section className="grid gap-5 xl:grid-cols-[repeat(3,minmax(0,1fr))_280px]">
                  <div className="rounded-[24px] border border-black/6 bg-white p-7">
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-black/35">
                      My Properties
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <div className="text-5xl font-bold tracking-tight">{logements.length}</div>
                      <div className="pb-2 text-sm font-semibold text-[#0b9c45]">+ live inventory</div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-black/6 bg-white p-7">
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-black/35">
                      Active Contracts
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <div className="text-5xl font-bold tracking-tight">{activeContractsCount}</div>
                      <div className="pb-2 text-sm font-semibold text-black/35">
                        {contrats.length === 0
                          ? "No contracts yet"
                          : `${Math.round((activeContractsCount / contrats.length) * 100)}% occupancy`}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-black/6 bg-white p-7">
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-black/35">
                      Collections
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                      <div className="text-5xl font-bold tracking-tight">{formatMoney(collectionsTotal)}</div>
                      <div className="pb-2 text-base font-semibold text-black/45">MAD</div>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-black p-7 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
                          Pending Visits
                        </div>
                        <div className="mt-3 text-5xl font-bold tracking-tight">{pendingVisits}</div>
                      </div>
                      <CalendarDays className="mt-3 h-8 w-8 text-white/45" />
                    </div>
                  </div>
                </section>

                <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <h2 className="text-[21px] font-semibold tracking-tight">My Properties</h2>
                      <button
                        type="button"
                        className="text-[15px] font-medium text-black/55"
                        onClick={() => openTab("properties")}
                      >
                        View All
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
                      <div className="grid grid-cols-[120px_minmax(0,1.5fr)_180px_160px] gap-4 border-b border-black/6 px-8 py-5 text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                        <div>Ref</div>
                        <div>Property Name</div>
                        <div>Status</div>
                        <div>Next Visit</div>
                      </div>

                      {propertySnapshots.slice(0, 4).map((property) => (
                        <button
                          key={property.logement.id}
                          type="button"
                          onClick={() => openPropertyDetail(property.logement.id)}
                          className="grid w-full grid-cols-[120px_minmax(0,1.5fr)_180px_160px] gap-4 border-b border-black/6 px-8 py-5 text-left transition hover:bg-black/[0.02] last:border-b-0"
                        >
                          <div className="self-center text-[15px] text-black/55">{property.ref}</div>
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#f2efe8,#dde7f4)] text-sm font-semibold text-black/55">
                              {property.logement.type_logement.nom_type.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-[17px] font-semibold">{property.logement.adresse}</div>
                              <div className="text-sm text-black/45">
                                {property.tenantName ?? property.logement.commune.nom}
                              </div>
                            </div>
                          </div>
                          <div className="self-center">
                            <Badge variant={toneForStatus(property.status)}>{property.status}</Badge>
                          </div>
                          <div className="self-center text-[15px] text-black/55">
                            {formatShortDate(property.nextEventDate)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="mb-5 text-[21px] font-semibold tracking-tight">Recent Activity</h2>
                    <div className="rounded-[24px] bg-[#f6f6f4] p-7">
                      <div className="space-y-7">
                        {recentActivity.map((item, index) => (
                          <div key={item.id} className="relative flex gap-4">
                            <div className="relative flex flex-col items-center">
                              <div className="h-5 w-5 rounded-full border-4 border-black/70 bg-white" />
                              {index !== recentActivity.length - 1 ? (
                                <div className="mt-1 h-full w-px bg-black/12" />
                              ) : null}
                            </div>
                            <div className="pb-2">
                              <div className="text-[17px] font-semibold">{item.title}</div>
                              <div className="mt-1 text-[15px] leading-6 text-black/55">
                                {item.description}
                              </div>
                              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/28">
                                {item.when}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : null}

            {activeTab === "properties" && !selectedProperty ? (
              <section className="space-y-7">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h1 className="text-[30px] font-semibold tracking-tight">Properties ({filteredProperties.length})</h1>
                  </div>
                  <Button className="rounded-2xl" onClick={openCreateProperty}>
                    <Plus className="h-4 w-4" />
                    Add property
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-7 border-b border-black/8 pb-5">
                  {propertyTypeTabs.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => setTypeFilter(entry)}
                      className={`pb-3 text-[15px] ${
                        typeFilter === entry
                          ? "border-b-2 border-black font-semibold text-black"
                          : "text-black/65"
                      }`}
                    >
                      {entry}
                    </button>
                  ))}

                  <div className="ml-auto flex flex-wrap items-center gap-3">
                    <select
                      className="h-11 rounded-2xl border border-black/8 bg-white px-4 text-sm"
                      value={communeFilter}
                      onChange={(event) => setCommuneFilter(event.target.value)}
                    >
                      <option value="All">Commune</option>
                      {communes.map((entry) => (
                        <option key={entry.id} value={entry.nom}>
                          {entry.nom}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-11 rounded-2xl border border-black/8 bg-white px-4 text-sm"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <option value="All">Status</option>
                      <option value="Available">Available</option>
                      <option value="Pending">Pending</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
                    <div className="grid grid-cols-[128px_minmax(0,1.5fr)_140px_120px_120px_170px_170px_56px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                      <div>Ref</div>
                      <div>Property</div>
                      <div>Type</div>
                      <div>Area</div>
                      <div>Rent</div>
                      <div>Status</div>
                      <div>Agent</div>
                      <div />
                    </div>

                    {filteredProperties.map((property) => (
                      <button
                        key={property.logement.id}
                        type="button"
                        onClick={() => openPropertyDetail(property.logement.id)}
                        className="grid w-full grid-cols-[128px_minmax(0,1.5fr)_140px_120px_120px_170px_170px_56px] gap-4 border-t border-black/6 px-7 py-4 text-left transition hover:bg-black/[0.02]"
                      >
                        <div className="self-center text-[15px] text-black/60">{property.ref}</div>
                        <div className="min-w-0">
                          <div className="truncate text-[17px] font-semibold">{property.logement.adresse}</div>
                          <div className="truncate text-sm text-black/45">{property.logement.commune.nom}</div>
                        </div>
                        <div className="self-center text-[15px]">{property.logement.type_logement.nom_type}</div>
                        <div className="self-center text-[15px]">{property.logement.superficie} m²</div>
                        <div className="self-center text-[15px]">{formatMoney(property.logement.loyer)} MAD</div>
                        <div className="self-center">
                          <Badge variant={toneForStatus(property.status)}>{property.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 self-center">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{initials(property.logement.agent.user.name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-[15px]">{property.logement.agent.user.name}</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <Ellipsis className="h-4 w-4 text-black/40" />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-black/6 bg-white p-6">
                    <div className="text-[22px] font-semibold">
                      {editingPropertyId ? "Edit Property" : "Add Property"}
                    </div>
                    <div className="mt-2 text-sm text-black/50">
                      {editingPropertyId
                        ? "Update the selected property directly from the dashboard."
                        : "Publish a new property with a real agent, type, and commune."}
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Agent</Label>
                        <select
                          className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                          value={propertyForm.agent_id}
                          onChange={(event) =>
                            setPropertyForm((current) => ({ ...current, agent_id: event.target.value }))
                          }
                        >
                          <option value="">Select agent</option>
                          {agentUsers.map((entry) => (
                            <option key={entry.id} value={entry.agent_profile?.id ?? ""}>
                              {entry.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          value={propertyForm.adresse}
                          onChange={(event) =>
                            setPropertyForm((current) => ({ ...current, adresse: event.target.value }))
                          }
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <select
                            className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                            value={propertyForm.type_logement_id}
                            onChange={(event) =>
                              setPropertyForm((current) => ({
                                ...current,
                                type_logement_id: event.target.value,
                              }))
                            }
                          >
                            <option value="">Select type</option>
                            {types.map((entry) => (
                              <option key={entry.id} value={entry.id}>
                                {entry.nom_type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Commune</Label>
                          <select
                            className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                            value={propertyForm.commune_id}
                            onChange={(event) =>
                              setPropertyForm((current) => ({
                                ...current,
                                commune_id: event.target.value,
                              }))
                            }
                          >
                            <option value="">Select commune</option>
                            {communes.map((entry) => (
                              <option key={entry.id} value={entry.id}>
                                {entry.nom}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Area</Label>
                          <Input
                            type="number"
                            value={propertyForm.superficie}
                            onChange={(event) =>
                              setPropertyForm((current) => ({ ...current, superficie: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rent</Label>
                          <Input
                            type="number"
                            value={propertyForm.loyer}
                            onChange={(event) =>
                              setPropertyForm((current) => ({ ...current, loyer: event.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button className="flex-1 rounded-2xl" disabled={busy} onClick={() => void handlePropertySubmit()}>
                          {editingPropertyId ? "Save changes" : "Add property"}
                        </Button>
                        {editingPropertyId ? (
                          <Button variant="outline" className="rounded-2xl" onClick={resetPropertyEditor}>
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "properties" && selectedProperty ? (
              <section className="space-y-8">
                <button
                  type="button"
                  onClick={() => setSelectedPropertyId(null)}
                  className="flex items-center gap-2 text-sm font-medium text-black/55"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to properties
                </button>

                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.22em] text-black/35">
                      {selectedProperty.logement.commune.nom}
                    </div>
                    <h1 className="mt-4 text-[46px] font-semibold tracking-tight">
                      {selectedProperty.logement.adresse}
                    </h1>
                    <div className="mt-2 text-[18px] text-black/55">
                      {selectedProperty.logement.type_logement.nom_type}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => handleShareProperty(selectedProperty)}
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => beginEditProperty(selectedProperty)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
                  <div className="space-y-6">
                    <div className="overflow-hidden rounded-[28px] border border-black/6 bg-white">
                      <div className="grid min-h-[360px] grid-cols-[minmax(0,1fr)_180px]">
                        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_15%_20%,#f4ead8,transparent_28%),linear-gradient(135deg,#c8d4e7,#f3efe7_58%,#d7e2d5)]">
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.06))]" />
                          <div className="absolute inset-x-8 top-8 flex items-center justify-between">
                            <Badge variant={toneForStatus(selectedProperty.status)}>{selectedProperty.status}</Badge>
                            <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium">
                              {selectedProperty.ref}
                            </div>
                          </div>
                          <div className="absolute bottom-8 left-8 right-8">
                            <div className="max-w-md text-4xl font-semibold tracking-tight text-black/85">
                              {selectedProperty.logement.commune.nom}
                            </div>
                            <div className="mt-2 text-black/60">
                              Managed by {selectedProperty.logement.agent.user.name}
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-3 border-l border-black/6 bg-[#faf9f6] p-4">
                          {[selectedProperty.logement.type_logement.nom_type, selectedProperty.logement.commune.nom, selectedProperty.status].map((label) => (
                            <div
                              key={label}
                              className="flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ebe8df,#dfe7f2)] p-4 text-center text-sm font-semibold"
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-0 overflow-hidden rounded-[28px] border border-black/6 bg-white md:grid-cols-3">
                      <div className="border-b border-black/6 p-7 md:border-b-0 md:border-r">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                          Area
                        </div>
                        <div className="mt-4 text-[24px] font-semibold">
                          {selectedProperty.logement.superficie} m²
                        </div>
                      </div>
                      <div className="border-b border-black/6 p-7 md:border-b-0 md:border-r">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                          Housing Type
                        </div>
                        <div className="mt-4 text-[24px] font-semibold">
                          {selectedProperty.logement.type_logement.nom_type}
                        </div>
                      </div>
                      <div className="p-7">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                          Status
                        </div>
                        <div className="mt-4">
                          <Badge variant={toneForStatus(selectedProperty.status)}>{selectedProperty.status}</Badge>
                        </div>
                      </div>
                      <div className="border-t border-black/6 p-7 md:border-r">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                          Commune
                        </div>
                        <div className="mt-4 text-[24px] font-semibold">
                          {selectedProperty.logement.commune.nom}
                        </div>
                      </div>
                      <div className="border-t border-black/6 p-7 md:border-r">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                          Collections
                        </div>
                        <div className="mt-4 text-[24px] font-semibold">
                          {formatMoney(selectedProperty.collectionsTotal)} MAD
                        </div>
                      </div>
                      <div className="border-t border-black/6 p-7">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                          Payments
                        </div>
                        <div className="mt-4 text-[24px] font-semibold">
                          {selectedProperty.paymentCount}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="rounded-[28px] border border-black/6 bg-white p-7">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                          Contract Details
                        </div>
                        {selectedProperty.activeContract ?? selectedProperty.latestContract ? (
                          <div className="mt-6 space-y-4 text-[16px]">
                            <div className="flex items-center justify-between">
                              <span className="text-black/55">Contract ID</span>
                              <span className="font-semibold">
                                IF-{String((selectedProperty.activeContract ?? selectedProperty.latestContract)?.id).padStart(4, "0")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-black/55">Tenant</span>
                              <span className="font-semibold">
                                {(selectedProperty.activeContract ?? selectedProperty.latestContract)?.locataire.user.name}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-black/55">Start Date</span>
                              <span className="font-semibold">
                                {formatLongDate((selectedProperty.activeContract ?? selectedProperty.latestContract)?.date_debut ?? null)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-black/55">End Date</span>
                              <span className="font-semibold">
                                {formatLongDate((selectedProperty.activeContract ?? selectedProperty.latestContract)?.date_fin ?? null, "Open")}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-6 text-sm text-black/50">No contract attached yet.</div>
                        )}
                      </div>

                      <div className="rounded-[28px] border border-black/6 bg-white p-7">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                          Financials
                        </div>
                        <div className="mt-6 space-y-4 text-[16px]">
                          <div className="flex items-center justify-between">
                            <span className="text-black/55">Monthly Rent</span>
                            <span className="font-semibold">
                              {formatMoney(selectedProperty.logement.loyer)} MAD
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-black/55">Last Event</span>
                            <span className="font-semibold">
                              {formatLongDate(selectedProperty.nextEventDate, "No activity")}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-black/55">Collection Count</span>
                            <span className="font-semibold">{selectedProperty.paymentCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[28px] bg-black p-7 text-white">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                        Monthly Rent
                      </div>
                      <div className="mt-4 text-[54px] font-semibold tracking-tight">
                        {formatMoney(selectedProperty.logement.loyer)}
                        <span className="ml-2 text-[22px] text-white/65">MAD</span>
                      </div>
                      <div className="mt-6 space-y-3">
                        <Button
                          variant="secondary"
                          className="w-full rounded-2xl"
                          disabled={!selectedProperty.activeContract}
                          onClick={() =>
                            setPaymentForm((current) => ({
                              ...current,
                              contrat_id: String(selectedProperty.activeContract?.id ?? ""),
                              montant: selectedProperty.activeContract?.montant ?? current.montant,
                            }))
                          }
                        >
                          Collect Payment
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full rounded-2xl border-white/15 bg-transparent text-white hover:bg-white/10"
                          onClick={() => handleInvoice(selectedProperty)}
                        >
                          Generate Invoice
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-black/6 bg-white p-7">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                        Property Health
                      </div>
                      <div className="mt-6 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf8f0] text-[#2f8f62]">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold">Inspected</div>
                            <div className="text-sm text-black/50">
                              Last activity {relativeTime(selectedProperty.nextEventDate)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff5e8] text-[#d28a1e]">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold">Occupancy</div>
                            <div className="text-sm text-black/50">{selectedProperty.status}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-black/6 bg-white p-7">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                        Property Manager
                      </div>
                      <div className="mt-6 flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback>{initials(selectedProperty.logement.agent.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-2xl font-semibold">{selectedProperty.logement.agent.user.name}</div>
                          <div className="text-black/50">{selectedProperty.logement.agent.user.email}</div>
                        </div>
                      </div>
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <Button
                          variant="outline"
                          className="rounded-2xl"
                          onClick={() => {
                            window.location.href = `mailto:${selectedProperty.logement.agent.user.email}`;
                          }}
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-2xl"
                          onClick={() => handleShareProperty(selectedProperty)}
                        >
                          <Share2 className="h-4 w-4" />
                          Copy Info
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-black/6 bg-white p-7">
                      <div className="text-[22px] font-semibold">
                        {editingPropertyId === selectedProperty.logement.id ? "Edit Property" : "Record Payment"}
                      </div>
                      {editingPropertyId === selectedProperty.logement.id ? (
                        <div className="mt-6 space-y-4">
                          <div className="space-y-2">
                            <Label>Address</Label>
                            <Input
                              value={propertyForm.adresse}
                              onChange={(event) =>
                                setPropertyForm((current) => ({ ...current, adresse: event.target.value }))
                              }
                            />
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Area</Label>
                              <Input
                                type="number"
                                value={propertyForm.superficie}
                                onChange={(event) =>
                                  setPropertyForm((current) => ({ ...current, superficie: event.target.value }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Rent</Label>
                              <Input
                                type="number"
                                value={propertyForm.loyer}
                                onChange={(event) =>
                                  setPropertyForm((current) => ({ ...current, loyer: event.target.value }))
                                }
                              />
                            </div>
                          </div>
                          <Button className="w-full rounded-2xl" disabled={busy} onClick={() => void handlePropertySubmit()}>
                            Save changes
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-6 space-y-4">
                          <div className="space-y-2">
                            <Label>Contract</Label>
                            <select
                              className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                              value={paymentForm.contrat_id}
                              onChange={(event) =>
                                setPaymentForm((current) => ({ ...current, contrat_id: event.target.value }))
                              }
                            >
                              <option value="">Select contract</option>
                              {selectedProperty.activeContract ?? selectedProperty.latestContract ? (
                                <option
                                  value={String((selectedProperty.activeContract ?? selectedProperty.latestContract)?.id)}
                                >
                                  {selectedProperty.tenantName ?? "Current tenant"}
                                </option>
                              ) : null}
                            </select>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Amount</Label>
                              <Input
                                type="number"
                                value={paymentForm.montant}
                                onChange={(event) =>
                                  setPaymentForm((current) => ({ ...current, montant: event.target.value }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Date</Label>
                              <Input
                                type="date"
                                value={paymentForm.date_paiement}
                                onChange={(event) =>
                                  setPaymentForm((current) => ({
                                    ...current,
                                    date_paiement: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Mode</Label>
                              <select
                                className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                                value={paymentForm.mode}
                                onChange={(event) =>
                                  setPaymentForm((current) => ({ ...current, mode: event.target.value }))
                                }
                              >
                                <option value="Virement">Virement</option>
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <select
                                className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                                value={paymentForm.statut}
                                onChange={(event) =>
                                  setPaymentForm((current) => ({ ...current, statut: event.target.value }))
                                }
                              >
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                              </select>
                            </div>
                          </div>
                          <Button className="w-full rounded-2xl" disabled={busy} onClick={() => void handleRecordPayment()}>
                            Save payment
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "contracts" ? (
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-[42px] font-semibold tracking-tight">
                      Contracts <span className="align-middle text-base font-medium uppercase tracking-[0.18em] text-black/45">{activeContractsCount} active</span>
                    </h1>
                    <p className="mt-2 text-black/55">Review and create lease agreements across the portfolio.</p>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
                    <div className="grid grid-cols-[100px_minmax(0,1fr)_1fr_130px_130px_130px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                      <div>Ref</div>
                      <div>Tenant</div>
                      <div>Property</div>
                      <div>Start</div>
                      <div>End</div>
                      <div>Rent</div>
                    </div>
                    {contrats.map((contrat) => (
                      <div
                        key={contrat.id}
                        className="grid grid-cols-[100px_minmax(0,1fr)_1fr_130px_130px_130px] gap-4 border-t border-black/6 px-7 py-4"
                      >
                        <div className="self-center font-mono text-sm text-black/60">CTR-{String(contrat.id).padStart(4, "0")}</div>
                        <div className="self-center font-semibold">{contrat.locataire.user.name}</div>
                        <div className="self-center text-black/70">{contrat.logement.adresse}</div>
                        <div className="self-center text-black/55">{formatShortDate(contrat.date_debut)}</div>
                        <div className="self-center text-black/55">{formatShortDate(contrat.date_fin)}</div>
                        <div className="self-center">{formatMoney(contrat.montant)} MAD</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-black/6 bg-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[24px] font-semibold">New Contract</div>
                      <div className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-black/35">Draft CTR</div>
                    </div>
                    <FileText className="h-5 w-5 text-black/45" />
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Agent</Label>
                      <select
                        className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                        value={contractForm.agent_id}
                        onChange={(event) =>
                          setContractForm((current) => ({ ...current, agent_id: event.target.value }))
                        }
                      >
                        <option value="">Select agent</option>
                        {agentUsers.map((entry) => (
                          <option key={entry.id} value={entry.agent_profile?.id ?? ""}>
                            {entry.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Primary tenant</Label>
                      <select
                        className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                        value={contractForm.locataire_id}
                        onChange={(event) =>
                          setContractForm((current) => ({ ...current, locataire_id: event.target.value }))
                        }
                      >
                        <option value="">Select tenant</option>
                        {tenantUsers.map((entry) => (
                          <option key={entry.id} value={entry.locataire_profile?.id ?? ""}>
                            {entry.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Property</Label>
                      <select
                        className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                        value={contractForm.logement_id}
                        onChange={(event) => {
                          const selected = logements.find((entry) => String(entry.id) === event.target.value);
                          setContractForm((current) => ({
                            ...current,
                            logement_id: event.target.value,
                            agent_id: selected ? String(selected.agent.id) : current.agent_id,
                            montant: selected?.loyer ?? current.montant,
                          }));
                        }}
                      >
                        <option value="">Select property</option>
                        {logements.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.adresse} • {entry.commune.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Start date</Label>
                        <Input
                          type="date"
                          value={contractForm.date_debut}
                          onChange={(event) =>
                            setContractForm((current) => ({ ...current, date_debut: event.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End date</Label>
                        <Input
                          type="date"
                          value={contractForm.date_fin}
                          onChange={(event) =>
                            setContractForm((current) => ({ ...current, date_fin: event.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-[20px] bg-[#f6f6f4] p-5">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">Financial terms</div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Monthly rent</Label>
                          <Input
                            type="number"
                            value={contractForm.montant}
                            onChange={(event) =>
                              setContractForm((current) => ({ ...current, montant: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <select
                            className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                            value={contractForm.statut}
                            onChange={(event) =>
                              setContractForm((current) => ({ ...current, statut: event.target.value }))
                            }
                          >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="expired">Expired</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full rounded-2xl" disabled={busy} onClick={() => void handleContractSubmit()}>
                      Create Contract
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "payments" ? (
              <section className="space-y-8">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h1 className="text-[42px] font-semibold tracking-tight">Payments</h1>
                    <p className="mt-2 text-black/55">Validate rent collection and record incoming payments.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() =>
                      downloadTextFile(
                        "payments.csv",
                        ["Tenant,Property,Amount,Date,Mode,Status"]
                          .concat(
                            paiements.map((paiement) =>
                              [
                                paiement.contrat.locataire.user.name,
                                paiement.contrat.logement.adresse,
                                paiement.montant,
                                paiement.date_paiement,
                                paiement.mode,
                                paiement.statut,
                              ].join(","),
                            ),
                          )
                          .join("\n"),
                      )
                    }
                  >
                    Export CSV
                  </Button>
                </div>

                <div className="grid gap-5 xl:grid-cols-4">
                  <div className="rounded-[24px] border border-black/6 bg-white p-6">
                    <div className="text-sm text-black/60">Expected Revenue</div>
                    <div className="mt-2 text-3xl font-semibold">{formatMoney(expectedRevenue)} MAD</div>
                  </div>
                  <div className="rounded-[24px] border border-black/6 bg-white p-6">
                    <div className="text-sm text-black/60">Collected Amount</div>
                    <div className="mt-2 text-3xl font-semibold">{formatMoney(collectionsTotal)} MAD</div>
                  </div>
                  <div className="rounded-[24px] border border-black/6 bg-white p-6">
                    <div className="text-sm text-black/60">Open Balance</div>
                    <div className="mt-2 text-3xl font-semibold text-[var(--danger)]">{formatMoney(overdueBalance)} MAD</div>
                  </div>
                  <div className="rounded-[24px] border border-black/6 bg-white p-6">
                    <div className="text-sm text-black/60">Collection Rate</div>
                    <div className="mt-2 text-3xl font-semibold">{collectionRate}%</div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
                    <div className="grid grid-cols-[minmax(0,1fr)_1fr_140px_140px_140px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                      <div>Tenant</div>
                      <div>Property</div>
                      <div>Paid</div>
                      <div>Date</div>
                      <div>Status</div>
                    </div>
                    {paiements.map((paiement) => (
                      <div
                        key={paiement.id}
                        className="grid grid-cols-[minmax(0,1fr)_1fr_140px_140px_140px] gap-4 border-t border-black/6 px-7 py-4"
                      >
                        <div className="self-center font-semibold">{paiement.contrat.locataire.user.name}</div>
                        <div className="self-center text-black/65">{paiement.contrat.logement.adresse}</div>
                        <div className="self-center">{formatMoney(paiement.montant)} MAD</div>
                        <div className="self-center text-black/55">{formatShortDate(paiement.date_paiement)}</div>
                        <div className="self-center">
                          <Badge variant={toneForStatus(paiement.statut)}>{paiement.statut}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-black/6 bg-white p-6">
                    <div className="text-[22px] font-semibold">Register Payment</div>
                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Contract</Label>
                        <select
                          className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                          value={paymentForm.contrat_id}
                          onChange={(event) => {
                            const selected = contrats.find((entry) => String(entry.id) === event.target.value);
                            setPaymentForm((current) => ({
                              ...current,
                              contrat_id: event.target.value,
                              montant: selected?.montant ?? current.montant,
                            }));
                          }}
                        >
                          <option value="">Select contract</option>
                          {contrats.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.locataire.user.name} • {entry.logement.adresse}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Received amount</Label>
                          <Input
                            type="number"
                            value={paymentForm.montant}
                            onChange={(event) =>
                              setPaymentForm((current) => ({ ...current, montant: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Payment date</Label>
                          <Input
                            type="date"
                            value={paymentForm.date_paiement}
                            onChange={(event) =>
                              setPaymentForm((current) => ({ ...current, date_paiement: event.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Method</Label>
                          <select
                            className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                            value={paymentForm.mode}
                            onChange={(event) =>
                              setPaymentForm((current) => ({ ...current, mode: event.target.value }))
                            }
                          >
                            <option value="Virement">Bank Transfer</option>
                            <option value="Card">Credit Card</option>
                            <option value="Check">Check</option>
                            <option value="Cash">Cash</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <select
                            className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                            value={paymentForm.statut}
                            onChange={(event) =>
                              setPaymentForm((current) => ({ ...current, statut: event.target.value }))
                            }
                          >
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      </div>
                      <Button className="w-full rounded-2xl" disabled={busy} onClick={() => void handleRecordPayment()}>
                        Confirm Payment
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "tenants" ? (
              <section className="space-y-6">
                <div>
                  <h1 className="text-[30px] font-semibold tracking-tight">Tenants</h1>
                  <p className="mt-2 text-black/55">Live locataire records linked to active contracts.</p>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
                  <div className="grid grid-cols-[minmax(0,1.2fr)_1fr_180px_150px_140px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                    <div>Tenant</div>
                    <div>Email</div>
                    <div>Residence</div>
                    <div>Rent</div>
                    <div>Status</div>
                  </div>

                  {tenantRows.map((row) => (
                    <div
                      key={row.user.id}
                      className="grid grid-cols-[minmax(0,1.2fr)_1fr_180px_150px_140px] gap-4 border-t border-black/6 px-7 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarFallback>{initials(row.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{row.user.name}</div>
                          <div className="text-sm text-black/45">{row.user.phone ?? "No phone"}</div>
                        </div>
                      </div>
                      <div className="self-center text-[15px]">{row.user.email}</div>
                      <div className="self-center text-[15px]">{row.residence}</div>
                      <div className="self-center text-[15px]">
                        {row.rent ? `${formatMoney(row.rent)} MAD` : "N/A"}
                      </div>
                      <div className="self-center">
                        <Badge variant={toneForStatus(row.user.status)}>{row.user.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === "users" ? (
              <section className="space-y-7">
                <div>
                  <h1 className="text-[56px] font-semibold tracking-tight">User Management</h1>
                  <p className="mt-2 max-w-3xl text-[18px] text-black/60">
                    Configure organizational access and monitor active property stakeholders.
                  </p>
                </div>

                <div className="grid gap-5 xl:grid-cols-3">
                  <div className="rounded-[24px] border border-black/6 bg-white p-7">
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-black/35">Total Agents</div>
                    <div className="mt-5 flex items-end gap-3">
                      <div className="text-5xl font-bold tracking-tight">{agentUsers.length}</div>
                      <div className="pb-2 text-sm font-semibold text-[#0b9c45]">live</div>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-black/6 bg-white p-7">
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-black/35">Total Tenants</div>
                    <div className="mt-5 flex items-end gap-3">
                      <div className="text-5xl font-bold tracking-tight">{tenantUsers.length}</div>
                      <div className="pb-2 text-sm font-semibold text-black/35">stable</div>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-black/6 bg-white p-7">
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-black/35">System Admins</div>
                    <div className="mt-5 flex items-end gap-3">
                      <div className="text-5xl font-bold tracking-tight">{adminUsers.length}</div>
                      <div className="pb-2 text-sm font-semibold text-black/35">
                        {role === "super_admin" ? "manageable" : "read only"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-5 border-b border-black/8 pb-5">
                  {(role === "super_admin"
                    ? [{ id: "admins", label: "Admins", count: adminUsers.length }]
                    : [
                        { id: "agents", label: "Agents", count: agentUsers.length },
                        { id: "locataires", label: "Tenants", count: tenantUsers.length },
                      ]
                  ).map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setUserView(entry.id as UserView)}
                      className={`flex items-center gap-3 pb-3 ${
                        userView === entry.id ? "border-b-2 border-black text-black" : "text-black/60"
                      }`}
                    >
                      <span className="text-[15px] font-medium">{entry.label}</span>
                      <span className="rounded-lg bg-black/6 px-2 py-1 text-xs">{entry.count}</span>
                    </button>
                  ))}

                  <div className="ml-auto">
                    <Button className="rounded-2xl" onClick={() => setUserForm((current) => ({ ...current, role: role === "super_admin" ? "admin" : "agent" }))}>
                      <Plus className="h-4 w-4" />
                      Invite New User
                    </Button>
                  </div>
                </div>

                <div className="rounded-[24px] border border-black/6 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[22px] font-semibold">Add user or agent</div>
                      <div className="text-sm text-black/50">
                        {role === "super_admin"
                          ? "Create administrator accounts for the organization."
                          : "Create agent and tenant accounts without leaving the dashboard."}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 xl:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <select
                        className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                        value={userForm.role}
                        onChange={(event) =>
                          setUserForm((current) => ({ ...current, role: event.target.value }))
                        }
                      >
                        {role === "super_admin" ? (
                          <option value="admin">Admin</option>
                        ) : (
                          <>
                            <option value="agent">Agent</option>
                            <option value="locataire">Tenant</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Full name</Label>
                      <Input
                        value={userForm.name}
                        onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Sarah Chen"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={userForm.email}
                        onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder="name@immoflow.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={userForm.phone}
                        onChange={(event) => setUserForm((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="+212 6 00 00 00 00"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={userForm.login}
                        onChange={(event) => setUserForm((current) => ({ ...current, login: event.target.value }))}
                        placeholder="sarah.chen"
                      />
                    </div>
                    {userForm.role === "agent" ? (
                      <div className="space-y-2">
                        <Label>Agent code</Label>
                        <Input
                          value={userForm.code_agent}
                          onChange={(event) =>
                            setUserForm((current) => ({ ...current, code_agent: event.target.value }))
                          }
                          placeholder="AGT-00024"
                        />
                      </div>
                    ) : null}
                    {userForm.role === "admin" ? (
                      <div className="space-y-2">
                        <Label>Access level</Label>
                        <select
                          className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                          value={userForm.niveau_acces}
                          onChange={(event) =>
                            setUserForm((current) => ({ ...current, niveau_acces: event.target.value }))
                          }
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="support">Support</option>
                        </select>
                      </div>
                    ) : null}
                    {userForm.role === "locataire" ? (
                      <>
                        <div className="space-y-2">
                          <Label>Birth date</Label>
                          <Input
                            type="date"
                            value={userForm.date_naissance}
                            onChange={(event) =>
                              setUserForm((current) => ({ ...current, date_naissance: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Address</Label>
                          <Input
                            value={userForm.adresse}
                            onChange={(event) =>
                              setUserForm((current) => ({ ...current, adresse: event.target.value }))
                            }
                            placeholder="Residence address"
                          />
                        </div>
                      </>
                    ) : null}
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <select
                        className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                        value={userForm.status}
                        onChange={(event) =>
                          setUserForm((current) => ({ ...current, status: event.target.value }))
                        }
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={userForm.password}
                        onChange={(event) =>
                          setUserForm((current) => ({ ...current, password: event.target.value }))
                        }
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm password</Label>
                      <Input
                        type="password"
                        value={userForm.password_confirmation}
                        onChange={(event) =>
                          setUserForm((current) => ({
                            ...current,
                            password_confirmation: event.target.value,
                          }))
                        }
                        placeholder="Repeat password"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button className="h-12 w-full rounded-2xl" disabled={busy} onClick={() => void handleCreateUser()}>
                        Create User
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
                  <div className="grid grid-cols-[minmax(0,1.2fr)_1fr_170px_120px_150px_140px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                    <div>Name + Avatar</div>
                    <div>Email</div>
                    <div>Phone</div>
                    <div>Records</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>

                  {visibleUsers.map((entry) => {
                    const recordCount =
                      entry.role === "agent"
                        ? logements.filter((logement) => logement.agent.user.id === entry.id).length
                        : entry.role === "locataire"
                          ? contrats.filter((contrat) => contrat.locataire.user.id === entry.id).length
                          : users.filter((candidate) => candidate.managed_by_id === entry.id).length;

                    return (
                      <div
                        key={entry.id}
                        className="grid grid-cols-[minmax(0,1.2fr)_1fr_170px_120px_150px_140px] gap-4 border-t border-black/6 px-7 py-5"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-[18px] font-semibold">{entry.name}</div>
                            <div className="text-sm uppercase tracking-[0.18em] text-black/40">
                              {entry.role.replace("_", " ")}
                            </div>
                          </div>
                        </div>
                        <div className="self-center text-[15px]">{entry.email}</div>
                        <div className="self-center text-[15px]">{entry.phone ?? "No phone"}</div>
                        <div className="self-center">
                          <span className="rounded-xl bg-black/6 px-3 py-2 text-sm font-semibold">{recordCount}</span>
                        </div>
                        <div className="self-center">
                          <Badge variant={toneForStatus(entry.status)}>{entry.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {["active", "pending", "suspended"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                                entry.status === status ? "bg-black text-white" : "bg-black/5 text-black/65"
                              }`}
                              disabled={busy}
                              onClick={() => void handleStatusUpdate(entry.id, status, entry.name)}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {activeTab === "notifications" ? (
              <NotificationsPanel
                token={token}
                user={user}
                users={users}
                notifications={notifications}
                reload={reload}
              />
            ) : null}

            {activeTab === "profile" ? (
              <ProfilePanel token={token} user={user} onSaved={reload} />
            ) : null}

            {false && activeTab === "profile" ? (
              <section className="space-y-7">
                <div className="flex flex-wrap items-center gap-8 border-b border-black/8 pb-5">
                  <h1 className="text-[28px] font-semibold tracking-tight">Profile</h1>
                  {["Profile", "Security", "Notifications", "Appearance"].map((entry, index) => (
                    <span
                      key={entry}
                      className={`pb-4 text-[15px] ${index === 0 ? "border-b-2 border-black font-semibold text-black" : "text-black/55"}`}
                    >
                      {entry}
                    </span>
                  ))}
                </div>

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="space-y-6">
                    <div className="rounded-[24px] border border-black/10 bg-white p-8">
                      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-5">
                          <Avatar className="h-20 w-20 border border-black/10">
                            <AvatarImage src={profileForm.avatar_url || undefined} alt={profileForm.name} />
                            <AvatarFallback>{initials(profileForm.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-[28px] font-semibold">{profileForm.name}</div>
                            <div className="text-black/55">{user.role.replace("_", " ")}</div>
                          </div>
                        </div>
                        <Button className="rounded-2xl" disabled={busy} onClick={() => void handleProfileSubmit()}>
                          Save Changes
                        </Button>
                      </div>

                      <div className="mt-10 grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Full name</Label>
                          <Input
                            value={profileForm.name}
                            onChange={(event) =>
                              setProfileForm((current) => ({ ...current, name: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email address</Label>
                          <Input
                            type="email"
                            value={profileForm.email}
                            onChange={(event) =>
                              setProfileForm((current) => ({ ...current, email: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone number</Label>
                          <Input
                            value={profileForm.phone}
                            onChange={(event) =>
                              setProfileForm((current) => ({ ...current, phone: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input
                            value={profileForm.login}
                            onChange={(event) =>
                              setProfileForm((current) => ({ ...current, login: event.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Avatar URL</Label>
                          <Input
                            value={profileForm.avatar_url}
                            onChange={(event) =>
                              setProfileForm((current) => ({ ...current, avatar_url: event.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-[24px] border border-black/10 bg-white p-7">
                        <div className="text-[20px] font-semibold">Security Password</div>
                        <p className="mt-3 text-sm leading-6 text-black/55">
                          Leave these fields empty when you only want to update profile details.
                        </p>
                        <div className="mt-6 space-y-4">
                          <div className="space-y-2">
                            <Label>Current password</Label>
                            <Input
                              type="password"
                              value={profileForm.current_password}
                              onChange={(event) =>
                                setProfileForm((current) => ({
                                  ...current,
                                  current_password: event.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>New password</Label>
                            <Input
                              type="password"
                              value={profileForm.password}
                              onChange={(event) =>
                                setProfileForm((current) => ({ ...current, password: event.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Confirm new password</Label>
                            <Input
                              type="password"
                              value={profileForm.password_confirmation}
                              onChange={(event) =>
                                setProfileForm((current) => ({
                                  ...current,
                                  password_confirmation: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-black/10 bg-white p-7">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[20px] font-semibold">Two-Factor Auth</div>
                            <p className="mt-3 text-sm leading-6 text-black/55">
                              UI-ready security panel matching the dashboard style.
                            </p>
                          </div>
                          <div className="flex h-8 w-14 items-center justify-end rounded-full bg-black p-1">
                            <div className="h-6 w-6 rounded-full bg-white" />
                          </div>
                        </div>
                        <div className="mt-20 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                          Active account role: {user.role.replace("_", " ")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[24px] border border-black/10 bg-[#f0f0f0] p-7">
                      <div className="text-sm font-semibold uppercase tracking-[0.22em] text-black/45">Active Sessions</div>
                      <div className="mt-6 space-y-5">
                        <div>
                          <div className="font-semibold">Current browser</div>
                          <div className="mt-1 text-sm text-black/50">Africa/Casablanca • Current</div>
                        </div>
                        <div>
                          <div className="font-semibold">Last login</div>
                          <div className="mt-1 text-sm text-black/50">
                            {user.last_login_at ? formatLongDate(user.last_login_at) : "Not recorded yet"}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mt-6 text-sm font-semibold text-[var(--danger)]"
                        onClick={() => startTransition(() => void signOut({ callbackUrl: "/login" }))}
                      >
                        Log out this device
                      </button>
                    </div>

                    <div className="rounded-[24px] bg-black p-7 text-white">
                      <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/55">Plan Status</div>
                      <div className="mt-5 text-[38px] font-semibold">Enterprise</div>
                      <div className="mt-2 text-white/60">Portfolio workspace</div>
                      <div className="mt-6 h-2 rounded-full bg-white/20">
                        <div className="h-full w-[84%] rounded-full bg-white" />
                      </div>
                      <div className="mt-3 text-sm text-white/55">{logements.length} properties managed</div>
                    </div>

                    <div className="rounded-[24px] border border-black/10 bg-white p-7">
                      <div className="text-sm font-semibold uppercase tracking-[0.22em] text-black/45">Appearance</div>
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border-2 border-black bg-white p-4">
                          <div className="h-2 w-full rounded bg-black/10" />
                          <div className="mt-3 h-2 w-2/3 rounded bg-black/10" />
                        </div>
                        <div className="rounded-2xl bg-[#888888] p-4">
                          <div className="h-2 w-full rounded bg-white/20" />
                          <div className="mt-3 h-2 w-2/3 rounded bg-white/20" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "settings" ? (
              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-[24px] border border-black/6 bg-white p-7">
                  <div className="text-[24px] font-semibold">Create commune</div>
                  <div className="mt-2 text-sm text-black/50">
                    Admin-owned reference data for property records.
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Commune name</Label>
                      <Input
                        value={communeForm.nom}
                        onChange={(event) =>
                          setCommuneForm((current) => ({ ...current, nom: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Population</Label>
                        <Input
                          type="number"
                          value={communeForm.nombre_habitants}
                          onChange={(event) =>
                            setCommuneForm((current) => ({
                              ...current,
                              nombre_habitants: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Distance to agency</Label>
                        <Input
                          type="number"
                          value={communeForm.distance_agence}
                          onChange={(event) =>
                            setCommuneForm((current) => ({
                              ...current,
                              distance_agence: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <Button className="rounded-2xl" disabled={busy} onClick={() => void handleCreateCommune()}>
                      <Landmark className="h-4 w-4" />
                      Save commune
                    </Button>
                  </div>
                </div>

                <div className="rounded-[24px] border border-black/6 bg-white p-7">
                  <div className="text-[24px] font-semibold">Create housing type</div>
                  <div className="mt-2 text-sm text-black/50">
                    Used by agents when they publish a new property.
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Type label</Label>
                      <Input
                        value={typeForm.nom_type}
                        onChange={(event) =>
                          setTypeForm((current) => ({ ...current, nom_type: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Flat charges</Label>
                      <Input
                        type="number"
                        value={typeForm.charge_forfaitaires}
                        onChange={(event) =>
                          setTypeForm((current) => ({
                            ...current,
                            charge_forfaitaires: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button className="rounded-2xl" disabled={busy} onClick={() => void handleCreateType()}>
                      <Building2 className="h-4 w-4" />
                      Save type
                    </Button>
                  </div>
                </div>

                <div className="rounded-[24px] border border-black/6 bg-white p-7">
                  <div className="text-[24px] font-semibold">Existing communes</div>
                  <div className="mt-6 space-y-3">
                    {communes.map((entry) => (
                      <div key={entry.id} className="rounded-2xl bg-[#f6f6f4] px-4 py-4">
                        <div className="font-semibold">{entry.nom}</div>
                        <div className="mt-1 text-sm text-black/50">
                          {entry.nombre_habitants} habitants • {entry.distance_agence} km
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-black/6 bg-white p-7">
                  <div className="text-[24px] font-semibold">Existing housing types</div>
                  <div className="mt-6 space-y-3">
                    {types.map((entry) => (
                      <div key={entry.id} className="rounded-2xl bg-[#f6f6f4] px-4 py-4">
                        <div className="font-semibold">{entry.nom_type}</div>
                        <div className="mt-1 text-sm text-black/50">
                          Charges: {formatMoney(entry.charge_forfaitaires)} MAD
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
