"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  Bath,
  MessageSquare,
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
  PencilLine,
  Ruler,
  Mail,
  Menu,
  Plus,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  UploadCloud,
  UserCog,
  UserPlus,
  Users,
  Trash2,
  X,
  BedDouble,
  Check,
  Clock3,
  Ban,
} from "lucide-react";
import { gsap } from "gsap";
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
import { downloadContractPdf } from "@/lib/document-pdf";
import { formatFileSize, prepareImagesForUpload } from "@/lib/image-upload";
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
    locataire_id: "",
    contrat_date_debut: new Date().toISOString().slice(0, 10),
    contrat_date_fin: "",
    contrat_statut: "active",
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(true);
  const [propertyPanelOpen, setPropertyPanelOpen] = useState(false);
  const [propertyWizardStep, setPropertyWizardStep] = useState(0);
  const [contractWizardOpen, setContractWizardOpen] = useState(false);
  const [contractWizardStep, setContractWizardStep] = useState(0);
  const [paymentWizardOpen, setPaymentWizardOpen] = useState(false);
  const [paymentWizardStep, setPaymentWizardStep] = useState(0);
  const [userWizardOpen, setUserWizardOpen] = useState(false);
  const [userWizardStep, setUserWizardStep] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [userView, setUserView] = useState<UserView>(role === "super_admin" ? "admins" : "agents");
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
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

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

  const normalizedSearch = search.trim().toLowerCase();

  const filteredProperties = useMemo(() => {
    return propertySnapshots.filter((snapshot) => {
      const typeMatch = typeFilter === "All" || snapshot.logement.type_logement.nom_type === typeFilter;
      const searchMatch =
        normalizedSearch.length === 0 ||
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
          .includes(normalizedSearch);

      return typeMatch && searchMatch;
    });
  }, [normalizedSearch, propertySnapshots, typeFilter]);

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

    if (!normalizedSearch) {
      return pool;
    }

    return pool.filter((entry) =>
      [entry.name, entry.email, entry.phone ?? "", entry.role].join(" ").toLowerCase().includes(normalizedSearch),
    );
  }, [adminUsers, agentUsers, normalizedSearch, tenantUsers, userView]);

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

  const filteredContracts = useMemo(() => {
    if (!normalizedSearch) {
      return contrats;
    }

    return contrats.filter((contrat) =>
      [
        contrat.id,
        contrat.locataire.user.name,
        contrat.locataire.user.email,
        contrat.logement.adresse,
        contrat.statut,
        contrat.signature_status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [contrats, normalizedSearch]);

  const filteredPayments = useMemo(() => {
    if (!normalizedSearch) {
      return paiements;
    }

    return paiements.filter((paiement) =>
      [
        paiement.id,
        paiement.contrat.locataire.user.name,
        paiement.contrat.logement.adresse,
        paiement.mode,
        paiement.statut,
        paiement.montant,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [normalizedSearch, paiements]);

  const filteredTenantRows = useMemo(() => {
    if (!normalizedSearch) {
      return tenantRows;
    }

    return tenantRows.filter((row) =>
      [
        row.user.name,
        row.user.email,
        row.user.phone ?? "",
        row.residence,
        row.rent ?? "",
        row.user.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [normalizedSearch, tenantRows]);

  const searchPlaceholder = useMemo(() => {
    if (activeTab === "properties") return "Search properties by ref, address, tenant...";
    if (activeTab === "contracts") return "Search contracts by tenant, property, status...";
    if (activeTab === "payments") return "Search payments by tenant, amount, mode...";
    if (activeTab === "tenants") return "Search tenants by name, email, phone...";
    if (activeTab === "users") return "Search users by name, role, email...";
    return "Search by reference, name or tenant...";
  }, [activeTab]);

  const contractPropertyOptions = useMemo(() => {
    if (!contractForm.locataire_id) {
      return propertySnapshots
        .filter((snapshot) => !snapshot.activeContract)
        .map((snapshot) => snapshot.logement);
    }

    const attached = contrats
      .filter((contrat) => String(contrat.locataire.id) === contractForm.locataire_id)
      .map((contrat) => logements.find((logement) => logement.id === contrat.logement.id))
      .filter((logement): logement is Logement => Boolean(logement));

    if (attached.length > 0) {
      return attached;
    }

    return propertySnapshots
      .filter((snapshot) => !snapshot.activeContract)
      .map((snapshot) => snapshot.logement);
  }, [contractForm.locataire_id, contrats, logements, propertySnapshots]);

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
  }, [activeTab, selectedPropertyId, userView]);

  useEffect(() => {
    return () => {
      propertyImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [propertyImagePreviewUrls]);

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

  function resetUserWizardState() {
    setUserWizardStep(0);
    setUserForm({
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
  }

  function resetPropertyEditor() {
    propertyImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setEditingPropertyId(null);
    setPropertyForm(emptyPropertyForm());
    setPropertyExistingImages([]);
    setPropertyImageFiles([]);
    setPropertyImagePreviewUrls([]);
    setPropertyWizardStep(0);
  }

  function openTab(tab: AdminTab) {
    setActiveTab(tab);
    setSelectedPropertyId(null);
    setContractDetails(null);
    setPropertyImageViewer(null);
    setSidebarOpen(false);
    resetPropertyEditor();
    if (tab !== "contracts") {
      resetContractEditor();
    }
  }

  function openCreateProperty() {
    openTab("properties");
    setPropertyWizardStep(0);
    setPropertyPanelOpen(true);
  }

  function openContractWizard() {
    setActiveTab("contracts");
    resetContractEditor();
    setContractWizardStep(0);
    setContractWizardOpen(true);
    setSidebarOpen(false);
  }

  function resetContractEditor() {
    setEditingContractId(null);
    setContractForm({
      agent_id: "",
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

  function openUserWizard() {
    setActiveTab("users");
    resetUserWizardState();
    setError(null);
    setUserWizardOpen(true);
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
      setPropertyImageFiles((current) => [...current, ...preparedFiles]);
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

  function openPropertyDetail(propertyId: number) {
    setActiveTab("properties");
    setSelectedPropertyId(propertyId);
  }

  function beginEditProperty(snapshot: (typeof propertySnapshots)[number]) {
    setEditingPropertyId(snapshot.logement.id);
    setPropertyWizardStep(0);
    setPropertyPanelOpen(true);
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
      locataire_id: String((snapshot.activeContract ?? snapshot.latestContract)?.locataire.id ?? ""),
      contrat_date_debut: (snapshot.activeContract ?? snapshot.latestContract)?.date_debut ?? new Date().toISOString().slice(0, 10),
      contrat_date_fin: (snapshot.activeContract ?? snapshot.latestContract)?.date_fin ?? "",
      contrat_statut: (snapshot.activeContract ?? snapshot.latestContract)?.statut ?? "active",
    });
    setPropertyExistingImages(snapshot.logement.images ?? []);
    setPropertyImageFiles([]);
    setPropertyImagePreviewUrls([]);
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
    if (totalPropertyImageCount < 2 || totalPropertyImageCount > 10) {
      setError("Each property must have between 2 and 10 images.");
      return;
    }

    const payload = new FormData();
    payload.set("agent_id", propertyForm.agent_id);
    payload.set("type_logement_id", propertyForm.type_logement_id);
    payload.set("commune_id", propertyForm.commune_id);
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
              agent_id: Number(propertyForm.agent_id),
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
      setPropertyPanelOpen(false);
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

  async function handleRecordPayment() {
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
      setNotice("Payment recorded and sent to the tenant for approval.");
      setPaymentWizardOpen(false);
      setPaymentWizardStep(0);
      setPaymentForm((current) => ({
        ...current,
        contrat_id: "",
        montant: "",
        rib: "",
        reference: "",
        cash_note: "",
        statut: "awaiting_tenant_approval",
      }));
    });
  }

  async function handleContractSubmit() {
    await runMutation(async () => {
      await backendRequest(editingContractId ? `/api/contrats/${editingContractId}` : "/api/contrats", {
        method: editingContractId ? "PATCH" : "POST",
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

      resetContractEditor();
      setNotice(editingContractId ? "Contract updated." : "Contract created.");
      setContractWizardOpen(false);
      setContractWizardStep(0);
    });
  }

  function beginEditContract(contrat: Contrat) {
    setEditingContractId(contrat.id);
    setContractForm({
      agent_id: String(contrat.agent.id),
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

      resetUserWizardState();
      setUserWizardOpen(false);
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
      text: "This will permanently delete this property and all related contracts and payments.",
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

  const navItems: Array<{ id: AdminTab; label: string; icon: typeof LayoutGrid }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "properties", label: "Properties", icon: Building2 },
    { id: "contracts", label: "Contracts", icon: FileText },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "tenants", label: "Tenants", icon: Users },
    { id: "users", label: "User Management", icon: UserCog },
    { id: "notifications", label: "Messages", icon: MessageSquare },
    { id: "profile", label: "Profile", icon: UserCog },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div ref={workspaceRef} className="min-h-screen bg-[var(--background)]">
      <div className={`grid min-h-screen transition-[grid-template-columns] duration-300 ${sidebarCollapsed ? "lg:grid-cols-[96px_minmax(0,1fr)]" : "lg:grid-cols-[306px_minmax(0,1fr)]"}`}>
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} sidebar-dark fixed inset-y-0 left-0 z-40 flex w-[306px] flex-col border-r border-[var(--sidebar-border)] px-5 py-6 transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${sidebarCollapsed ? "lg:w-[96px]" : "lg:w-[306px]"}`}>
          <div className="space-y-1 px-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                 <div className="flex h-13 w-13 items-center justify-center overflow-hidden ">
                                  <Image src="/assets/profile/logo/immoflow-logo.png" alt="ImmoFlow logo" width={100} height={100} className="h-full w-full object-contain" />
                                </div>
              </div>
              <button type="button" className="hidden rounded-full p-2 text-[var(--sidebar-text)]/70 transition hover:bg-[var(--sidebar-hover-bg)] lg:block" onClick={() => setSidebarCollapsed((current) => !current)}>
                <ChevronLeft className={`h-5 w-5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
              </button>
              <button type="button" className="rounded-full p-2 text-[var(--sidebar-text)]/70 lg:hidden" onClick={() => setSidebarOpen(false)}>
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
            <div className={`rounded-[20px] border border-[var(--sidebar-border)] bg-[var(--accent)]/25 p-2 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold text-[var(--sidebar-text)] transition hover:bg-[var(--sidebar-hover-bg)]"
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
                    <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)]" onClick={openCreateProperty}>
                      Add property
                    </button>
                    <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)]" onClick={openContractWizard}>
                      Create contract
                    </button>
                    <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)]" onClick={openUserWizard}>
                      Add user
                    </button>
                    <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)]" onClick={() => openTab("notifications")}>
                      New message
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`space-y-2 border-t border-[var(--sidebar-border)] pt-4 text-[15px] text-[var(--sidebar-text)] ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)]">
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
                  placeholder={searchPlaceholder}
                  className="h-12 rounded-2xl border-[var(--border)] bg-white pl-12 shadow-[var(--shadow-sm)] focus-visible:ring-[var(--ring)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4">
              <NotificationsPopover
                token={token}
                userId={user.id}
                notifications={notifications}
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
                      <div className="pb-1 text-sm font-semibold text-[var(--success)]">+ live inventory</div>
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
                        {contrats.length === 0
                          ? "No contracts yet"
                          : `${Math.round((activeContractsCount / contrats.length) * 100)}% occupancy`}
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

                  <div className="rounded-3xl stat-indigo p-7 shadow-[var(--shadow-primary)] card-lift">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                          Pending Visits
                        </div>
                        <div className="mt-4 text-5xl font-bold tracking-tight">{pendingVisits}</div>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]">
                        <CalendarDays className="h-6 w-6 text-[var(--primary)]" />
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

                    <div className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
                      <div className="min-w-[760px]">
                        <div className="grid grid-cols-[120px_minmax(0,1.5fr)_180px_160px] gap-4 border-b border-[var(--border)] bg-[var(--muted)] px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
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
                            className="table-row-hover grid w-full grid-cols-[120px_minmax(0,1.5fr)_180px_160px] gap-4 border-b border-[var(--border)] px-8 py-4 text-left last:border-b-0"
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
                              <div className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                                {item.description}
                              </div>
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

                </div>

                <div className="grid gap-6">
                  <div className="overflow-x-auto rounded-[24px] border border-black/6 bg-white">
                    <div className="min-w-[1140px]">
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
                        <div
                          key={property.logement.id}
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
                                onClick={() => openPropertyDetail(property.logement.id)}
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
                  </div>

                  <Dialog open={propertyPanelOpen} onOpenChange={setPropertyPanelOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 sm:max-w-[780px]">
                      <DialogHeader className="border-b border-black/8 px-6 py-4">
                        <DialogTitle className="text-[22px] font-semibold">
                          {editingPropertyId ? "Edit Property" : "Add Property"}
                        </DialogTitle>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                          Step {propertyWizardStep + 1} of 2
                        </div>
                      </DialogHeader>

                      <div className="h-1 bg-black/8">
                        <div
                          className="h-full bg-[var(--primary)] transition-all duration-300"
                          style={{ width: `${((propertyWizardStep + 1) / 2) * 100}%` }}
                        />
                      </div>

                      <div className="space-y-4 px-6 py-6">
                        <div className="text-sm text-black/50">
                          {editingPropertyId
                            ? "Update the selected property directly from the dashboard."
                            : "Publish a new property with a real agent, type, and commune."}
                        </div>

                        {propertyWizardStep === 0 ? (
                          <>
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
                          </>
                        ) : (
                          <>
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

                            <div className="space-y-3 rounded-[20px] bg-[#f6f6f4] p-4">
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
                              {propertyForm.locataire_id ? (
                                <div className="grid gap-3 md:grid-cols-3">
                                  <Input
                                    type="date"
                                    value={propertyForm.contrat_date_debut}
                                    onChange={(event) => setPropertyForm((current) => ({ ...current, contrat_date_debut: event.target.value }))}
                                  />
                                  <Input
                                    type="date"
                                    value={propertyForm.contrat_date_fin}
                                    onChange={(event) => setPropertyForm((current) => ({ ...current, contrat_date_fin: event.target.value }))}
                                  />
                                  <select
                                    className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4"
                                    value={propertyForm.contrat_statut}
                                    onChange={(event) => setPropertyForm((current) => ({ ...current, contrat_statut: event.target.value }))}
                                  >
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                  </select>
                                </div>
                              ) : null}
                            </div>

                            <div className="space-y-3">
                              <Label>House images</Label>
                              <div className="text-xs font-medium text-black/60">
                                {totalPropertyImageCount}/10 images selected (minimum 2)
                              </div>
                              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-[#fbfbfa] px-4 py-5 text-center transition hover:bg-[#f6f6f4]">
                                <UploadCloud className="h-6 w-6 text-black/45" />
                                <span className="mt-2 text-sm font-semibold">Upload property photos</span>
                                <span className="mt-1 text-xs text-black/45">Large JPG, PNG, or WebP files are optimized automatically</span>
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
                                <div className="text-xs text-black/50">Preparing images for upload...</div>
                              ) : null}
                              {propertyExistingImages.length > 0 ? (
                                <div>
                                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Existing images</div>
                                  <div className="grid gap-3 sm:grid-cols-3">
                                    {propertyExistingImages.map((imageUrl, index) => (
                                      <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded-2xl border border-black/8 bg-white">
                                        <img src={imageUrl} alt={`Property ${index + 1}`} className="h-24 w-full object-cover" />
                                        <div className="flex items-center justify-end px-2 py-2">
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
                                <div>
                                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/45">New uploads</div>
                                  <div className="grid gap-3 sm:grid-cols-3">
                                    {propertyImageFiles.map((file, index) => (
                                      <div key={`${file.name}-${file.size}-${file.lastModified}`} className="overflow-hidden rounded-2xl border border-black/8 bg-white">
                                        {propertyImagePreviewUrls[index] ? (
                                          <img src={propertyImagePreviewUrls[index]} alt={file.name} className="h-24 w-full object-cover" />
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
                          </>
                        )}

                        <div className="flex items-center justify-between gap-3 pt-2">
                          <Button
                            variant="outline"
                            className="rounded-2xl"
                            disabled={propertyWizardStep === 0 || busy}
                            onClick={() => setPropertyWizardStep(0)}
                          >
                            Back
                          </Button>
                          {propertyWizardStep === 0 ? (
                            <Button
                              className="rounded-2xl"
                              disabled={!propertyForm.agent_id || !propertyForm.type_logement_id || !propertyForm.commune_id || !propertyForm.adresse || busy}
                              onClick={() => setPropertyWizardStep(1)}
                            >
                              Continue
                            </Button>
                          ) : (
                            <div className="flex gap-3">
                              {editingPropertyId ? (
                                <Button variant="outline" className="rounded-2xl" onClick={resetPropertyEditor}>
                                  Cancel
                                </Button>
                              ) : null}
                              <Button className="rounded-2xl" disabled={busy || preparingImages || totalPropertyImageCount < 2 || totalPropertyImageCount > 10} onClick={() => void handlePropertySubmit()}>
                                {editingPropertyId ? "Save changes" : "Add property"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                          {selectedProperty.logement.images?.[0] ? (
                            <button
                              type="button"
                              className="absolute inset-0 block h-full w-full"
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
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            </button>
                          ) : null}
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

                    <div className="rounded-[28px] border border-black/6 bg-white p-7">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/35">House information</div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                                <Input value={paymentForm.rib} onChange={(event) => setPaymentForm((current) => ({ ...current, rib: event.target.value }))} placeholder="RIB / IBAN" />
                                <Input value={paymentForm.reference} onChange={(event) => setPaymentForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Transfer reference" />
                              </div>
                            </div>
                          ) : null}
                          {paymentForm.mode === "Cash" ? (
                            <textarea
                              className="min-h-20 w-full rounded-2xl border border-black/8 bg-[#f6f6f4] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
                              value={paymentForm.cash_note}
                              onChange={(event) => setPaymentForm((current) => ({ ...current, cash_note: event.target.value }))}
                              placeholder="Cash receipt note: receiver, place, receipt number..."
                            />
                          ) : null}
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
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-[42px] font-semibold tracking-tight">
                      Contracts <span className="align-middle text-base font-medium uppercase tracking-[0.18em] text-black/45">{activeContractsCount} active</span>
                    </h1>
                    <p className="mt-2 text-black/55">Review and create lease agreements across the portfolio.</p>
                  </div>
                  <Button className="rounded-2xl" onClick={openContractWizard}>
                    <Plus className="h-4 w-4" />
                    Create contract
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-[24px] border border-black/6 bg-white">
                  <div className="min-w-[1080px]">
                    <div className="grid grid-cols-[100px_minmax(0,1fr)_1fr_130px_130px_130px_56px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                      <div>Ref</div>
                      <div>Tenant</div>
                      <div>Property</div>
                      <div>Start</div>
                      <div>End</div>
                      <div>Rent</div>
                      <div />
                    </div>
                    {filteredContracts.map((contrat) => (
                      <div
                        key={contrat.id}
                        className="grid grid-cols-[100px_minmax(0,1fr)_1fr_130px_130px_130px_56px] gap-4 border-t border-black/6 px-7 py-4"
                      >
                      <div className="self-center font-mono text-sm text-black/60">CTR-{String(contrat.id).padStart(4, "0")}</div>
                      <div className="self-center">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={contrat.locataire.user.avatar_url ?? undefined} alt={contrat.locataire.user.name} />
                            <AvatarFallback>{initials(contrat.locataire.user.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{contrat.locataire.user.name}</span>
                        </div>
                      </div>
                      <div className="self-center text-black/70">{contrat.logement.adresse}</div>
                      <div className="self-center text-black/55">{formatShortDate(contrat.date_debut)}</div>
                      <div className="self-center text-black/55">{formatShortDate(contrat.date_fin)}</div>
                      <div className="self-center">{formatMoney(contrat.montant)} MAD</div>
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
                            <DropdownMenuItem className="text-red-700 focus:text-red-700" onClick={() => void handleDeleteContract(contrat)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      </div>
                    ))}
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
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() =>
                        downloadTextFile(
                          "payments.csv",
                          ["Tenant,Property,Amount,Date,Mode,Status"]
                            .concat(
                              filteredPayments.map((paiement) =>
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
                    <Button className="rounded-2xl" onClick={openPaymentWizard}>
                      <Plus className="h-4 w-4" />
                      Record payment
                    </Button>
                  </div>
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

                <div className="overflow-x-auto rounded-[24px] border border-black/6 bg-white">
                  <div className="min-w-[920px]">
                    <div className="grid grid-cols-[minmax(0,1fr)_1fr_140px_140px_140px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                      <div>Tenant</div>
                      <div>Property</div>
                      <div>Paid</div>
                      <div>Date</div>
                      <div>Status</div>
                    </div>
                    {filteredPayments.map((paiement) => (
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
                </div>
              </section>
            ) : null}

            {activeTab === "tenants" ? (
              <section className="space-y-6">
                <div>
                  <h1 className="text-[30px] font-semibold tracking-tight">Tenants</h1>
                  <p className="mt-2 text-black/55">Live locataire records linked to active contracts.</p>
                </div>

                <div className="overflow-x-auto rounded-[24px] border border-black/6 bg-white">
                  <div className="min-w-[980px]">
                    <div className="grid grid-cols-[minmax(0,1.2fr)_1fr_180px_150px_140px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                      <div>Tenant</div>
                      <div>Email</div>
                      <div>Residence</div>
                      <div>Rent</div>
                      <div>Status</div>
                    </div>

                    {filteredTenantRows.map((row) => (
                      <div
                        key={row.user.id}
                        className="grid grid-cols-[minmax(0,1.2fr)_1fr_180px_150px_140px] gap-4 border-t border-black/6 px-7 py-4"
                      >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={row.user.avatar_url ?? undefined} alt={row.user.name} />
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
                    <Button className="rounded-2xl" onClick={openUserWizard}>
                      <Plus className="h-4 w-4" />
                      Invite New User
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="hidden overflow-x-auto rounded-[24px] border border-black/6 bg-white lg:block">
                    <div className="min-w-[1020px]">
                      <div className="grid grid-cols-[minmax(0,1.4fr)_1fr_170px_120px_140px_150px] gap-4 bg-[#f6f6f4] px-7 py-5 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
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
                            className="grid grid-cols-[minmax(0,1.4fr)_1fr_170px_120px_140px_150px] gap-4 border-t border-black/6 px-7 py-5"
                          >
                            <div className="flex items-center gap-4">
                              <Avatar className="h-11 w-11">
                                <AvatarImage src={entry.avatar_url ?? undefined} alt={entry.name} />
                                <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="truncate text-[17px] font-semibold">{entry.name}</div>
                                <div className="text-sm uppercase tracking-[0.16em] text-black/40">
                                  {entry.role.replace("_", " ")}
                                </div>
                              </div>
                            </div>
                            <div className="self-center truncate text-[15px]">{entry.email}</div>
                            <div className="self-center text-[15px]">{entry.phone ?? "No phone"}</div>
                            <div className="self-center">
                              <span className="rounded-xl bg-black/6 px-3 py-2 text-sm font-semibold">{recordCount}</span>
                            </div>
                            <div className="self-center">
                              <Badge variant={toneForStatus(entry.status)}>{entry.status}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${entry.status === "active" ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                                    disabled={busy}
                                    onClick={() => void handleStatusUpdate(entry.id, "active", entry.name)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Set Active</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${entry.status === "pending" ? "border-amber-500 bg-amber-500 text-white" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                                    disabled={busy}
                                    onClick={() => void handleStatusUpdate(entry.id, "pending", entry.name)}
                                  >
                                    <Clock3 className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Set Pending</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border ${entry.status === "suspended" ? "border-red-600 bg-red-600 text-white" : "border-red-200 bg-red-50 text-red-700"}`}
                                    disabled={busy}
                                    onClick={() => void handleStatusUpdate(entry.id, "suspended", entry.name)}
                                  >
                                    <Ban className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Set Suspended</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 lg:hidden">
                    {visibleUsers.map((entry) => {
                      const recordCount =
                        entry.role === "agent"
                          ? logements.filter((logement) => logement.agent.user.id === entry.id).length
                          : entry.role === "locataire"
                            ? contrats.filter((contrat) => contrat.locataire.user.id === entry.id).length
                            : users.filter((candidate) => candidate.managed_by_id === entry.id).length;

                      return (
                        <div key={entry.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-11 w-11">
                              <AvatarImage src={entry.avatar_url ?? undefined} alt={entry.name} />
                              <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-semibold text-[var(--foreground)]">{entry.name}</div>
                              <div className="truncate text-sm text-[var(--muted-foreground)]">{entry.email}</div>
                              <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                                {entry.role.replace("_", " ")}
                              </div>
                            </div>
                            <Badge variant={toneForStatus(entry.status)}>{entry.status}</Badge>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">{entry.phone ?? "No phone"}</span>
                            <span className="rounded-lg bg-black/6 px-2.5 py-1 text-xs font-semibold">
                              {recordCount} records
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              title="Set Active"
                              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${entry.status === "active" ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                              disabled={busy}
                              onClick={() => void handleStatusUpdate(entry.id, "active", entry.name)}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Set Pending"
                              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${entry.status === "pending" ? "border-amber-500 bg-amber-500 text-white" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                              disabled={busy}
                              onClick={() => void handleStatusUpdate(entry.id, "pending", entry.name)}
                            >
                              <Clock3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Set Suspended"
                              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${entry.status === "suspended" ? "border-red-600 bg-red-600 text-white" : "border-red-200 bg-red-50 text-red-700"}`}
                              disabled={busy}
                              onClick={() => void handleStatusUpdate(entry.id, "suspended", entry.name)}
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
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
              <section className="grid gap-6 xl:grid-cols-1">
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

            <Dialog open={contractWizardOpen} onOpenChange={setContractWizardOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 sm:max-w-[760px]">
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
                          onChange={(event) => {
                            const tenantId = event.target.value;
                            const tenantContract = contrats.find((contrat) => String(contrat.locataire.id) === tenantId);
                            setContractForm((current) => ({
                              ...current,
                              locataire_id: tenantId,
                              logement_id: tenantContract ? String(tenantContract.logement.id) : "",
                              agent_id: tenantContract ? String(tenantContract.agent.id) : current.agent_id,
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
                          value={contractForm.logement_id}
                          onChange={(event) => {
                            const selected = logements.find((entry) => String(entry.id) === event.target.value);
                            setContractForm((current) => ({
                              ...current,
                              logement_id: event.target.value,
                              agent_id: selected ? String(selected.agent.id) : current.agent_id,
                              montant: selected?.loyer ?? current.montant,
                              statut: selected ? "active" : current.statut,
                            }));
                          }}
                        >
                          <option value="">Select property</option>
                          {contractPropertyOptions.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.adresse} • {entry.commune.nom}
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
                      <div className="grid gap-4 md:grid-cols-2">
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
                        disabled={!contractForm.agent_id || !contractForm.locataire_id || !contractForm.logement_id || busy}
                        onClick={() => setContractWizardStep(1)}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        className="rounded-2xl"
                        disabled={!contractForm.date_debut || !contractForm.montant || busy}
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
                          <span className="font-semibold">CTR-{String(contractDetails.id).padStart(4, "0")}</span>
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
              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 sm:max-w-[760px]">
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
                    </>
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Method</Label>
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
                            <option value="awaiting_tenant_approval">Needs tenant approval</option>
                            <option value="partial">Partial</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      </div>
                      {paymentForm.mode === "Virement" ? (
                        <div className="rounded-[20px] bg-[#f6f6f4] p-4">
                          <div className="text-sm font-semibold">Bank transfer details</div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <Input value={paymentForm.rib} onChange={(event) => setPaymentForm((current) => ({ ...current, rib: event.target.value }))} placeholder="RIB / IBAN" />
                            <Input value={paymentForm.reference} onChange={(event) => setPaymentForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Transfer reference" />
                          </div>
                        </div>
                      ) : null}
                      {paymentForm.mode === "Cash" ? (
                        <textarea
                          className="min-h-20 w-full rounded-2xl border border-black/8 bg-[#f6f6f4] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
                          value={paymentForm.cash_note}
                          onChange={(event) => setPaymentForm((current) => ({ ...current, cash_note: event.target.value }))}
                          placeholder="Cash receipt note: receiver, place, receipt number..."
                        />
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
                      <Button className="rounded-2xl" disabled={busy} onClick={() => void handleRecordPayment()}>
                        Confirm payment
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={userWizardOpen}
              onOpenChange={(open) => {
                setUserWizardOpen(open);
                if (!open) {
                  resetUserWizardState();
                }
              }}
            >
              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 sm:max-w-[760px]">
                <DialogHeader className="border-b border-black/8 px-6 py-4">
                  <DialogTitle className="flex items-center gap-3 text-[22px]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                      <UserPlus className="h-5 w-5" />
                    </span>
                    Add user or agent
                  </DialogTitle>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                    Step {userWizardStep + 1} of 3
                  </div>
                </DialogHeader>

                <div className="h-1 bg-black/8">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${((userWizardStep + 1) / 3) * 100}%` }}
                  />
                </div>

                <div className="space-y-4 px-6 py-6">
                  {userWizardStep === 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
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
                  ) : null}

                  {userWizardStep === 1 ? (
                    <div className="grid gap-4 md:grid-cols-2">
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
                    </div>
                  ) : null}

                  {userWizardStep === 2 ? (
                    <div className="grid gap-4 md:grid-cols-2">
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
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      disabled={userWizardStep === 0 || busy}
                      onClick={() => setUserWizardStep((current) => Math.max(0, current - 1))}
                    >
                      Back
                    </Button>
                    {userWizardStep < 2 ? (
                      <Button
                        className="rounded-2xl"
                        disabled={
                          busy ||
                          (userWizardStep === 0 && !userForm.role) ||
                          (userWizardStep === 1 && (!userForm.name || !userForm.email))
                        }
                        onClick={() => setUserWizardStep((current) => Math.min(2, current + 1))}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        className="rounded-2xl"
                        disabled={busy || !userForm.password || userForm.password !== userForm.password_confirmation}
                        onClick={() => void handleCreateUser()}
                      >
                        Create User
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
