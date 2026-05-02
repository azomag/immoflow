"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  Bath,
  BedDouble,
  Bell,
  Building2,
  CarFront,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  Flame,
  CircleHelp,
  CreditCard,
  Ellipsis,
  FileText,
  Layers3,
  LayoutGrid,
  Mail,
  Menu,
  Plus,
  PencilLine,
  ReceiptText,
  Ruler,
  Search,
  Share2,
  UploadCloud,
  UserCog,
  Users,
  Trash2,
  X,
} from "lucide-react";
import { gsap } from "gsap";
import type {
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
import { formatFileSize, prepareImagesForUpload } from "@/lib/image-upload";
import { downloadContractPdf } from "@/lib/document-pdf";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { AvatarMenu } from "@/components/dashboard/avatar-menu";
import { NotificationsPopover } from "@/components/dashboard/notifications-popover";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  notifications: NotificationRecord[];
  communes: Commune[];
  types: TypeLogement[];
  reload: () => Promise<void>;
};

type AgentTab = "dashboard" | "properties" | "contracts" | "payments" | "tenants" | "notifications" | "profile";

function emptyPropertyForm() {
  return {
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
    locataire_id: "",
    contrat_date_debut: new Date().toISOString().slice(0, 10),
    contrat_date_fin: "",
    contrat_statut: "active",
  };
}

