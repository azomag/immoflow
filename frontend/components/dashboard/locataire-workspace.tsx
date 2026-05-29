"use client";

import { startTransition, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  Bath,
  BedDouble,
  Building2,
  CalendarClock,
  CarFront,
  ChevronLeft,
  CircleHelp,
  Download,
  Eye,
  FileSignature,
  Flame,
  Home,
  Layers3,
  LogOut,
  Mail,
  MapPin,
  Ruler,
  Search,
  X,
} from "lucide-react";
import { gsap } from "gsap";
import Swal from "sweetalert2";
import type { AuthenticatedUser, Contrat, Logement, NotificationRecord, Paiement, UserRecord } from "@/lib/api";
import { backendRequest } from "@/lib/api";
import { getLandingUrl } from "@/lib/app-routes";
import { downloadContractPdf, downloadReceiptPdf } from "@/lib/document-pdf";
import { AvatarMenu } from "@/components/dashboard/avatar-menu";
import { NotificationsPopover } from "@/components/dashboard/notifications-popover";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildPropertySnapshot,
  formatLongDate,
  formatMoney,
  formatShortDate,
  initials,
  propertyDisplaySubtitle,
  propertyDisplayTitle,
  type PropertySnapshot,
  toneForStatus,
} from "@/components/dashboard/workspace-utils";

type LocataireWorkspaceProps = {
  token: string;
  user: AuthenticatedUser;
  logements: Logement[];
  contrats: Contrat[];
  paiements: Paiement[];
  users: UserRecord[];
  notifications: NotificationRecord[];
  reload: () => Promise<void>;
  initialTab?: TenantTab;
};

type TenantTab = "dashboard" | "properties" | "documents" | "payments" | "notifications" | "profile";

function sortByNewest<T extends { date_paiement?: string; date_debut?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftDate = new Date(left.date_paiement ?? left.date_debut ?? 0).getTime();
    const rightDate = new Date(right.date_paiement ?? right.date_debut ?? 0).getTime();
    return rightDate - leftDate;
  });
}

