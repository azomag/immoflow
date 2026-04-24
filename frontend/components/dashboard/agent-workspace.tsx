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
  LayoutGrid,
  Mail,
  Plus,
  ReceiptText,
  Search,
  Share2,
  Users,
} from "lucide-react";
import type {
  AuthenticatedUser,
  Commune,
  Contrat,
  Logement,
  Paiement,
  TypeLogement,
  UserRecord,
} from "@/lib/api";
import { backendRequest } from "@/lib/api";
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

type AgentWorkspaceProps = {
  token: string;
  user: AuthenticatedUser;
  users: UserRecord[];
  logements: Logement[];
  contrats: Contrat[];
  paiements: Paiement[];
  communes: Commune[];
  types: TypeLogement[];
  reload: () => Promise<void>;
};

type AgentTab = "dashboard" | "properties" | "contracts" | "payments" | "tenants";

function emptyPropertyForm() {
  return {
    type_logement_id: "",
    commune_id: "",
    adresse: "",
    superficie: "",
    loyer: "",
  };
}

export function AgentWorkspace({
  token,
  user,
  users,
  logements,
  contrats,
  paiements,
  communes,
  types,
  reload,
}: AgentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AgentTab>("dashboard");
  const [search, setSearch] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);
  const [contratForm, setContratForm] = useState({
    locataire_id: "",
    logement_id: "",
    date_debut: "",
    date_fin: "",
    montant: "",
    statut: "active",
  });
  const [paymentForm, setPaymentForm] = useState({
    contrat_id: "",
    montant: "",
    date_paiement: new Date().toISOString().slice(0, 10),
    mode: "Virement",
    statut: "paid",
  });

  const tenantUsers = useMemo(
    () => users.filter((entry) => entry.role === "locataire"),
    [users],
  );

  const propertySnapshots = useMemo(
    () => logements.map((logement) => buildPropertySnapshot(logement, contrats, paiements)),
    [contrats, logements, paiements],
  );

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return propertySnapshots.filter((snapshot) => {
      if (!query) {
        return true;
      }

      return [
        snapshot.ref,
        snapshot.logement.adresse,
        snapshot.logement.commune.nom,
        snapshot.logement.type_logement.nom_type,
        snapshot.tenantName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [propertySnapshots, search]);

  const selectedProperty =
    propertySnapshots.find((snapshot) => snapshot.logement.id === selectedPropertyId) ?? null;

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

  const recentActivity = useMemo(() => {
    return [
      ...contrats.map((contrat) => ({
        id: `contract-${contrat.id}`,
        title: contrat.signature_status.toLowerCase() === "signed" ? "Contract Signed" : "Contract Sent",
        description: `${contrat.locataire.user.name} • ${contrat.logement.adresse}`,
        when: relativeTime(contrat.signed_at ?? contrat.date_debut),
        createdAt: contrat.signed_at ?? contrat.date_debut,
      })),
      ...paiements.map((paiement) => ({
        id: `payment-${paiement.id}`,
        title: "Payment Recorded",
        description: `${formatMoney(paiement.montant)} MAD • ${paiement.contrat.locataire.user.name}`,
        when: relativeTime(paiement.date_paiement),
        createdAt: paiement.date_paiement,
      })),
    ]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, 4);
  }, [contrats, paiements]);

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

  function openTab(tab: AgentTab) {
    setActiveTab(tab);
    setSelectedPropertyId(null);

    if (tab !== "properties") {
      resetPropertyEditor();
    }
  }

  function beginEditProperty(snapshot: (typeof propertySnapshots)[number]) {
    setEditingPropertyId(snapshot.logement.id);
    setPropertyForm({
      type_logement_id: String(snapshot.logement.type_logement.id),
      commune_id: String(snapshot.logement.commune.id),
      adresse: snapshot.logement.adresse,
      superficie: snapshot.logement.superficie,
      loyer: snapshot.logement.loyer,
    });
  }

  async function handlePropertySubmit() {
    const payload = {
      type_logement_id: Number(propertyForm.type_logement_id),
      commune_id: Number(propertyForm.commune_id),
      adresse: propertyForm.adresse,
      superficie: Number(propertyForm.superficie),
      loyer: Number(propertyForm.loyer),
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

  async function handleContractSubmit() {
    await runMutation(async () => {
      await backendRequest("/api/contrats", {
        method: "POST",
        body: JSON.stringify({
          locataire_id: Number(contratForm.locataire_id),
          logement_id: Number(contratForm.logement_id),
          date_debut: contratForm.date_debut,
          date_fin: contratForm.date_fin || null,
          montant: Number(contratForm.montant),
          statut: contratForm.statut,
        }),
      }, token);
      setContratForm({
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

  async function handlePaymentSubmit() {
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
      setPaymentForm((current) => ({ ...current, montant: "" }));
      setNotice("Payment recorded.");
    });
  }

  function handleShareProperty(snapshot: (typeof propertySnapshots)[number]) {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(
        `${snapshot.logement.adresse} • ${snapshot.logement.commune.nom}`,
      );
      setNotice("Property copied.");
    }
  }

  function handleInvoice(snapshot: (typeof propertySnapshots)[number]) {
    const contract = snapshot.activeContract ?? snapshot.latestContract;
    if (!contract) {
      setError("No contract attached to this property.");
      return;
    }

    downloadTextFile(
      `agent-invoice-${snapshot.ref.toLowerCase()}.txt`,
      [
        "ImmoFlow Agent Invoice",
        `Property: ${snapshot.logement.adresse}`,
        `Reference: ${snapshot.ref}`,
        `Tenant: ${contract.locataire.user.name}`,
        `Rent: ${formatMoney(contract.montant)} MAD`,
        `Start: ${formatLongDate(contract.date_debut)}`,
        `End: ${formatLongDate(contract.date_fin, "Open")}`,
      ].join("\n"),
    );
    setNotice("Invoice generated.");
  }

  const navItems: Array<{ id: AgentTab; label: string; icon: typeof LayoutGrid }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "properties", label: "Properties", icon: Building2 },
    { id: "contracts", label: "Contracts", icon: FileText },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "tenants", label: "Tenants", icon: Users },
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
            <Button
              className="w-full rounded-2xl"
              onClick={() => {
                openTab("properties");
              }}
            >
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
                placeholder="Search by reference, address or tenant..."
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
              <Avatar className="h-11 w-11 border border-black/8">
                <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
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
                      <div className="pb-2 text-sm font-semibold text-[#0b9c45]">portfolio</div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-black/6 bg-white p-7">
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-black/35">
                      Active Contracts
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <div className="text-5xl font-bold tracking-tight">{activeContractsCount}</div>
                      <div className="pb-2 text-sm font-semibold text-black/35">
                        {contrats.length === 0 ? "No contracts yet" : `${contrats.length} total`}
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
                          Pending Signatures
                        </div>
                        <div className="mt-3 text-5xl font-bold tracking-tight">
                          {contrats.filter((contrat) => contrat.signature_status === "pending").length}
                        </div>
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
                      <div className="grid grid-cols-[120px_minmax(0,1.5fr)_190px_160px] gap-4 border-b border-black/6 px-8 py-5 text-xs font-semibold uppercase tracking-[0.24em] text-black/35">
                        <div>Ref</div>
                        <div>Property Name</div>
                        <div>Status</div>
                        <div>Next Event</div>
                      </div>
                      {filteredProperties.slice(0, 4).map((property) => (
                        <button
                          key={property.logement.id}
                          type="button"
                          onClick={() => {
                            openTab("properties");
                            setSelectedPropertyId(property.logement.id);
                          }}
                          className="grid w-full grid-cols-[120px_minmax(0,1.5fr)_190px_160px] gap-4 border-b border-black/6 px-8 py-5 text-left transition hover:bg-black/[0.02] last:border-b-0"
                        >
                          <div className="self-center text-[15px] text-black/55">{property.ref}</div>
                          <div>
                            <div className="text-[17px] font-semibold">{property.logement.adresse}</div>
                            <div className="text-sm text-black/45">
                              {property.tenantName ?? property.logement.commune.nom}
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
                              <div className="mt-1 text-[15px] leading-6 text-black/55">{item.description}</div>
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
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
                  <div className="grid grid-cols-[128px_minmax(0,1.5fr)_140px_120px_120px_170px_56px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                    <div>Ref</div>
                    <div>Property</div>
                    <div>Type</div>
                    <div>Area</div>
                    <div>Rent</div>
                    <div>Status</div>
                    <div />
                  </div>

                  {filteredProperties.map((property) => (
                    <button
                      key={property.logement.id}
                      type="button"
                      onClick={() => setSelectedPropertyId(property.logement.id)}
                      className="grid w-full grid-cols-[128px_minmax(0,1.5fr)_140px_120px_120px_170px_56px] gap-4 border-t border-black/6 px-7 py-4 text-left transition hover:bg-black/[0.02]"
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
                        {editingPropertyId ? "Save changes" : "Create property"}
                      </Button>
                      {editingPropertyId ? (
                        <Button variant="outline" className="rounded-2xl" onClick={resetPropertyEditor}>
                          Cancel
                        </Button>
                      ) : null}
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
                      <div className="min-h-[340px] bg-[radial-gradient(circle_at_10%_20%,#f4ead8,transparent_22%),linear-gradient(135deg,#d4dfef,#f5f1ea_58%,#d7e1d1)] p-8">
                        <Badge variant={toneForStatus(selectedProperty.status)}>{selectedProperty.status}</Badge>
                        <div className="mt-32 max-w-md text-4xl font-semibold tracking-tight text-black/85">
                          {selectedProperty.logement.type_logement.nom_type}
                        </div>
                        <div className="mt-2 text-black/60">{selectedProperty.ref}</div>
                      </div>
                    </div>

                    <div className="grid gap-0 overflow-hidden rounded-[28px] border border-black/6 bg-white md:grid-cols-3">
                      <div className="border-b border-black/6 p-7 md:border-b-0 md:border-r">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">Area</div>
                        <div className="mt-4 text-[24px] font-semibold">{selectedProperty.logement.superficie} m²</div>
                      </div>
                      <div className="border-b border-black/6 p-7 md:border-b-0 md:border-r">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">Tenant</div>
                        <div className="mt-4 text-[24px] font-semibold">{selectedProperty.tenantName ?? "Vacant"}</div>
                      </div>
                      <div className="p-7">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">Status</div>
                        <div className="mt-4">
                          <Badge variant={toneForStatus(selectedProperty.status)}>{selectedProperty.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[28px] bg-black p-7 text-white">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Monthly Rent</div>
                      <div className="mt-4 text-[54px] font-semibold tracking-tight">
                        {formatMoney(selectedProperty.logement.loyer)}
                        <span className="ml-2 text-[22px] text-white/65">MAD</span>
                      </div>
                      <div className="mt-6 space-y-3">
                        <Button
                          variant="secondary"
                          className="w-full rounded-2xl"
                          disabled={!selectedProperty.activeContract}
                          onClick={() => {
                            openTab("payments");
                            setPaymentForm((current) => ({
                              ...current,
                              contrat_id: String(selectedProperty.activeContract?.id ?? ""),
                              montant: selectedProperty.activeContract?.montant ?? current.montant,
                            }));
                          }}
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
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">Contract</div>
                      {selectedProperty.activeContract ?? selectedProperty.latestContract ? (
                        <div className="mt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-black/55">Tenant</span>
                            <span className="font-semibold">{selectedProperty.tenantName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-black/55">Start</span>
                            <span className="font-semibold">
                              {formatLongDate((selectedProperty.activeContract ?? selectedProperty.latestContract)?.date_debut ?? null)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-black/55">End</span>
                            <span className="font-semibold">
                              {formatLongDate((selectedProperty.activeContract ?? selectedProperty.latestContract)?.date_fin ?? null, "Open")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 text-sm text-black/50">No contract attached.</div>
                      )}
                    </div>

                    <div className="rounded-[28px] border border-black/6 bg-white p-7">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">Tenant Contact</div>
                      <div className="mt-6 text-2xl font-semibold">{selectedProperty.tenantName ?? "No active tenant"}</div>
                      <div className="mt-2 text-black/50">
                        {(selectedProperty.activeContract ?? selectedProperty.latestContract)?.locataire.user.email ?? "No email"}
                      </div>
                      {(selectedProperty.activeContract ?? selectedProperty.latestContract)?.locataire.user.email ? (
                        <Button
                          variant="outline"
                          className="mt-6 w-full rounded-2xl"
                          onClick={() => {
                            window.location.href = `mailto:${(selectedProperty.activeContract ?? selectedProperty.latestContract)?.locataire.user.email}`;
                          }}
                        >
                          <Mail className="h-4 w-4" />
                          Email tenant
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "contracts" ? (
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
                  <div className="grid grid-cols-[100px_minmax(0,1fr)_1fr_140px_140px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                    <div>ID</div>
                    <div>Property</div>
                    <div>Tenant</div>
                    <div>Amount</div>
                    <div>Status</div>
                  </div>
                  {contrats.map((contrat) => (
                    <div
                      key={contrat.id}
                      className="grid grid-cols-[100px_minmax(0,1fr)_1fr_140px_140px] gap-4 border-t border-black/6 px-7 py-4"
                    >
                      <div className="self-center text-black/60">IF-{String(contrat.id).padStart(4, "0")}</div>
                      <div className="self-center">{contrat.logement.adresse}</div>
                      <div className="self-center">{contrat.locataire.user.name}</div>
                      <div className="self-center">{formatMoney(contrat.montant)} MAD</div>
                      <div className="self-center">
                        <Badge variant={toneForStatus(contrat.signature_status)}>{contrat.signature_status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[24px] border border-black/6 bg-white p-6">
                  <div className="text-[22px] font-semibold">Create contract</div>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Tenant</Label>
                      <select
                        className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                        value={contratForm.locataire_id}
                        onChange={(event) =>
                          setContratForm((current) => ({ ...current, locataire_id: event.target.value }))
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
                        value={contratForm.logement_id}
                        onChange={(event) =>
                          setContratForm((current) => ({ ...current, logement_id: event.target.value }))
                        }
                      >
                        <option value="">Select property</option>
                        {logements.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.adresse}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Start date</Label>
                        <Input
                          type="date"
                          value={contratForm.date_debut}
                          onChange={(event) =>
                            setContratForm((current) => ({ ...current, date_debut: event.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End date</Label>
                        <Input
                          type="date"
                          value={contratForm.date_fin}
                          onChange={(event) =>
                            setContratForm((current) => ({ ...current, date_fin: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={contratForm.montant}
                          onChange={(event) =>
                            setContratForm((current) => ({ ...current, montant: event.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select
                          className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                          value={contratForm.statut}
                          onChange={(event) =>
                            setContratForm((current) => ({ ...current, statut: event.target.value }))
                          }
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>
                    <Button className="w-full rounded-2xl" disabled={busy} onClick={() => void handleContractSubmit()}>
                      Create contract
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "payments" ? (
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
                  <div className="grid grid-cols-[100px_minmax(0,1fr)_160px_140px_140px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                    <div>ID</div>
                    <div>Tenant</div>
                    <div>Amount</div>
                    <div>Date</div>
                    <div>Status</div>
                  </div>
                  {paiements.map((paiement) => (
                    <div
                      key={paiement.id}
                      className="grid grid-cols-[100px_minmax(0,1fr)_160px_140px_140px] gap-4 border-t border-black/6 px-7 py-4"
                    >
                      <div className="self-center text-black/60">PM-{String(paiement.id).padStart(4, "0")}</div>
                      <div className="self-center">{paiement.contrat.locataire.user.name}</div>
                      <div className="self-center">{formatMoney(paiement.montant)} MAD</div>
                      <div className="self-center">{formatShortDate(paiement.date_paiement)}</div>
                      <div className="self-center">
                        <Badge variant={toneForStatus(paiement.statut)}>{paiement.statut}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[24px] border border-black/6 bg-white p-6">
                  <div className="text-[22px] font-semibold">Record payment</div>
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
                        {contrats.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.logement.adresse} • {entry.locataire.user.name}
                          </option>
                        ))}
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
                    <Button className="w-full rounded-2xl" disabled={busy} onClick={() => void handlePaymentSubmit()}>
                      Record payment
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "tenants" ? (
              <section className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
                <div className="grid grid-cols-[minmax(0,1.2fr)_1fr_180px_140px_140px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                  <div>Tenant</div>
                  <div>Email</div>
                  <div>Active Property</div>
                  <div>Contract</div>
                  <div>Receipts</div>
                </div>
                {tenantUsers.map((entry) => {
                  const tenantContract =
                    contrats.find((contrat) => contrat.locataire.user.id === entry.id) ?? null;

                  return (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[minmax(0,1.2fr)_1fr_180px_140px_140px] gap-4 border-t border-black/6 px-7 py-5"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{entry.name}</div>
                          <div className="text-sm text-black/45">{entry.phone ?? "No phone"}</div>
                        </div>
                      </div>
                      <div className="self-center">{entry.email}</div>
                      <div className="self-center">{tenantContract?.logement.adresse ?? "None"}</div>
                      <div className="self-center">
                        <Badge variant={toneForStatus(tenantContract?.signature_status ?? "pending")}>
                          {tenantContract?.signature_status ?? "none"}
                        </Badge>
                      </div>
                      <div className="self-center">
                        <Button
                          variant="outline"
                          className="rounded-2xl"
                          onClick={() => {
                            const receipts = paiements.filter(
                              (paiement) => paiement.contrat.locataire.user.id === entry.id,
                            );
                            downloadTextFile(
                              `tenant-${entry.id}-receipts.txt`,
                              receipts
                                .map(
                                  (receipt) =>
                                    `${formatShortDate(receipt.date_paiement)} • ${formatMoney(receipt.montant)} MAD • ${receipt.statut}`,
                                )
                                .join("\n") || "No receipts",
                            );
                          }}
                        >
                          <ReceiptText className="h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </section>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
