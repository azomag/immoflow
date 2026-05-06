import { jsPDF } from "jspdf";
import type { Contrat, Logement, Paiement } from "@/lib/api";

type InvoiceInput = {
  ref: string;
  logement: Logement;
  contract: Contrat;
  payments?: Paiement[];
  issuerName: string;
  issuerEmail: string;
};

const LOGO_PATH = "/assets/profile/logo/immoflow-logo.png";

function money(value: number | string): string {
  const amount = typeof value === "number" ? value : Number.parseFloat(value || "0");
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
}

function shortDate(value: string | null): string {
  if (!value) return "Open";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function downloadInvoicePdf({
  ref,
  logement,
  contract,
  payments = [],
  issuerName,
  issuerEmail,
}: InvoiceInput): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  
  // Calculations
  const paidTotal = payments
    .filter((payment) => payment.statut.toLowerCase() === "paid" || payment.statut.toLowerCase() === "partial")
    .reduce((total, payment) => total + Number.parseFloat(payment.montant || "0"), 0);
  const rent = Number.parseFloat(contract.montant || logement.loyer || "0");
  const balance = Math.max(0, rent - paidTotal);
  const invoiceNumber = `INV-${ref.replace("PRP-", "")}-${new Date().getFullYear()}`;

  // --- HEADER & LOGO ---
  try {
    doc.addImage(LOGO_PATH, "PNG", 40, 30, 80, 30, "", "MEDIUM");
  } catch (e) {
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("IMMOFLOW", 40, 55);
  }

  // Right Aligned Invoice Info
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("INVOICE", 555, 55, { align: "right" });

  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice Number: ${invoiceNumber}`, 555, 75, { align: "right" });
  doc.text(`Date of Issue: ${shortDate(new Date().toISOString())}`, 555, 90, { align: "right" });

  // Subtle Separator Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);
  doc.line(40, 120, 555, 120);

  // --- PARTIES (ISSUED BY / BILLED TO) ---
  let y = 160;
  
  // Issued By
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ISSUED BY", 40, y);
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(issuerName, 40, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(issuerEmail, 40, y + 30);
  doc.text("Property Manager", 40, y + 45);

  // Billed To
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("BILLED TO", 300, y);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(contract.locataire.user.name, 300, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(contract.locataire.user.email, 300, y + 30);
  doc.text("Tenant", 300, y + 45);

  // --- PROPERTY DESCRIPTION BOX ---
  y = 240;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, y, 515, 90, 8, 8, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(logement.titre || logement.adresse, 55, y + 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${logement.adresse} • ${logement.commune.nom}`, 55, y + 45);
  doc.text(`${logement.type_logement.nom_type} • ${logement.superficie} m²  |  Lease Period: ${shortDate(contract.date_debut)} to ${shortDate(contract.date_fin)}`, 55, y + 65);

  // --- FINANCIAL SUMMARY ---
  y = 380;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Payment Summary", 40, y);
  y += 20;

  doc.setDrawColor(226, 232, 240);
  doc.line(40, y, 555, y);
  y += 25;

  // Rent row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Monthly Rent Amount", 40, y);
  doc.text(`${money(contract.montant)} MAD`, 555, y, { align: "right" });
  y += 25;

  // Paid row
  doc.text("Total Payments Applied", 40, y);
  doc.text(`-${money(paidTotal)} MAD`, 555, y, { align: "right" });
  y += 25;

  // Divider for total
  doc.line(350, y, 555, y);
  y += 25;

  // Balance Due
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Balance Due", 350, y);
  doc.text(`${money(balance)} MAD`, 555, y, { align: "right" });
  y += 30;

  // Status Stamp
  if (balance === 0) {
    doc.setTextColor(22, 163, 74); // green-600
    doc.text("PAID IN FULL", 555, y, { align: "right" });
  } else {
    doc.setTextColor(220, 38, 38); // red-600
    doc.text("PAYMENT PENDING", 555, y, { align: "right" });
  }

  // --- FOOTER ---
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, 780, 555, 780);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Professional rental invoice securely generated by ImmoFlow Platform.", 297, 805, { align: "center" });

  doc.save(`${invoiceNumber.toLowerCase()}.pdf`);
}