export function AgentWorkspace({
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
}: AgentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AgentTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(true);
  const [propertyWizardOpen, setPropertyWizardOpen] = useState(false);
  const [propertyWizardStep, setPropertyWizardStep] = useState(0);
  const [contractWizardOpen, setContractWizardOpen] = useState(false);
  const [contractWizardStep, setContractWizardStep] = useState(0);
  const [paymentWizardOpen, setPaymentWizardOpen] = useState(false);
  const [paymentWizardStep, setPaymentWizardStep] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [propertyImageViewer, setPropertyImageViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [editingContractId, setEditingContractId] = useState<number | null>(null);
  const [contractDetails, setContractDetails] = useState<Contrat | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);
  const [propertyExistingImages, setPropertyExistingImages] = useState<string[]>([]);
  const [propertyImageFiles, setPropertyImageFiles] = useState<File[]>([]);
  const [propertyImagePreviewUrls, setPropertyImagePreviewUrls] = useState<string[]>([]);
  const [preparingImages, setPreparingImages] = useState(false);
  const [communeDraft, setCommuneDraft] = useState({ nom: "", nombre_habitants: "", distance_agence: "" });
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
    rib: "",
    reference: "",
    cash_note: "",
    statut: "awaiting_tenant_approval",
  });
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

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

  const selectedContractTenant = useMemo(
    () => tenantUsers.find((entry) => String(entry.locataire_profile?.id ?? "") === contratForm.locataire_id) ?? null,
    [contratForm.locataire_id, tenantUsers],
  );

  const selectedContractProperty = useMemo(
    () => logements.find((entry) => String(entry.id) === contratForm.logement_id) ?? null,
    [contratForm.logement_id, logements],
  );

  const contractPropertyOptions = useMemo(() => {
    if (!contratForm.locataire_id) {
      return propertySnapshots
        .filter((snapshot) => !snapshot.activeContract)
        .map((snapshot) => snapshot.logement);
    }

    const attached = contrats
      .filter((contrat) => String(contrat.locataire.id) === contratForm.locataire_id)
      .map((contrat) => logements.find((logement) => logement.id === contrat.logement.id))
      .filter((logement): logement is Logement => Boolean(logement));

    if (attached.length > 0) {
      return attached;
    }

    return propertySnapshots
      .filter((snapshot) => !snapshot.activeContract)
      .map((snapshot) => snapshot.logement);
  }, [contratForm.locataire_id, contrats, logements, propertySnapshots]);

  const selectedPaymentContract = useMemo(
    () => contrats.find((entry) => String(entry.id) === paymentForm.contrat_id) ?? null,
    [contrats, paymentForm.contrat_id],
  );
  const totalPropertyImageCount = propertyExistingImages.length + propertyImageFiles.length;

  useEffect(() => {
    if (!notice && !error) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNotice(null);
      setError(null);
    }, 3600);

    return () => window.clearTimeout(timeout);
  }, [error, notice]);

  useEffect(() => {
    if (!workspaceRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".nav-animate",
        { x: -12, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.32, ease: "power2.out", stagger: 0.035 },
      );
    }, workspaceRef);

    return () => ctx.revert();
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    const panels = Array.from(contentRef.current.children);
    if (!panels.length) {
      return;
    }

    gsap.fromTo(
      panels,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.36, ease: "power2.out", stagger: 0.045, overwrite: "auto" },
    );
  }, [activeTab, selectedPropertyId]);

  useEffect(() => {
    return () => {
      propertyImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [propertyImagePreviewUrls]);

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
    propertyImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setEditingPropertyId(null);
    setPropertyForm(emptyPropertyForm());
    setPropertyExistingImages([]);
    setPropertyImageFiles([]);
    setPropertyImagePreviewUrls([]);
    setCommuneDraft({ nom: "", nombre_habitants: "", distance_agence: "" });
    setPropertyWizardStep(0);
  }

  function openTab(tab: AgentTab) {
    setActiveTab(tab);
    setSelectedPropertyId(null);
    setContractDetails(null);
    setPropertyImageViewer(null);
    setSidebarOpen(false);

    if (tab !== "properties") {
      resetPropertyEditor();
    }
  }

  function beginEditProperty(snapshot: (typeof propertySnapshots)[number]) {
    resetContractEditor();
    setEditingPropertyId(snapshot.logement.id);
    setPropertyForm({
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
      images_text: "",
      locataire_id: String((snapshot.activeContract ?? snapshot.latestContract)?.locataire.id ?? ""),
      contrat_date_debut: (snapshot.activeContract ?? snapshot.latestContract)?.date_debut ?? new Date().toISOString().slice(0, 10),
      contrat_date_fin: (snapshot.activeContract ?? snapshot.latestContract)?.date_fin ?? "",
      contrat_statut: (snapshot.activeContract ?? snapshot.latestContract)?.statut ?? "active",
    });
    setPropertyExistingImages(snapshot.logement.images ?? []);
    setPropertyImageFiles([]);
    setPropertyImagePreviewUrls([]);
    setCommuneDraft({ nom: "", nombre_habitants: "", distance_agence: "" });
    setPropertyWizardStep(0);
    setPropertyWizardOpen(true);
  }

  function openPropertyWizard() {
    resetPropertyEditor();
    resetContractEditor();
    setActiveTab("properties");
    setPropertyWizardOpen(true);
  }

  function openContractWizard() {
    resetContractEditor();
    setActiveTab("contracts");
    setContractWizardStep(0);
    setContractWizardOpen(true);
    setSidebarOpen(false);
  }

  function resetContractEditor() {
    setEditingContractId(null);
    setContratForm({
      locataire_id: "",
      logement_id: "",
      date_debut: "",
      date_fin: "",
      montant: "",
      statut: "active",
    });
  }

  function openPaymentWizard() {
    setActiveTab("payments");
    setPaymentWizardStep(0);
    setPaymentWizardOpen(true);
    setSidebarOpen(false);
  }

  async function handlePropertyImagesChange(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const remainingSlots = Math.max(0, 10 - (propertyExistingImages.length + propertyImageFiles.length));
    if (remainingSlots <= 0) {
      setError("You already have 10 images. Remove one to upload another.");
      return;
    }

    if (files.length > remainingSlots) {
      setError(`You can add ${remainingSlots} more image${remainingSlots > 1 ? "s" : ""} (max 10).`);
      files = files.slice(0, remainingSlots);
    }

    setPreparingImages(true);
    setError(null);

    try {
      const preparedFiles = await prepareImagesForUpload(files);
      const optimizedCount = preparedFiles.filter((file, index) => file.size < files[index].size).length;
      const nextFiles = [...propertyImageFiles, ...preparedFiles];
      setPropertyImageFiles(nextFiles);
      setPropertyImagePreviewUrls((current) => [
        ...current,
        ...preparedFiles.map((file) => URL.createObjectURL(file)),
      ]);
      setNotice(
        optimizedCount > 0
          ? `${optimizedCount} image${optimizedCount > 1 ? "s" : ""} optimized for upload.`
          : "Images ready for upload.",
      );
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Could not prepare the selected images.");
    } finally {
      setPreparingImages(false);
    }
  }

  function removeExistingPropertyImage(index: number) {
    setPropertyExistingImages((current) => current.filter((_, i) => i !== index));
  }

  function removeUploadedPropertyImage(index: number) {
    const previewToRevoke = propertyImagePreviewUrls[index];
    if (previewToRevoke) {
      URL.revokeObjectURL(previewToRevoke);
    }

    setPropertyImageFiles((current) => current.filter((_, i) => i !== index));
    setPropertyImagePreviewUrls((current) => current.filter((_, i) => i !== index));
  }

  async function handlePropertySubmit() {
    let communeId = propertyForm.commune_id;

    if (!communeId && communeDraft.nom.trim()) {
      const communeResponse = await backendRequest<{ commune: Commune }>("/api/communes", {
        method: "POST",
        body: JSON.stringify({
          nom: communeDraft.nom.trim(),
          nombre_habitants: Number(communeDraft.nombre_habitants || 0),
          distance_agence: Number(communeDraft.distance_agence || 0),
        }),
      }, token);
      communeId = String(communeResponse.commune.id);
      setPropertyForm((current) => ({ ...current, commune_id: communeId }));
    }

    const totalImages = propertyExistingImages.length + propertyImageFiles.length;
    if (totalImages < 2 || totalImages > 10) {
      setError("Each property must have between 2 and 10 images.");
      return;
    }

    const payload = new FormData();
    payload.set("type_logement_id", propertyForm.type_logement_id);
    payload.set("commune_id", communeId);
    payload.set("adresse", propertyForm.adresse);
    payload.set("titre", propertyForm.titre);
    payload.set("description", propertyForm.description);
    payload.set("superficie", propertyForm.superficie);
    payload.set("loyer", propertyForm.loyer);
    payload.set("chambres", propertyForm.chambres);
    payload.set("salles_bain", propertyForm.salles_bain);
    payload.set("etage", propertyForm.etage);
    payload.set("parking", propertyForm.parking ? "1" : "0");
    payload.set("chauffage", propertyForm.chauffage);
    payload.set("statut_publication", propertyForm.statut_publication);
    propertyExistingImages.forEach((image) => {
      payload.append("images[]", image);
    });
    propertyImageFiles.forEach((file) => {
      payload.append("image_files[]", file);
    });

    await runMutation(async () => {
      let savedPropertyId = editingPropertyId;

      if (editingPropertyId) {
        payload.set("_method", "PATCH");
        await backendRequest(`/api/logements/${editingPropertyId}`, {
          method: "POST",
          body: payload,
        }, token);
        setNotice("Property updated.");
      } else {
        const response = await backendRequest<{ logement: Logement }>("/api/logements", {
          method: "POST",
          body: payload,
        }, token);
        savedPropertyId = response.logement.id;
        setNotice("Property created.");
      }

      if (savedPropertyId && propertyForm.locataire_id) {
        const alreadyAttached = contrats.some(
          (contrat) =>
            contrat.logement.id === savedPropertyId &&
            String(contrat.locataire.id) === propertyForm.locataire_id &&
            contrat.statut.toLowerCase() === "active",
        );

        if (!alreadyAttached) {
          await backendRequest("/api/contrats", {
            method: "POST",
            body: JSON.stringify({
              locataire_id: Number(propertyForm.locataire_id),
              logement_id: savedPropertyId,
              date_debut: propertyForm.contrat_date_debut,
              date_fin: propertyForm.contrat_date_fin || null,
              montant: Number(propertyForm.loyer),
              statut: propertyForm.contrat_statut,
            }),
          }, token);
        }
      }
      resetPropertyEditor();
      setPropertyWizardOpen(false);
    });
  }

  async function handleContractSubmit() {
    await runMutation(async () => {
      await backendRequest(editingContractId ? `/api/contrats/${editingContractId}` : "/api/contrats", {
        method: editingContractId ? "PATCH" : "POST",
        body: JSON.stringify({
          locataire_id: Number(contratForm.locataire_id),
          logement_id: Number(contratForm.logement_id),
          date_debut: contratForm.date_debut,
          date_fin: contratForm.date_fin || null,
          montant: Number(contratForm.montant),
          statut: contratForm.statut,
        }),
      }, token);
      resetContractEditor();
      setContractWizardOpen(false);
      setContractWizardStep(0);
      setNotice(editingContractId ? "Contract updated." : "Contract created.");
    });
  }

  function beginEditContract(contrat: Contrat) {
    setEditingContractId(contrat.id);
    setContratForm({
      locataire_id: String(contrat.locataire.id),
      logement_id: String(contrat.logement.id),
      date_debut: contrat.date_debut,
      date_fin: contrat.date_fin ?? "",
      montant: contrat.montant,
      statut: contrat.statut,
    });
    setContractWizardStep(0);
    setContractWizardOpen(true);
  }

  async function handleDeleteContract(contrat: Contrat) {
    const { default: Swal } = await import("sweetalert2");
    const result = await Swal.fire({
      title: "Delete contract?",
      text: "Contracts with payments cannot be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    await runMutation(async () => {
      await backendRequest(`/api/contrats/${contrat.id}`, { method: "DELETE" }, token);
      setNotice("Contract deleted.");
      if (contractDetails?.id === contrat.id) {
        setContractDetails(null);
      }
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
          rib: paymentForm.mode === "Virement" ? paymentForm.rib : null,
          reference: paymentForm.reference || null,
          cash_note: paymentForm.mode === "Cash" ? paymentForm.cash_note : null,
          statut: paymentForm.statut,
        }),
      }, token);
      setPaymentForm((current) => ({
        ...current,
        contrat_id: "",
        montant: "",
        rib: "",
        reference: "",
        cash_note: "",
        statut: "awaiting_tenant_approval",
      }));
      setPaymentWizardOpen(false);
      setPaymentWizardStep(0);
      setNotice("Payment recorded and sent to the tenant for approval.");
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

    downloadInvoicePdf({
      ref: snapshot.ref,
      logement: snapshot.logement,
      contract,
      payments: paiements.filter((payment) => payment.contrat.logement.id === snapshot.logement.id),
      issuerName: user.name,
      issuerEmail: user.email,
    });
    setNotice("PDF invoice generated.");
  }

  async function handleDeleteProperty(snapshot: (typeof propertySnapshots)[number]) {
    const { default: Swal } = await import("sweetalert2");
    const result = await Swal.fire({
      title: "Delete property?",
      text: "Properties with contracts cannot be deleted. Use draft for historical records.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    await runMutation(async () => {
      await backendRequest(`/api/logements/${snapshot.logement.id}`, { method: "DELETE" }, token);
      setNotice("Property deleted.");
    });
  }

  const navItems: Array<{ id: AgentTab; label: string; icon: typeof LayoutGrid }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "properties", label: "Properties", icon: Building2 },
    { id: "contracts", label: "Contracts", icon: FileText },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "tenants", label: "Tenants", icon: Users },
    { id: "notifications", label: "Messages", icon: Bell },
    { id: "profile", label: "Profile", icon: UserCog },
  ];

  return (
    <div ref={workspaceRef} className="min-h-screen bg-[var(--background)]">
      <div className={`grid min-h-screen transition-[grid-template-columns] duration-300 ${sidebarCollapsed ? "lg:grid-cols-[96px_minmax(0,1fr)]" : "lg:grid-cols-[306px_minmax(0,1fr)]"}`}>
        {/* ── Sidebar ── */}
        <aside className={`sidebar-dark fixed inset-y-0 left-0 z-40 flex w-[306px] flex-col border-r border-[var(--sidebar-border)] px-5 py-6 transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${sidebarCollapsed ? "lg:w-[96px]" : "lg:w-[306px]"}`}>
          <div className="space-y-1 px-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex h-13 w-13 items-center justify-center overflow-hidden ">
                  <Image src="/assets/profile/logo/logo_immoflow.png" alt="ImmoFlow logo" width={100} height={100} className="h-full w-full object-cover" />
                </div>
              </div>
              <button type="button" className="hidden rounded-full p-2 text-white/55 transition hover:bg-white/10 lg:block" onClick={() => setSidebarCollapsed((current) => !current)}>
                <ChevronLeft className={`h-5 w-5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
              </button>
              <button type="button" className="rounded-full p-2 text-white/55 lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-4" />
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const link = (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openTab(item.id)}
                    className={`nav-item nav-animate ${activeTab === item.id ? "active" : ""} ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}`}
                  >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={sidebarCollapsed ? "lg:hidden" : ""}>{item.label}</span>
                </button>
              );

              return sidebarCollapsed ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={16} className="rounded-lg bg-white font-semibold text-[var(--foreground)] shadow-[var(--shadow-lg)] border-[var(--border)]">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </nav>

          <div className="mt-auto space-y-5 pt-10">
            <div className={`rounded-[20px] border border-[var(--sidebar-border)] bg-white/5 p-2 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                onClick={() => setCreateMenuOpen((current) => !current)}
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Quick create
                </span>
                <ChevronDown className={`h-4 w-4 transition ${createMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  createMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-1 pt-1">
                    <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--sidebar-text)] hover:bg-white/10 hover:text-white" onClick={openPropertyWizard}>
                      Add property
                    </button>
                    <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--sidebar-text)] hover:bg-white/10 hover:text-white" onClick={openContractWizard}>
                      Create contract
                    </button>
                    <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--sidebar-text)] hover:bg-white/10 hover:text-white" onClick={openPaymentWizard}>
                      Record payment
                    </button>
                    <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--sidebar-text)] hover:bg-white/10 hover:text-white" onClick={() => openTab("notifications")}>
                      New message
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`space-y-2 border-t border-[var(--sidebar-border)] pt-4 text-[15px] text-[var(--sidebar-text)] ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/10 hover:text-white">
                <CircleHelp className="h-5 w-5 shrink-0" />
                <span>Support</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[var(--danger)] transition hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                onClick={() => startTransition(() => void signOut({ callbackUrl: "/login" }))}
              >
                <ChevronLeft className="h-5 w-5 shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen ? <button type="button" aria-label="Close sidebar" className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}

        <main className="min-w-0 px-6 py-5 md:px-10 md:py-6">
          <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full items-center gap-3 xl:max-w-[760px]">
              <button type="button" className="rounded-2xl border border-[var(--border)] bg-white p-3 text-[var(--foreground)] lg:hidden shadow-[var(--shadow-sm)]" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative w-full max-w-[720px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by reference, address or tenant..."
                  className="h-12 rounded-2xl border-[var(--border)] bg-white pl-12 shadow-[var(--shadow-sm)] focus-visible:ring-[var(--ring)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4">
              <NotificationsPopover
                token={token}
                userId={user.id}
                notifications={notifications}
                onOpenMessages={() => openTab("notifications")}
              />
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[var(--border)] text-[var(--muted-foreground)] shadow-[var(--shadow-sm)] transition hover:text-[var(--foreground)] hover:border-[var(--border-strong)]">
                <CircleHelp className="h-4 w-4" />
              </button>
              <AvatarMenu user={user} onProfile={() => openTab("profile")} />
            </div>
          </header>

          {(notice || error) ? (
            <div className="fixed right-6 top-6 z-50 max-w-sm rounded-2xl border border-black/8 bg-white px-5 py-4 text-sm shadow-[0_18px_55px_rgba(15,23,42,0.16)]">
              <div className={`font-semibold ${error ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
                {error ? "Action failed" : "Done"}
              </div>
              <div className="mt-1 text-black/60">{error ?? notice}</div>
            </div>
          ) : null}

          <div ref={contentRef} className="mt-8 space-y-8">
            {activeTab === "dashboard" ? (
              <>
                <section className="grid gap-5 xl:grid-cols-[repeat(3,minmax(0,1fr))_280px]">
                  <div className="rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-sm)] card-lift">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(1,73,124,0.08)] text-[var(--primary)]">
                        <Building2 className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      My Properties
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <div className="text-4xl font-bold tracking-tight text-[var(--foreground)]">{logements.length}</div>
                      <div className="pb-1 text-sm font-semibold text-[var(--success)]">portfolio</div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-sm)] card-lift">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(44,125,160,0.08)] text-[var(--secondary)]">
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      Active Contracts
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <div className="text-4xl font-bold tracking-tight text-[var(--foreground)]">{activeContractsCount}</div>
                      <div className="pb-1 text-sm font-semibold text-[var(--muted-foreground)]">
                        {contrats.length === 0 ? "No contracts yet" : `${contrats.length} total`}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-sm)] card-lift">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(70,143,175,0.08)] text-[var(--success)]">
                        <CreditCard className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      Collections
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                      <div className="text-4xl font-bold tracking-tight text-[var(--foreground)]">{formatMoney(collectionsTotal)}</div>
                      <div className="pb-1 text-sm font-semibold text-[var(--muted-foreground)]">MAD</div>
                    </div>
                  </div>

                  <div className="rounded-3xl stat-indigo p-7 text-white shadow-[var(--shadow-primary)] card-lift">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                          Pending Signatures
                        </div>
                        <div className="mt-4 text-5xl font-bold tracking-tight">
                          {contrats.filter((contrat) => contrat.signature_status === "pending").length}
                        </div>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                        <CalendarDays className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <h2 className="text-[21px] font-bold tracking-tight text-[var(--foreground)]">My Properties</h2>
                      <button
                        type="button"
                        className="text-[14px] font-semibold text-[var(--primary)] hover:underline underline-offset-4"
                        onClick={() => openTab("properties")}
                      >
                        View All
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
                      <div className="grid grid-cols-[120px_minmax(0,1.5fr)_190px_160px] gap-4 border-b border-[var(--border)] bg-[var(--muted)] px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
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
                          className="table-row-hover grid w-full grid-cols-[120px_minmax(0,1.5fr)_190px_160px] gap-4 border-b border-[var(--border)] px-8 py-4 text-left last:border-b-0"
                        >
                          <div className="self-center text-sm font-medium text-[var(--muted-foreground)]">{property.ref}</div>
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(15,23,42,0.04)] border border-[rgba(15,23,42,0.08)] text-xs font-bold text-[var(--foreground)]">
                              {property.logement.type_logement.nom_type.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-[15px] font-semibold text-[var(--foreground)]">{property.logement.adresse}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">
                                {property.tenantName ?? property.logement.commune.nom}
                              </div>
                            </div>
                          </div>
                          <div className="self-center">
                            <Badge variant={toneForStatus(property.status) as any}>{property.status}</Badge>
                          </div>
                          <div className="self-center text-sm font-medium text-[var(--muted-foreground)]">
                            {formatShortDate(property.nextEventDate)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="mb-5 text-[21px] font-bold tracking-tight text-[var(--foreground)]">Recent Activity</h2>
                    <div className="rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-sm)]">
                      <div className="space-y-6">
                        {recentActivity.map((item, index) => (
                          <div key={item.id} className="relative flex gap-4">
                            <div className="relative flex flex-col items-center">
                              <div className="z-10 h-4 w-4 rounded-full border-[3px] border-[var(--primary)] bg-white shadow-[0_0_0_2px_rgba(1,73,124,0.2)]" />
                              {index !== recentActivity.length - 1 ? (
                                <div className="absolute top-4 bottom-[-24px] w-0.5 bg-[var(--border)]" />
                              ) : null}
                            </div>
                            <div className="pb-1 pt-0.5">
                              <div className="text-[15px] font-semibold text-[var(--foreground)]">{item.title}</div>
                              <div className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{item.description}</div>
                              <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
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
              <section className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-[28px] font-semibold tracking-tight">Properties</h1>
                    <p className="mt-1 text-sm text-black/50">Create listings with a guided Airbnb-style flow.</p>
                  </div>
                  <Button className="rounded-2xl" onClick={openPropertyWizard}>
                    <Plus className="h-4 w-4" />
                    Create property
                  </Button>
                </div>
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
                    <div
                      key={property.logement.id}
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
                      <div className="flex items-center justify-center" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Property actions"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-white text-black/50 transition hover:text-black"
                            >
                              <Ellipsis className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              className="text-gray-600"
                              onClick={() => setSelectedPropertyId(property.logement.id)}
                            >
                              <Eye className="h-4 w-4 text-gray-500" />
                              Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-blue-700"
                              onClick={() => beginEditProperty(property)}
                            >
                              <PencilLine className="h-4 w-4 text-blue-600" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-emerald-700"
                              disabled={!property.latestContract}
                              onClick={() => handleInvoice(property)}
                            >
                              <FileDown className="h-4 w-4 text-emerald-600" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-700 focus:text-red-700"
                              onClick={() => void handleDeleteProperty(property)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
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
                      {selectedProperty.logement.images?.[0] ? (
                        <div className="relative min-h-[340px] overflow-hidden">
                          <button
                            type="button"
                            className="block h-[340px] w-full"
                            onClick={() =>
                              setPropertyImageViewer({
                                images: selectedProperty.logement.images ?? [],
                                index: 0,
                              })
                            }
                          >
                            <img
                              src={selectedProperty.logement.images[0]}
                              alt={selectedProperty.logement.adresse}
                              className="h-[340px] w-full object-cover"
                            />
                          </button>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                          <div className="absolute bottom-6 left-6 right-6 text-white">
                            <Badge variant={toneForStatus(selectedProperty.status)}>{selectedProperty.status}</Badge>
                            <div className="mt-4 max-w-md text-4xl font-semibold tracking-tight">
                              {selectedProperty.logement.type_logement.nom_type}
                            </div>
                            <div className="mt-2 text-white/75">{selectedProperty.ref}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="min-h-[340px] bg-[radial-gradient(circle_at_10%_20%,#f4ead8,transparent_22%),linear-gradient(135deg,#d4dfef,#f5f1ea_58%,#d7e1d1)] p-8">
                          <Badge variant={toneForStatus(selectedProperty.status)}>{selectedProperty.status}</Badge>
                          <div className="mt-32 max-w-md text-4xl font-semibold tracking-tight text-black/85">
                            {selectedProperty.logement.type_logement.nom_type}
                          </div>
                          <div className="mt-2 text-black/60">{selectedProperty.ref}</div>
                        </div>
                      )}
                    </div>

                    {selectedProperty.logement.images && selectedProperty.logement.images.length > 1 ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {selectedProperty.logement.images.map((image, index) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            className="overflow-hidden rounded-2xl border border-black/8 bg-white transition hover:opacity-90"
                            onClick={() =>
                              setPropertyImageViewer({
                                images: selectedProperty.logement.images ?? [],
                                index,
                              })
                            }
                          >
                            <img
                              src={image}
                              alt={`${selectedProperty.logement.adresse} image ${index + 1}`}
                              className="h-28 w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}

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

                    <div className="rounded-[28px] border border-black/6 bg-white p-7">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">House information</div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { label: "Bedrooms", value: selectedProperty.logement.chambres ?? "Not set", icon: BedDouble },
                          { label: "Bathrooms", value: selectedProperty.logement.salles_bain ?? "Not set", icon: Bath },
                          { label: "Floor", value: selectedProperty.logement.etage ?? "Not set", icon: Layers3 },
                          { label: "Heating", value: selectedProperty.logement.chauffage ?? "Not set", icon: Flame },
                          { label: "Area", value: `${selectedProperty.logement.superficie} m²`, icon: Ruler },
                          { label: "Parking", value: selectedProperty.logement.parking ? "Included" : "Not included", icon: CarFront },
                        ].map((item) => (
                          <div key={item.label} className="rounded-2xl bg-[#f6f6f4] p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                              <item.icon className="h-4 w-4 text-[var(--primary)]" />
                              {item.label}
                            </div>
                            <div className="mt-2 font-semibold">{item.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 rounded-2xl bg-[#f6f6f4] p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Description</div>
                        <p className="mt-2 leading-7 text-black/65">
                          {selectedProperty.logement.description || "No detailed description has been added yet."}
                        </p>
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
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h1 className="text-[28px] font-semibold tracking-tight">Contracts</h1>
                  <Button className="rounded-2xl" onClick={openContractWizard}>
                    <Plus className="h-4 w-4" />
                    Create contract
                  </Button>
                </div>
                <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white">
                  <div className="grid grid-cols-[100px_minmax(0,1fr)_1fr_140px_140px_110px_56px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                    <div>ID</div>
                    <div>Property</div>
                    <div>Tenant</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div>Sign</div>
                    <div />
                  </div>
                  {contrats.map((contrat) => (
                    <div
                      key={contrat.id}
                      className="grid grid-cols-[100px_minmax(0,1fr)_1fr_140px_140px_110px_56px] gap-4 border-t border-black/6 px-7 py-4"
                    >
                      <div className="self-center text-black/60">IF-{String(contrat.id).padStart(4, "0")}</div>
                      <div className="self-center">{contrat.logement.adresse}</div>
                      <div className="self-center">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={contrat.locataire.user.avatar_url ?? undefined} alt={contrat.locataire.user.name} />
                            <AvatarFallback>{initials(contrat.locataire.user.name)}</AvatarFallback>
                          </Avatar>
                          <span>{contrat.locataire.user.name}</span>
                        </div>
                      </div>
                      <div className="self-center">{formatMoney(contrat.montant)} MAD</div>
                      <div className="self-center">
                        <Badge variant={toneForStatus(contrat.statut)}>{contrat.statut}</Badge>
                      </div>
                      <div className="self-center">
                        <Badge variant={toneForStatus(contrat.signature_status)}>{contrat.signature_status}</Badge>
                      </div>
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Contract actions"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/8 bg-white text-black/50 transition hover:text-black"
                            >
                              <Ellipsis className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="text-gray-600" onClick={() => setContractDetails(contrat)}>
                              <Eye className="h-4 w-4 text-gray-500" />
                              Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-blue-700" onClick={() => beginEditContract(contrat)}>
                              <PencilLine className="h-4 w-4 text-blue-600" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-700 focus:text-red-700"
                              onClick={() => void handleDeleteContract(contrat)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === "payments" ? (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h1 className="text-[28px] font-semibold tracking-tight">Payments</h1>
                  <Button className="rounded-2xl" onClick={openPaymentWizard}>
                    <Plus className="h-4 w-4" />
                    Record payment
                  </Button>
                </div>
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
                          <AvatarImage src={entry.avatar_url ?? undefined} alt={entry.name} />
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
        <Dialog open={contractWizardOpen} onOpenChange={setContractWizardOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 sm:max-w-[720px]">
            <DialogHeader className="border-b border-black/8 px-6 py-4">
              <DialogTitle className="text-[22px]">{editingContractId ? "Edit contract" : "Create contract"}</DialogTitle>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                Step {contractWizardStep + 1} of 2
              </div>
            </DialogHeader>

            <div className="h-1 bg-black/8">
              <div
                className="h-full bg-[var(--primary)] transition-all duration-300"
                style={{ width: `${((contractWizardStep + 1) / 2) * 100}%` }}
              />
            </div>

            <div className="space-y-4 px-6 py-6">
              {contractWizardStep === 0 ? (
                <>
                  <div className="space-y-2">
                    <Label>Tenant</Label>
                    <select
                      className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                      value={contratForm.locataire_id}
                      onChange={(event) => {
                        const tenantId = event.target.value;
                        const tenantContract = contrats.find((contrat) => String(contrat.locataire.id) === tenantId);
                        setContratForm((current) => ({
                          ...current,
                          locataire_id: tenantId,
                          logement_id: tenantContract ? String(tenantContract.logement.id) : "",
                          montant: tenantContract?.montant ?? current.montant,
                          statut: tenantContract?.statut ?? current.statut,
                        }));
                      }}
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
                      onChange={(event) => {
                        const selected = logements.find((entry) => String(entry.id) === event.target.value);
                        setContratForm((current) => ({
                          ...current,
                          logement_id: event.target.value,
                          montant: selected?.loyer ?? current.montant,
                          statut: selected ? "active" : current.statut,
                        }));
                      }}
                    >
                      <option value="">Select property</option>
                      {contractPropertyOptions.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.adresse}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
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
                  <div className="rounded-[20px] bg-[#f6f6f4] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Contract information</div>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-black/45">Tenant</span>
                        <span className="text-right font-semibold">{selectedContractTenant?.name ?? "Not selected"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-black/45">Property</span>
                        <span className="text-right font-semibold">{selectedContractProperty?.adresse ?? "Not selected"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-black/45">Rent</span>
                        <span className="text-right font-semibold">
                          {selectedContractProperty ? `${formatMoney(selectedContractProperty.loyer)} MAD` : "Not selected"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  disabled={contractWizardStep === 0 || busy}
                  onClick={() => setContractWizardStep(0)}
                >
                  Back
                </Button>
                {contractWizardStep === 0 ? (
                  <Button
                    className="rounded-2xl"
                    disabled={!contratForm.locataire_id || !contratForm.logement_id || busy}
                    onClick={() => setContractWizardStep(1)}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    className="rounded-2xl"
                    disabled={!contratForm.date_debut || !contratForm.montant || busy}
                    onClick={() => void handleContractSubmit()}
                  >
                    {editingContractId ? "Save contract" : "Create contract"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(contractDetails)} onOpenChange={(open) => !open && setContractDetails(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 sm:max-w-[640px]">
            <DialogHeader className="border-b border-black/8 px-6 py-4">
              <DialogTitle className="text-[22px]">Contract details</DialogTitle>
            </DialogHeader>
            {contractDetails ? (
              <div className="space-y-5 px-6 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-[#f6f6f4] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Tenant</div>
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contractDetails.locataire.user.avatar_url ?? undefined} alt={contractDetails.locataire.user.name} />
                        <AvatarFallback>{initials(contractDetails.locataire.user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{contractDetails.locataire.user.name}</div>
                        <div className="text-sm text-black/50">{contractDetails.locataire.user.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#f6f6f4] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Agent</div>
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contractDetails.agent.user.avatar_url ?? undefined} alt={contractDetails.agent.user.name} />
                        <AvatarFallback>{initials(contractDetails.agent.user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{contractDetails.agent.user.name}</div>
                        <div className="text-sm text-black/50">{contractDetails.agent.user.email}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/8 bg-white p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-black/50">Contract ref</span>
                      <span className="font-semibold">IF-{String(contractDetails.id).padStart(4, "0")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black/50">Property</span>
                      <span className="font-semibold">{contractDetails.logement.adresse}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black/50">Amount</span>
                      <span className="font-semibold">{formatMoney(contractDetails.montant)} MAD</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black/50">Start</span>
                      <span className="font-semibold">{formatLongDate(contractDetails.date_debut)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black/50">End</span>
                      <span className="font-semibold">{formatLongDate(contractDetails.date_fin, "Open")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black/50">Status</span>
                      <Badge variant={toneForStatus(contractDetails.statut)}>{contractDetails.statut}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black/50">Signature</span>
                      <Badge variant={toneForStatus(contractDetails.signature_status)}>{contractDetails.signature_status}</Badge>
                    </div>
                    {contractDetails.signed_at ? (
                      <div className="flex items-center justify-between">
                        <span className="text-black/50">Signed at</span>
                        <span className="font-semibold">{formatLongDate(contractDetails.signed_at)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {contractDetails.signature_data ? (
                  <div className="rounded-2xl bg-[#f6f6f4] p-4">
                    <div className="mb-2 text-sm font-semibold text-black/60">Tenant signature</div>
                    <img src={contractDetails.signature_data} alt="Tenant signature" className="h-24 rounded-xl border border-black/8 bg-white object-contain p-2" />
                  </div>
                ) : null}

                <Button
                  className="w-full rounded-2xl"
                  onClick={() => {
                    const property = logements.find((entry) => entry.id === contractDetails.logement.id) ?? null;
                    downloadContractPdf(contractDetails, property);
                  }}
                >
                  <FileDown className="h-4 w-4" />
                  Download contract PDF
                </Button>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(propertyImageViewer)} onOpenChange={(open) => !open && setPropertyImageViewer(null)}>
          <DialogContent className="overflow-hidden rounded-3xl p-0 sm:max-w-[980px]">
            {propertyImageViewer ? (
              <div className="bg-black">
                <div className="relative">
                  <img
                    src={propertyImageViewer.images[propertyImageViewer.index]}
                    alt={`Property image ${propertyImageViewer.index + 1}`}
                    className="h-[68vh] w-full object-contain"
                  />
                  {propertyImageViewer.images.length > 1 ? (
                    <>
                      <Button
                        variant="outline"
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border-white/30 bg-black/45 text-white hover:bg-black/65"
                        onClick={() =>
                          setPropertyImageViewer((current) =>
                            current
                              ? {
                                  ...current,
                                  index: (current.index - 1 + current.images.length) % current.images.length,
                                }
                              : current,
                          )
                        }
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border-white/30 bg-black/45 text-white hover:bg-black/65"
                        onClick={() =>
                          setPropertyImageViewer((current) =>
                            current
                              ? {
                                  ...current,
                                  index: (current.index + 1) % current.images.length,
                                }
                              : current,
                          )
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
                <div className="px-4 py-3 text-center text-sm font-medium text-white/85">
                  {propertyImageViewer.index + 1} / {propertyImageViewer.images.length}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={paymentWizardOpen} onOpenChange={setPaymentWizardOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 sm:max-w-[720px]">
            <DialogHeader className="border-b border-black/8 px-6 py-4">
              <DialogTitle className="text-[22px]">Record payment</DialogTitle>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                Step {paymentWizardStep + 1} of 2
              </div>
            </DialogHeader>

            <div className="h-1 bg-black/8">
              <div
                className="h-full bg-[var(--primary)] transition-all duration-300"
                style={{ width: `${((paymentWizardStep + 1) / 2) * 100}%` }}
              />
            </div>

            <div className="space-y-4 px-6 py-6">
              {paymentWizardStep === 0 ? (
                <>
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
                          statut: "awaiting_tenant_approval",
                        }));
                      }}
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
                </>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <select
                        className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                        value={paymentForm.mode}
                        onChange={(event) =>
                          setPaymentForm((current) => ({
                            ...current,
                            mode: event.target.value,
                            statut: ["Virement", "Cash"].includes(event.target.value) ? "awaiting_tenant_approval" : current.statut,
                          }))
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
                        <option value="awaiting_tenant_approval">Needs tenant approval</option>
                        <option value="pending">Pending</option>
                        <option value="partial">Partial</option>
                      </select>
                    </div>
                  </div>
                  {paymentForm.mode === "Virement" ? (
                    <div className="rounded-[20px] bg-[#f6f6f4] p-4">
                      <div className="text-sm font-semibold">Bank transfer details</div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <Input
                          value={paymentForm.rib}
                          onChange={(event) => setPaymentForm((current) => ({ ...current, rib: event.target.value }))}
                          placeholder="RIB / IBAN"
                        />
                        <Input
                          value={paymentForm.reference}
                          onChange={(event) => setPaymentForm((current) => ({ ...current, reference: event.target.value }))}
                          placeholder="Transfer reference"
                        />
                      </div>
                      <div className="mt-3 text-xs text-black/50">
                        The tenant will approve this confirmation after checking the transfer.
                      </div>
                    </div>
                  ) : null}
                  {paymentForm.mode === "Cash" ? (
                    <div className="rounded-[20px] bg-[#f6f6f4] p-4">
                      <div className="text-sm font-semibold">Cash handover note</div>
                      <textarea
                        className="mt-3 min-h-20 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        value={paymentForm.cash_note}
                        onChange={(event) => setPaymentForm((current) => ({ ...current, cash_note: event.target.value }))}
                        placeholder="Who received the cash, location, receipt number..."
                      />
                    </div>
                  ) : null}
                  {selectedPaymentContract ? (
                    <div className="rounded-[20px] border border-black/8 bg-white p-4 text-sm">
                      <div className="font-semibold">{selectedPaymentContract.locataire.user.name}</div>
                      <div className="mt-1 text-black/55">{selectedPaymentContract.logement.adresse}</div>
                      <div className="mt-3 text-black/50">Expected rent: {formatMoney(selectedPaymentContract.montant)} MAD</div>
                    </div>
                  ) : null}
                </>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  disabled={paymentWizardStep === 0 || busy}
                  onClick={() => setPaymentWizardStep(0)}
                >
                  Back
                </Button>
                {paymentWizardStep === 0 ? (
                  <Button
                    className="rounded-2xl"
                    disabled={!paymentForm.contrat_id || !paymentForm.montant || busy}
                    onClick={() => setPaymentWizardStep(1)}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    className="rounded-2xl"
                    disabled={busy}
                    onClick={() => void handlePaymentSubmit()}
                  >
                    Record payment
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {propertyWizardOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
            <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between border-b border-black/8 px-6 py-4">
                <button
                  type="button"
                  className="rounded-full p-2 text-black/60 transition hover:bg-black/5"
                  onClick={() => {
                    setPropertyWizardOpen(false);
                    resetPropertyEditor();
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="text-sm font-semibold text-black/55">
                  Step {propertyWizardStep + 1} of 4
                </div>
              </div>

              <div className="h-1 bg-black/8">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${((propertyWizardStep + 1) / 4) * 100}%` }}
                />
              </div>

              <div className="overflow-y-auto px-6 py-7">
                {propertyWizardStep === 0 ? (
                  <div>
                    <h2 className="text-[30px] font-semibold tracking-tight">What kind of property is it?</h2>
                    <p className="mt-2 text-sm text-black/50">Choose one type. Agents should only pick from the saved platform list.</p>
                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                      {types.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => setPropertyForm((current) => ({ ...current, type_logement_id: String(entry.id) }))}
                          className={`rounded-[20px] border px-5 py-5 text-left transition ${
                            propertyForm.type_logement_id === String(entry.id)
                              ? "border-black bg-black text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
                              : "border-black/10 bg-white hover:border-black/25 hover:bg-[#f6f6f4]"
                          }`}
                        >
                          <div className="text-lg font-semibold">{entry.nom_type}</div>
                          <div className="mt-1 text-sm opacity-65">{formatMoney(entry.charge_forfaitaires)} MAD flat charges</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {propertyWizardStep === 1 ? (
                  <div>
                    <h2 className="text-[30px] font-semibold tracking-tight">Add the commune</h2>
                    <p className="mt-2 text-sm text-black/50">No dropdown here. Add the commune information and it will be saved before the property is created.</p>
                    <div className="mt-7 grid gap-4 rounded-[24px] border border-black/8 bg-[#fbfbfa] p-5 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Commune name</Label>
                        <Input
                          value={communeDraft.nom}
                          onChange={(event) => {
                            setPropertyForm((current) => ({ ...current, commune_id: "" }));
                            setCommuneDraft((current) => ({ ...current, nom: event.target.value }));
                          }}
                          placeholder="Hay Riad, Agdal, Temara..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Population</Label>
                        <Input
                          type="number"
                          value={communeDraft.nombre_habitants}
                          onChange={(event) => {
                            setPropertyForm((current) => ({ ...current, commune_id: "" }));
                            setCommuneDraft((current) => ({ ...current, nombre_habitants: event.target.value }));
                          }}
                          placeholder="85000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Distance to agency</Label>
                        <Input
                          type="number"
                          value={communeDraft.distance_agence}
                          onChange={(event) => {
                            setPropertyForm((current) => ({ ...current, commune_id: "" }));
                            setCommuneDraft((current) => ({ ...current, distance_agence: event.target.value }));
                          }}
                          placeholder="3.5"
                        />
                      </div>
                    </div>
                    {communes.length > 0 ? (
                        <div className="mt-6 rounded-[20px] bg-[#f6f6f4] p-4 text-sm text-black/55">
                          Add the commune once here. The platform saves it and reuses it automatically later.
                        </div>
                    ) : null}
                  </div>
                ) : null}

                {propertyWizardStep === 2 ? (
                  <div>
                    <h2 className="text-[30px] font-semibold tracking-tight">Describe the house</h2>
                    <p className="mt-2 text-sm text-black/50">Add the information tenants and admins need to understand the listing.</p>
                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Address</Label>
                        <Input value={propertyForm.adresse} onChange={(event) => setPropertyForm((current) => ({ ...current, adresse: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={propertyForm.titre} onChange={(event) => setPropertyForm((current) => ({ ...current, titre: event.target.value }))} placeholder="Modern studio near Agdal" />
                      </div>
                      <div className="space-y-2">
                        <Label>Publication status</Label>
                        <select className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4" value={propertyForm.statut_publication} onChange={(event) => setPropertyForm((current) => ({ ...current, statut_publication: event.target.value }))}>
                          <option value="listed">Listed</option>
                          <option value="draft">Draft</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Description</Label>
                        <textarea className="min-h-28 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]" value={propertyForm.description} onChange={(event) => setPropertyForm((current) => ({ ...current, description: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Area</Label>
                        <Input type="number" value={propertyForm.superficie} onChange={(event) => setPropertyForm((current) => ({ ...current, superficie: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Rent</Label>
                        <Input type="number" value={propertyForm.loyer} onChange={(event) => setPropertyForm((current) => ({ ...current, loyer: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Bedrooms</Label>
                        <Input type="number" value={propertyForm.chambres} onChange={(event) => setPropertyForm((current) => ({ ...current, chambres: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Bathrooms</Label>
                        <Input type="number" value={propertyForm.salles_bain} onChange={(event) => setPropertyForm((current) => ({ ...current, salles_bain: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Floor</Label>
                        <Input value={propertyForm.etage} onChange={(event) => setPropertyForm((current) => ({ ...current, etage: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Heating</Label>
                        <Input value={propertyForm.chauffage} onChange={(event) => setPropertyForm((current) => ({ ...current, chauffage: event.target.value }))} placeholder="Electric" />
                      </div>
                      <label className="flex h-12 items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 text-sm">
                        <input type="checkbox" checked={propertyForm.parking} onChange={(event) => setPropertyForm((current) => ({ ...current, parking: event.target.checked }))} />
                        Parking included
                      </label>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Attach tenant to this house</Label>
                        <select
                          className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                          value={propertyForm.locataire_id}
                          onChange={(event) => setPropertyForm((current) => ({ ...current, locataire_id: event.target.value }))}
                        >
                          <option value="">Keep property vacant</option>
                          {tenantUsers.map((entry) => (
                            <option key={entry.id} value={entry.locataire_profile?.id ?? ""}>
                              {entry.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {propertyForm.locataire_id ? (
                        <div className="grid gap-4 rounded-[20px] bg-[#f6f6f4] p-4 sm:col-span-2 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Contract start</Label>
                            <Input
                              type="date"
                              value={propertyForm.contrat_date_debut}
                              onChange={(event) => setPropertyForm((current) => ({ ...current, contrat_date_debut: event.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Contract end</Label>
                            <Input
                              type="date"
                              value={propertyForm.contrat_date_fin}
                              onChange={(event) => setPropertyForm((current) => ({ ...current, contrat_date_fin: event.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <select
                              className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                              value={propertyForm.contrat_statut}
                              onChange={(event) => setPropertyForm((current) => ({ ...current, contrat_statut: event.target.value }))}
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                            </select>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {propertyWizardStep === 3 ? (
                  <div>
                    <h2 className="text-[30px] font-semibold tracking-tight">Add photos</h2>
                    <p className="mt-2 text-sm text-black/50">Photos are uploaded to Laravel and saved in the property record.</p>
                    <div className="mt-2 text-sm font-medium text-black/65">
                      {totalPropertyImageCount}/10 images selected (minimum 2)
                    </div>
                    <label className="mt-7 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-black/15 bg-[#fbfbfa] px-5 py-8 text-center transition hover:bg-[#f6f6f4]">
                      <UploadCloud className="h-8 w-8 text-black/45" />
                      <span className="mt-3 text-base font-semibold">Upload property photos</span>
                      <span className="mt-1 text-sm text-black/45">Large JPG, PNG, or WebP files are optimized automatically</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(event) => {
                          const files = Array.from(event.currentTarget.files ?? []);
                          event.currentTarget.value = "";
                          void handlePropertyImagesChange(files);
                        }}
                      />
                    </label>
                    {preparingImages ? (
                      <div className="mt-3 text-sm text-black/50">Preparing images for upload...</div>
                    ) : null}
                    {propertyExistingImages.length > 0 ? (
                      <div className="mt-5">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                          Existing images
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {propertyExistingImages.map((imageUrl, index) => (
                            <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded-2xl border border-black/8 bg-white">
                              <img src={imageUrl} alt={`Property ${index + 1}`} className="h-28 w-full object-cover" />
                              <div className="flex items-center justify-end px-3 py-2">
                                <button
                                  type="button"
                                  className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                                  onClick={() => removeExistingPropertyImage(index)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {propertyImageFiles.length > 0 ? (
                      <div className="mt-5">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                          New uploads
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {propertyImageFiles.map((file, index) => (
                            <div key={`${file.name}-${file.size}-${file.lastModified}`} className="overflow-hidden rounded-2xl border border-black/8 bg-white">
                            {propertyImagePreviewUrls[index] ? (
                              <img src={propertyImagePreviewUrls[index]} alt={file.name} className="h-28 w-full object-cover" />
                            ) : null}
                            <div className="px-3 py-2 text-xs text-black/55">
                              <div className="truncate">{file.name}</div>
                              <div className="mt-0.5 text-black/35">{formatFileSize(file.size)}</div>
                              <button
                                type="button"
                                className="mt-2 rounded-lg border border-red-200 px-2 py-1 font-semibold text-red-700 transition hover:bg-red-50"
                                onClick={() => removeUploadedPropertyImage(index)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between border-t border-black/8 px-6 py-4">
                <Button variant="outline" className="rounded-2xl" disabled={propertyWizardStep === 0 || busy} onClick={() => setPropertyWizardStep((current) => Math.max(0, current - 1))}>
                  Back
                </Button>
                {propertyWizardStep < 3 ? (
                  <Button
                    className="rounded-2xl"
                    disabled={
                      preparingImages ||
                      (propertyWizardStep === 0 && !propertyForm.type_logement_id) ||
                      (propertyWizardStep === 1 && !propertyForm.commune_id && !communeDraft.nom.trim()) ||
                      (propertyWizardStep === 2 && (!propertyForm.adresse || !propertyForm.superficie || !propertyForm.loyer))
                    }
                    onClick={() => setPropertyWizardStep((current) => Math.min(3, current + 1))}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button className="rounded-2xl" disabled={busy || preparingImages || totalPropertyImageCount < 2 || totalPropertyImageCount > 10} onClick={() => void handlePropertySubmit()}>
                    {editingPropertyId ? "Save property" : "Create property"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
