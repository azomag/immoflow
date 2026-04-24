"use client";

import { startTransition, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import {
  Bell,
  CalendarClock,
  CircleHelp,
  Download,
  FileSignature,
  LogOut,
} from "lucide-react";
import type { AuthenticatedUser, Contrat, Logement, Paiement } from "@/lib/api";
import { backendRequest } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  downloadTextFile,
  formatLongDate,
  formatMoney,
  formatShortDate,
  initials,
  toneForStatus,
} from "@/components/dashboard/workspace-utils";

type LocataireWorkspaceProps = {
  token: string;
  user: AuthenticatedUser;
  logements: Logement[];
  contrats: Contrat[];
  paiements: Paiement[];
  reload: () => Promise<void>;
};

type TenantTab = "dashboard" | "documents" | "payments";

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
  reload,
}: LocataireWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TenantTab>("dashboard");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const latestPayment = sortedPayments[0] ?? null;
  const pendingPayment =
    sortedPayments.find((paiement) => paiement.statut.toLowerCase() === "pending") ?? null;

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

  async function handleSignContract() {
    if (!pendingContract) {
      setError("No pending contract to sign.");
      return;
    }

    await runMutation(async () => {
      await backendRequest(`/api/contrats/${pendingContract.id}/sign`, {
        method: "POST",
      }, token);
      setNotice("Contract signed.");
    });
  }

  function handleReceiptDownload(payment: Paiement) {
    downloadTextFile(
      `receipt-${payment.id}.txt`,
      [
        "ImmoFlow Receipt",
        `Payment ID: ${payment.id}`,
        `Property: ${payment.contrat.logement.adresse}`,
        `Date: ${formatLongDate(payment.date_paiement)}`,
        `Amount: ${formatMoney(payment.montant)} MAD`,
        `Mode: ${payment.mode}`,
        `Status: ${payment.statut}`,
      ].join("\n"),
    );
  }

  function handleDocumentDownload() {
    const targetContract = activeContract ?? pendingContract;
    if (!targetContract) {
      setError("No contract available.");
      return;
    }

    downloadTextFile(
      `contract-${targetContract.id}.txt`,
      [
        "ImmoFlow Contract Summary",
        `Contract ID: ${targetContract.id}`,
        `Property: ${targetContract.logement.adresse}`,
        `Agent: ${targetContract.agent.user.name}`,
        `Tenant: ${targetContract.locataire.user.name}`,
        `Start: ${formatLongDate(targetContract.date_debut)}`,
        `End: ${formatLongDate(targetContract.date_fin, "Open")}`,
        `Amount: ${formatMoney(targetContract.montant)} MAD`,
        `Signature status: ${targetContract.signature_status}`,
      ].join("\n"),
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#171411]">
      <header className="border-b border-black/6">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 md:px-8">
          <div className="flex items-center gap-10">
            <div>
              <div className="text-[18px] font-bold tracking-tight">ImmoFlow</div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/25">
                Real Estate SaaS
              </div>
            </div>

            <nav className="hidden items-center gap-10 md:flex">
              {[
                { id: "dashboard", label: "Dashboard" },
                { id: "documents", label: "Documents" },
                { id: "payments", label: "Payments" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as TenantTab)}
                  className={`text-[15px] ${activeTab === item.id ? "font-semibold text-black" : "text-black/55"}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button type="button" className="rounded-full p-2 text-black/55 transition hover:bg-black/5">
              <Bell className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-full p-2 text-black/55 transition hover:bg-black/5">
              <CircleHelp className="h-5 w-5" />
            </button>
            <Avatar className="h-12 w-12 border border-black/8">
              <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-10 md:px-8">
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
          <div className="space-y-10">
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
                <Button className="rounded-2xl" disabled={busy} onClick={() => void handleSignContract()}>
                  <FileSignature className="h-4 w-4" />
                  Sign now
                </Button>
              ) : null}
            </div>

            <div>
              <h1 className="text-[62px] font-semibold tracking-tight">Good morning, {user.name.split(" ")[0]}.</h1>
              <p className="mt-4 max-w-3xl text-[18px] leading-8 text-black/65">
                {currentResidence
                  ? `Everything looks in order with your residence at ${currentResidence.adresse}.`
                  : "Your tenant portal is connected and ready for contracts, payments, and documents."}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-[28px] border border-black/6 bg-white p-7">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">My Contract</div>
                <div className="mt-8">
                  <Badge variant={toneForStatus(activeContract?.statut ?? pendingContract?.signature_status ?? "pending")}>
                    {activeContract ? "Active" : pendingContract ? "Pending signature" : "No contract"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/6 bg-white p-7">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">Last Payment</div>
                <div className="mt-8 text-[52px] font-semibold tracking-tight">
                  {latestPayment ? formatMoney(latestPayment.montant) : "0"}
                  <span className="ml-2 text-[22px] font-medium">MAD</span>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/6 bg-white p-7">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">Next Due</div>
                <div className="mt-8 text-[52px] font-semibold tracking-tight">
                  {formatShortDate(pendingPayment?.date_paiement ?? latestPayment?.date_paiement ?? null, "--")}
                </div>
              </div>
            </div>

            <section>
              <div className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-black/35">Current Residence</div>
              <div className="rounded-[28px] border border-black/6 bg-white p-6">
                <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)_80px] md:items-center">
                  <div className="min-h-[155px] rounded-[20px] bg-[radial-gradient(circle_at_20%_18%,#f0e3c9,transparent_22%),linear-gradient(135deg,#2d78bf,#c3d8ec_65%,#ede4d2)]" />
                  <div>
                    <div className="text-[19px] font-semibold">
                      {currentResidence?.adresse ?? activeContract?.logement.adresse ?? "No active residence"}
                    </div>
                    <div className="mt-2 text-[17px] text-black/60">
                      {currentResidence
                        ? `${currentResidence.commune.nom}, ${currentResidence.type_logement.nom_type}`
                        : "The dashboard will update automatically once a property is attached to your contract."}
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-6 text-[15px]">
                      <button type="button" className="underline underline-offset-4" onClick={handleDocumentDownload}>
                        View contract
                      </button>
                      {activeContract ? (
                        <button
                          type="button"
                          className="underline underline-offset-4"
                          onClick={() => {
                            window.location.href = `mailto:${activeContract.agent.user.email}`;
                          }}
                        >
                          Contact landlord
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-center text-5xl text-black/8">⌂</div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">Payment History</div>
                <button type="button" className="text-[15px] font-medium" onClick={() => setActiveTab("payments")}>
                  Open all
                </button>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-black/6 bg-white">
                <div className="grid grid-cols-[180px_1fr_180px_160px_90px] gap-4 bg-[#fafafa] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                  <div>Date</div>
                  <div>Reference</div>
                  <div>Amount</div>
                  <div>Status</div>
                  <div>Receipt</div>
                </div>
                {sortedPayments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="grid grid-cols-[180px_1fr_180px_160px_90px] gap-4 border-t border-black/6 px-7 py-5"
                  >
                    <div className="self-center text-[15px]">{formatShortDate(payment.date_paiement)}</div>
                    <div className="self-center text-[17px] font-medium">
                      RENT-{new Date(payment.date_paiement).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }).toUpperCase()}
                    </div>
                    <div className="self-center text-[17px] font-semibold">
                      {formatMoney(payment.montant)} MAD
                    </div>
                    <div className="self-center">
                      <Badge variant={toneForStatus(payment.statut)}>{payment.statut}</Badge>
                    </div>
                    <div className="self-center">
                      <button type="button" onClick={() => handleReceiptDownload(payment)}>
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
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

        {activeTab === "documents" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
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
                      Download contract summary
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
                  <Button className="w-full rounded-2xl" disabled={busy} onClick={() => void handleSignContract()}>
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
          <div className="space-y-6">
            <div>
              <h1 className="text-[36px] font-semibold tracking-tight">Payments</h1>
              <p className="mt-2 text-black/55">All receipts and rent operations tied to your active account.</p>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-black/6 bg-white">
              <div className="grid grid-cols-[160px_1fr_170px_140px_140px_90px] gap-4 bg-[#fafafa] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                <div>Date</div>
                <div>Property</div>
                <div>Amount</div>
                <div>Mode</div>
                <div>Status</div>
                <div>Receipt</div>
              </div>
              {sortedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="grid grid-cols-[160px_1fr_170px_140px_140px_90px] gap-4 border-t border-black/6 px-7 py-5"
                >
                  <div className="self-center">{formatShortDate(payment.date_paiement)}</div>
                  <div className="self-center">{payment.contrat.logement.adresse}</div>
                  <div className="self-center font-semibold">{formatMoney(payment.montant)} MAD</div>
                  <div className="self-center">{payment.mode}</div>
                  <div className="self-center">
                    <Badge variant={toneForStatus(payment.statut)}>{payment.statut}</Badge>
                  </div>
                  <div className="self-center">
                    <button type="button" onClick={() => handleReceiptDownload(payment)}>
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