export function LocataireWorkspace({
  token,
  user,
  logements,
  contrats,
  paiements,
  users,
  notifications,
  reload,
  initialTab,
}: LocataireWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TenantTab>(initialTab ?? "dashboard");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [propertySearch, setPropertySearch] = useState("");
  const [contractDetailsOpen, setContractDetailsOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const sortedContracts = useMemo(() => sortByNewest(contrats), [contrats]);
  const sortedPayments = useMemo(() => sortByNewest(paiements), [paiements]);

  const activeContract =
    sortedContracts.find(
      (contrat) =>
        contrat.statut.toLowerCase() === "active" &&
        contrat.signature_status.toLowerCase() === "signed",
    ) ?? null;

  const pendingContract =
    sortedContracts.find((contrat) => contrat.signature_status.toLowerCase() === "pending") ?? null;

  const currentResidence =
    logements.find((logement) => logement.id === activeContract?.logement.id) ?? null;
  const documentContract = activeContract ?? pendingContract;
  const documentProperty =
    logements.find((logement) => logement.id === documentContract?.logement.id) ?? currentResidence;
  const highlightedResidence = currentResidence ?? documentProperty;
  const tenantPropertyIds = useMemo(
    () => new Set(contrats.map((contrat) => contrat.logement.id)),
    [contrats],
  );
  const propertySnapshots = useMemo(
    () => logements
      .filter((logement) => tenantPropertyIds.has(logement.id))
      .map((logement) => buildPropertySnapshot(logement, contrats, paiements)),
    [contrats, logements, paiements, tenantPropertyIds],
  );
  const selectedProperty =
    propertySnapshots.find((snapshot) => snapshot.logement.id === selectedPropertyId) ?? null;

  const visibleProperties = useMemo(() => {
    const search = propertySearch.trim().toLowerCase();

    return [...propertySnapshots]
      .sort((left, right) => right.logement.id - left.logement.id)
      .filter((property) => {
        const logement = property.logement;
        if (!search) {
          return true;
        }

        return [
          propertyDisplayTitle(logement),
          propertyDisplaySubtitle(logement),
          logement.adresse,
          logement.commune?.nom,
          logement.type_logement?.nom_type,
          logement.loyer,
          logement.statut_publication,
          property.status,
          property.ref,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
      });
  }, [propertySearch, propertySnapshots]);

  const dashboardProperties = visibleProperties.slice(0, 6);

  const latestPayment = sortedPayments[0] ?? null;
  const pendingPayment =
    sortedPayments.find((paiement) => ["pending", "awaiting_tenant_approval"].includes(paiement.statut.toLowerCase())) ?? null;
  const tenantTabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "properties", label: "Properties" },
    { id: "documents", label: "Documents" },
    { id: "payments", label: "Payments" },
    { id: "notifications", label: "Messages" },
    { id: "profile", label: "Profile" },
  ] as const;

  function openPropertyDetails(logementId: number) {
    setSelectedPropertyId(logementId);
    setActiveTab("properties");
  }

  useEffect(() => {
    if (!pageRef.current) {
      return;
    }

    gsap.fromTo(
      pageRef.current.querySelectorAll("[data-animate='section']"),
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.36, ease: "power2.out", stagger: 0.04 },
    );
  }, [activeTab]);

  useEffect(() => {
    if (!signatureOpen) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.scale(ratio, ratio);
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.strokeStyle = "#171411";
    context.clearRect(0, 0, rect.width, rect.height);
    setSignatureEmpty(true);
  }, [signatureOpen]);

  async function runMutation(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    let actionCompleted = false;

    try {
      await action();
      actionCompleted = true;
      await reload();
    } catch (mutationError) {
      if (actionCompleted) {
        setNotice((current) => current ?? "Saved. Data refresh is taking longer, please refresh once.");
        return;
      }

      setError(mutationError instanceof Error ? mutationError.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  function getCanvasPoint(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  async function beginSignatureFlow() {
    if (!pendingContract) {
      setError("No pending contract to sign.");
      return;
    }

    const first = await Swal.fire({
      title: "Read before signing",
      text: "A signature validates this rental contract in your tenant account.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "I understand",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#171411",
    });
    if (!first.isConfirmed) return;

    const second = await Swal.fire({
      title: "Check the property",
      text: `You are signing for ${pendingContract.logement.adresse}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Property is correct",
      cancelButtonText: "Go back",
      confirmButtonColor: "#171411",
    });
    if (!second.isConfirmed) return;

    const third = await Swal.fire({
      title: "Final confirmation",
      text: "Next step opens a signature pad. Draw your signature with your mouse, pen, or finger.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Open signature pad",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#171411",
    });
    if (third.isConfirmed) {
      setSignatureOpen(true);
    }
  }

  async function handleSignContract() {
    if (!pendingContract || !canvasRef.current) {
      setError("No pending contract to sign.");
      return;
    }

    if (signatureEmpty) {
      await Swal.fire({
        title: "Signature required",
        text: "Please draw your signature before confirming the contract.",
        icon: "error",
        confirmButtonColor: "#171411",
      });
      return;
    }

    const signatureData = canvasRef.current.toDataURL("image/png");

    await runMutation(async () => {
      await backendRequest(`/api/contrats/${pendingContract.id}/sign`, {
        method: "POST",
        body: JSON.stringify({ signature_data: signatureData }),
      }, token);
      setSignatureOpen(false);
      setNotice("Contract signed.");
      await Swal.fire({
        title: "Contract signed",
        text: "Your signature was saved on the contract.",
        icon: "success",
        confirmButtonColor: "#171411",
      });
    });
  }

  async function handleApprovePayment(payment: Paiement) {
    const result = await Swal.fire({
      title: "Approve payment?",
      text: `Confirm that you recognize this ${formatMoney(payment.montant)} MAD payment.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve payment",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#171411",
    });

    if (!result.isConfirmed) {
      return;
    }

    await runMutation(async () => {
      await backendRequest(`/api/paiements/${payment.id}/approve`, {
        method: "PATCH",
      }, token);
      setNotice("Payment approved.");
    });
  }

  function handleReceiptDownload(payment: Paiement) {
    downloadReceiptPdf(payment);
  }

  function handleDocumentDownload() {
    const targetContract = documentContract;
    if (!targetContract) {
      setError("No contract available.");
      return;
    }

    downloadContractPdf(targetContract, documentProperty);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="glass sticky top-0 z-40 border-b border-[var(--border)]">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="flex h-13 w-13 items-center justify-center overflow-hidden ">
                                <Image src="/assets/profile/logo/immoflow-logo.png" alt="ImmoFlow logo" width={100} height={100} className="h-full w-full object-contain" />
                              </div>
            </div>

            <nav className="hidden items-center gap-8 md:flex">
              {tenantTabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as TenantTab)}
                  className={`text-[15px] font-medium transition-colors ${activeTab === item.id ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher compact />
            <a
              href={getLandingUrl()}
              className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:border-[var(--border-strong)] sm:flex"
            >
              <Home className="h-4 w-4" />
              Landing page
            </a>
            <NotificationsPopover
              token={token}
              userId={user.id}
              notifications={notifications}
            />
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[var(--border)] text-[var(--muted-foreground)] shadow-[var(--shadow-sm)] transition hover:text-[var(--foreground)] hover:border-[var(--border-strong)]">
              <CircleHelp className="h-4 w-4" />
            </button>
            <AvatarMenu user={user} onProfile={() => setActiveTab("profile")} />
          </div>
        </div>
        <nav className="scrollbar-hide flex gap-2 overflow-x-auto border-t border-[var(--border)] px-4 py-2 md:hidden">
          {tenantTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === item.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-white text-[var(--muted-foreground)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main ref={pageRef} className="mx-auto max-w-[1440px] px-6 py-10 md:px-8">
        {error ? (
          <div className="mb-6 rounded-2xl bg-[rgba(186,74,69,0.12)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="mb-6 rounded-2xl bg-[rgba(47,143,98,0.12)] px-4 py-3 text-sm text-[var(--success)]">
            {notice}
          </div>
        ) : null}

        {activeTab === "dashboard" ? (
          <div className="space-y-10" data-animate="section">
            <div className="flex items-center justify-between rounded-[28px] border border-[#f0e2be] bg-[#fffaf0] px-6 py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffefcc] text-[#d28a1e]">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div className="text-[17px]">
                  {pendingPayment
                    ? `A payment of ${formatMoney(pendingPayment.montant)} MAD is pending.`
                    : activeContract
                      ? `Your rent of ${formatMoney(activeContract.montant)} MAD is active.`
                      : "Your account is ready. No active billing notice right now."}
                </div>
              </div>
              {pendingContract ? (
                <Button className="rounded-2xl" disabled={busy} onClick={() => void beginSignatureFlow()}>
                  <FileSignature className="h-4 w-4" />
                  Sign now
                </Button>
              ) : null}
            </div>

            <div>
              <div className="mb-5 inline-flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-3 py-2 shadow-[var(--shadow-sm)]">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-semibold text-[var(--foreground)]">{user.name}</div>
                  <div className="text-[var(--muted-foreground)]">Tenant account</div>
                </div>
              </div>
              <h1 className="text-[48px] md:text-[62px] font-bold tracking-tight text-[var(--foreground)]">Good morning, {user.name.split(" ")[0]}.</h1>
              <p className="mt-4 max-w-3xl text-[18px] leading-8 text-[var(--muted-foreground)]">
                {currentResidence
                  ? `Everything looks in order with your residence at ${currentResidence.adresse}.`
                  : "Your tenant portal is connected and ready for contracts, payments, and documents."}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-sm)] card-lift">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">My Contract</div>
                <div className="mt-8">
                  <Badge variant={toneForStatus(activeContract?.statut ?? pendingContract?.signature_status ?? "pending")} className="text-base px-3 py-1">
                    {activeContract ? "Active" : pendingContract ? "Pending signature" : "No contract"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-sm)] card-lift">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Last Payment</div>
                <div className="mt-8 text-[52px] font-bold tracking-tight text-[var(--foreground)]">
                  {latestPayment ? formatMoney(latestPayment.montant) : "0"}
                  <span className="ml-2 text-[22px] font-medium text-[var(--muted-foreground)]">MAD</span>
                </div>
              </div>

              <div className="rounded-3xl stat-indigo p-7 shadow-[var(--shadow-primary)] card-lift">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Next Due</div>
                <div className="mt-8 text-[48px] font-bold tracking-tight">
                  {formatShortDate(pendingPayment?.date_paiement ?? latestPayment?.date_paiement ?? null, "--")}
                </div>
              </div>
            </div>

            <section data-animate="section">
              <div className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Current Residence</div>
              <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">
                <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)_80px] md:items-center">
                  <PropertyImage logement={highlightedResidence} className="min-h-[155px]" />
                  <div>
                    <div className="text-[19px] font-bold text-[var(--foreground)]">
                      {highlightedResidence?.adresse ?? activeContract?.logement.adresse ?? "No active residence"}
                    </div>
                    <div className="mt-2 text-[15px] text-[var(--muted-foreground)]">
                      {highlightedResidence
                        ? `${highlightedResidence.commune.nom}, ${highlightedResidence.type_logement.nom_type}`
                        : "The dashboard will update automatically once a property is attached to your contract."}
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-6 text-[14px] font-medium">
                      <button type="button" className="text-[var(--primary)] hover:underline underline-offset-4" onClick={() => setContractDetailsOpen(true)}>
                        View contract
                      </button>
                      <button
                        type="button"
                        className="text-[var(--primary)] hover:underline underline-offset-4"
                        onClick={() => highlightedResidence && openPropertyDetails(highlightedResidence.id)}
                        disabled={!highlightedResidence}
                      >
                        View property
                      </button>
                      {activeContract ? (
                        <button
                          type="button"
                          className="text-[var(--primary)] hover:underline underline-offset-4"
                          onClick={() => {
                            window.location.href = `mailto:${activeContract.agent.user.email}`;
                          }}
                        >
                          Contact landlord
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-center text-5xl text-[var(--muted-foreground)] opacity-20">⌂</div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Available Properties</div>
                  <div className="mt-1 text-sm text-[var(--muted-foreground)]">{logements.length} properties loaded from the agency catalog.</div>
                </div>
                <Button variant="outline" className="rounded-2xl" onClick={() => setActiveTab("properties")}>
                  <Building2 className="h-4 w-4" />
                  View all
                </Button>
              </div>

              {dashboardProperties.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {dashboardProperties.map((logement) => (
                    <PropertyCard
                      key={logement.logement.id}
                      property={logement}
                      onOpen={() => openPropertyDetails(logement.logement.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No properties found"
                  description="Properties created by agents will appear here once the catalog is available."
                />
              )}
            </section>

            <section>
              <div className="mb-5 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Payment History</div>
                <button type="button" className="text-[14px] font-semibold text-[var(--primary)] hover:underline underline-offset-4" onClick={() => setActiveTab("payments")}>
                  Open all
                </button>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-[180px_1fr_180px_160px_90px] gap-4 bg-[var(--muted)] px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    <div>Date</div>
                    <div>Reference</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div>Receipt</div>
                  </div>
                  {sortedPayments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="table-row-hover grid grid-cols-[180px_1fr_180px_160px_90px] gap-4 border-t border-[var(--border)] px-7 py-4 transition-colors"
                    >
                      <div className="self-center text-sm font-medium text-[var(--muted-foreground)]">{formatShortDate(payment.date_paiement)}</div>
                      <div className="self-center text-[15px] font-medium text-[var(--foreground)]">
                        RENT-{new Date(payment.date_paiement).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }).toUpperCase()}
                      </div>
                      <div className="self-center text-[15px] font-bold text-[var(--foreground)]">
                        {formatMoney(payment.montant)} MAD
                      </div>
                      <div className="self-center">
                        <Badge variant={toneForStatus(payment.statut)}>{payment.statut}</Badge>
                      </div>
                      <div className="self-center text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
                        <button type="button" onClick={() => handleReceiptDownload(payment)}>
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <footer className="flex flex-col gap-4 border-t border-black/6 pt-8 text-sm text-black/45 md:flex-row md:items-center md:justify-between">
              <div>© 2024 ImmoFlow Real Estate SaaS. All rights reserved.</div>
              <div className="flex items-center gap-8">
                <span>Terms</span>
                <span>Privacy</span>
                <span>Support</span>
                <button
                  type="button"
                  className="flex items-center gap-2 text-black/70"
                  onClick={() => startTransition(() => void signOut({ callbackUrl: "/login" }))}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </footer>
          </div>
        ) : null}

        {activeTab === "properties" && !selectedProperty ? (
          <div className="space-y-6" data-animate="section">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-[36px] font-semibold tracking-tight">Properties</h1>
                <p className="mt-2 max-w-2xl text-black/55">
                  Browse every property loaded for your tenant account and open details before contacting the assigned agent.
                </p>
              </div>
              <div className="relative w-full lg:w-[360px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  value={propertySearch}
                  onChange={(event) => setPropertySearch(event.target.value)}
                  className="pl-11"
                  placeholder="Search address, city, type..."
                />
              </div>
            </div>

            {visibleProperties.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleProperties.map((logement) => (
                  <PropertyCard
                    key={logement.logement.id}
                    property={logement}
                    onOpen={() => openPropertyDetails(logement.logement.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No matching properties"
                description="Try another search term or clear the search field."
              />
            )}
          </div>
        ) : null}

        {activeTab === "properties" && selectedProperty ? (
          <PropertyDetailPage
            property={selectedProperty}
            onBack={() => setSelectedPropertyId(null)}
            onContactAgent={() => {
              window.location.href = `mailto:${selectedProperty.logement.agent.user.email}`;
            }}
          />
        ) : null}

        {activeTab === "documents" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" data-animate="section">
            <div className="rounded-[28px] border border-black/6 bg-white p-7">
              <div className="text-[32px] font-semibold tracking-tight">Contract documents</div>
              <div className="mt-6 space-y-5">
                {(activeContract ?? pendingContract) ? (
                  <>
                    <div className="rounded-[24px] bg-[#faf7f1] p-5">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">Contract summary</div>
                      <div className="mt-4 space-y-3 text-[16px]">
                        <div className="flex items-center justify-between">
                          <span className="text-black/55">Property</span>
                          <span className="font-semibold">{(activeContract ?? pendingContract)?.logement.adresse}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-black/55">Agent</span>
                          <span className="font-semibold">{(activeContract ?? pendingContract)?.agent.user.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-black/55">Start</span>
                          <span className="font-semibold">{formatLongDate((activeContract ?? pendingContract)?.date_debut ?? null)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-black/55">End</span>
                          <span className="font-semibold">{formatLongDate((activeContract ?? pendingContract)?.date_fin ?? null, "Open")}</span>
                        </div>
                      </div>
                    </div>

                    <Button className="rounded-2xl" onClick={handleDocumentDownload}>
                      <Download className="h-4 w-4" />
                      Download contract PDF
                    </Button>
                    <Button variant="outline" className="ml-3 rounded-2xl" onClick={() => setContractDetailsOpen(true)}>
                      <Eye className="h-4 w-4" />
                      Details
                    </Button>
                  </>
                ) : (
                  <div className="rounded-[24px] bg-[#faf7f1] p-5 text-black/55">
                    No contract has been assigned to this account yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-black/6 bg-white p-7">
              <div className="text-[24px] font-semibold">Actions</div>
              <div className="mt-6 space-y-3">
                {pendingContract ? (
                  <Button className="w-full rounded-2xl" disabled={busy} onClick={() => void beginSignatureFlow()}>
                    <FileSignature className="h-4 w-4" />
                    Sign pending contract
                  </Button>
                ) : null}
                <Button variant="outline" className="w-full rounded-2xl" onClick={() => setActiveTab("payments")}>
                  <Download className="h-4 w-4" />
                  View receipts
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "payments" ? (
          <div className="space-y-6" data-animate="section">
            <div>
              <h1 className="text-[36px] font-semibold tracking-tight">Payments</h1>
              <p className="mt-2 text-black/55">All receipts and rent operations tied to your active account.</p>
            </div>

            <div className="overflow-x-auto rounded-[28px] border border-black/6 bg-white">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[160px_1fr_170px_140px_140px_170px] gap-4 bg-[#fafafa] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                  <div>Date</div>
                  <div>Property</div>
                  <div>Amount</div>
                  <div>Mode</div>
                  <div>Status</div>
                  <div>Action</div>
                </div>
                {sortedPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="grid grid-cols-[160px_1fr_170px_140px_140px_170px] gap-4 border-t border-black/6 px-7 py-5"
                  >
                    <div className="self-center">{formatShortDate(payment.date_paiement)}</div>
                    <div className="self-center">{payment.contrat.logement.adresse}</div>
                    <div className="self-center font-semibold">{formatMoney(payment.montant)} MAD</div>
                    <div className="self-center">{payment.mode}</div>
                    <div className="self-center">
                      <Badge variant={toneForStatus(payment.statut)}>{payment.statut}</Badge>
                    </div>
                    <div className="flex items-center gap-3 self-center">
                      {payment.statut === "awaiting_tenant_approval" ? (
                        <Button className="h-9 rounded-xl px-3 text-xs" disabled={busy} onClick={() => void handleApprovePayment(payment)}>
                          Approve
                        </Button>
                      ) : null}
                      <button type="button" onClick={() => handleReceiptDownload(payment)}>
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "notifications" ? (
          <NotificationsPanel
            token={token}
            user={user}
            users={users}
          />
        ) : null}

        {activeTab === "profile" ? (
          <ProfilePanel token={token} user={user} onSaved={reload} />
        ) : null}
      </main>
      {contractDetailsOpen ? (
        <TenantModal title="Contract details" onClose={() => setContractDetailsOpen(false)}>
          {documentContract ? (
            <div className="space-y-5">
              <div className="rounded-[22px] bg-[#faf7f1] p-5">
                <DetailRow label="Property" value={documentContract.logement.adresse} />
                <DetailRow label="Tenant" value={documentContract.locataire.user.name} />
                <DetailRow label="Agent" value={documentContract.agent.user.name} />
                <DetailRow label="Start" value={formatLongDate(documentContract.date_debut)} />
                <DetailRow label="End" value={formatLongDate(documentContract.date_fin, "Open")} />
                <DetailRow label="Rent" value={`${formatMoney(documentContract.montant)} MAD`} />
                <DetailRow label="Status" value={documentContract.signature_status} />
              </div>
              {documentContract.signature_data ? (
                <div>
                  <div className="mb-2 text-sm font-semibold text-black/55">Saved signature</div>
                  <img src={documentContract.signature_data} alt="Tenant signature" className="h-24 rounded-2xl border border-black/10 bg-white object-contain p-3" />
                </div>
              ) : null}
              <Button className="rounded-2xl" onClick={handleDocumentDownload}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          ) : (
            <div className="text-black/55">No contract available.</div>
          )}
        </TenantModal>
      ) : null}
      {signatureOpen ? (
        <TenantModal title="Draw your signature" onClose={() => setSignatureOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm leading-6 text-black/55">
              Use your mouse, pen, or finger. This signature will be stored on the contract and printed in the PDF.
            </p>
            <canvas
              ref={canvasRef}
              className="h-52 w-full touch-none rounded-[20px] border border-black/10 bg-[#fbfbfa]"
              onPointerDown={(event) => {
                const context = event.currentTarget.getContext("2d");
                const point = getCanvasPoint(event);
                drawingRef.current = true;
                context?.beginPath();
                context?.moveTo(point.x, point.y);
              }}
              onPointerMove={(event) => {
                if (!drawingRef.current) return;
                const context = event.currentTarget.getContext("2d");
                const point = getCanvasPoint(event);
                context?.lineTo(point.x, point.y);
                context?.stroke();
                setSignatureEmpty(false);
              }}
              onPointerUp={() => {
                drawingRef.current = false;
              }}
              onPointerLeave={() => {
                drawingRef.current = false;
              }}
            />
            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => {
                  const canvas = canvasRef.current;
                  const context = canvas?.getContext("2d");
                  if (canvas && context) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    setSignatureEmpty(true);
                  }
                }}
              >
                Clear
              </Button>
              <Button className="rounded-2xl" disabled={busy} onClick={() => void handleSignContract()}>
                Confirm signature
              </Button>
            </div>
          </div>
        </TenantModal>
      ) : null}
    </div>
  );
}

function PropertyImage({ logement, className = "" }: { logement: Logement | null; className?: string }) {
  const image = logement?.images?.[0];

  return (
    <div className={`overflow-hidden rounded-2xl bg-[#f6f6f4] ${className}`}>
      {image && logement ? (
        <img src={image} alt={logement.adresse} className="h-full min-h-[155px] w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-[155px] items-center justify-center text-black/35">
          <Home className="h-10 w-10" />
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property, onOpen }: { property: PropertySnapshot; onOpen: () => void }) {
  const { logement } = property;

  return (
    <article className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)] card-lift">
      <PropertyImage logement={logement} className="h-48 rounded-none" />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-[var(--foreground)]">{propertyDisplayTitle(logement)}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{propertyDisplaySubtitle(logement) || logement.commune.nom}</span>
            </div>
          </div>
          <Badge variant={toneForStatus(property.status)}>{property.status}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-2xl bg-[var(--muted)] px-3 py-2">
            <div className="font-bold">{formatMoney(logement.loyer)}</div>
            <div className="text-xs text-[var(--muted-foreground)]">MAD/mo</div>
          </div>
          <div className="rounded-2xl bg-[var(--muted)] px-3 py-2">
            <div className="flex items-center gap-1 font-bold"><BedDouble className="h-3.5 w-3.5" />{logement.chambres ?? "-"}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Beds</div>
          </div>
          <div className="rounded-2xl bg-[var(--muted)] px-3 py-2">
            <div className="flex items-center gap-1 font-bold"><Bath className="h-3.5 w-3.5" />{logement.salles_bain ?? "-"}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Baths</div>
          </div>
        </div>

        <Button variant="outline" className="w-full rounded-2xl" onClick={onOpen}>
          <Eye className="h-4 w-4" />
          View details
        </Button>
      </div>
    </article>
  );
}

function PropertyDetailPage({
  property,
  onBack,
  onContactAgent,
}: {
  property: PropertySnapshot;
  onBack: () => void;
  onContactAgent: () => void;
}) {
  const contract = property.activeContract ?? property.latestContract;

  return (
    <section className="space-y-6" data-animate="section">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to properties
      </button>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 max-w-4xl">
          <h1 className="line-clamp-2 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            {propertyDisplayTitle(property.logement)}
          </h1>
          {propertyDisplaySubtitle(property.logement) ? (
            <p className="mt-2 line-clamp-2 max-w-3xl text-sm font-medium leading-6 text-[var(--muted-foreground)]">
              {propertyDisplaySubtitle(property.logement)}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--muted-foreground)]">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[var(--foreground)]">
              {property.logement.type_logement.nom_type}
            </span>
            <span>Ref: {property.ref}</span>
          </div>
        </div>

        <Button variant="outline" className="rounded-xl bg-white shadow-sm" onClick={onContactAgent}>
          <Mail className="mr-2 h-4 w-4" />
          Contact Agent
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <div className="group relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-slate-100 shadow-sm">
            <div className="aspect-[16/9] w-full md:aspect-[21/9]">
              {property.logement.images?.[0] ? (
                <img
                  src={property.logement.images[0]}
                  alt={property.logement.adresse}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">No image available</div>
              )}
            </div>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <div className="pointer-events-none absolute bottom-6 left-6 text-white">
              <Badge variant={toneForStatus(property.status)} className="mb-3 shadow-lg">{property.status}</Badge>
              <div className="text-3xl font-bold tracking-tight">{property.logement.type_logement.nom_type}</div>
              <div className="mt-1 text-white/75">Ref: {property.ref}</div>
            </div>
          </div>

          {property.logement.images && property.logement.images.length > 1 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {property.logement.images.slice(1, 5).map((image, idx) => (
                <div
                  key={`${image}-${idx}`}
                  className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border)] shadow-sm"
                >
                  <img src={image} className="h-full w-full object-cover" alt="Property view" />
                  {idx === 3 && property.logement.images!.length > 5 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white backdrop-blur-sm">
                      +{property.logement.images!.length - 5}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard label="Area" value={`${property.logement.superficie} m²`} />
            <MetricCard label="Rent" value={`${formatMoney(property.logement.loyer)} MAD`} />
            <MetricCard label="Payments" value={String(property.paymentCount)} />
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Status</div>
              <div className="mt-2">
                <Badge variant={toneForStatus(property.status)}>{property.status}</Badge>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">Property Details</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Bedrooms", value: property.logement.chambres ?? "Not set", icon: BedDouble },
                { label: "Bathrooms", value: property.logement.salles_bain ?? "Not set", icon: Bath },
                { label: "Floor", value: property.logement.etage ?? "Not set", icon: Layers3 },
                { label: "Heating", value: property.logement.chauffage ?? "Not set", icon: Flame },
                { label: "Area", value: `${property.logement.superficie} m²`, icon: Ruler },
                { label: "Parking", value: property.logement.parking ? "Included" : "None", icon: CarFront },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-slate-50/50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[var(--primary)] shadow-sm">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{item.label}</div>
                    <div className="text-sm font-semibold text-[var(--foreground)]">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-[var(--border)] bg-slate-50/50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Description</div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">
                {property.logement.description || "No detailed description provided for this property."}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-slate-900 p-6 text-white shadow-lg">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Monthly Rent</div>
            <div className="mt-2 text-4xl font-bold tracking-tight">
              {formatMoney(property.logement.loyer)}
              <span className="ml-2 text-lg font-medium text-white/60">MAD</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Assigned Agent</div>
            <div className="mt-4 flex items-center gap-4">
              <Avatar className="h-14 w-14 border border-[var(--border)]">
                <AvatarFallback className="text-lg">{initials(property.logement.agent.user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-lg font-bold text-[var(--foreground)]">{property.logement.agent.user.name}</div>
                <div className="truncate text-sm text-[var(--muted-foreground)]">{property.logement.agent.user.email}</div>
              </div>
            </div>
            <Button variant="outline" className="mt-5 w-full rounded-xl" onClick={onContactAgent}>
              <Mail className="mr-2 h-4 w-4" />
              Contact Agent
            </Button>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Contract Details</div>
              {property.activeContract ? <Badge variant="success" className="shadow-sm">Active</Badge> : null}
            </div>

            {contract ? (
              <div className="space-y-3 text-sm">
                <DetailRow label="Tenant" value={contract.locataire.user.name} />
                <DetailRow label="Starts" value={formatShortDate(contract.date_debut)} />
                <DetailRow label="Ends" value={formatShortDate(contract.date_fin, "Open")} />
                <DetailRow label="Signature" value={contract.signature_status} />
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-[var(--muted-foreground)]">
                No active lease agreement for this property.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-1 text-xl font-bold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[var(--border-strong)] bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
        <Building2 className="h-6 w-6" />
      </div>
      <div className="mt-4 text-lg font-semibold text-[var(--foreground)]">{title}</div>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}

function TenantModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-black/8 px-6 py-4">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button type="button" className="rounded-full p-2 text-black/55 transition hover:bg-black/5" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-76px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/8 py-3 last:border-b-0">
      <span className="text-black/55">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
