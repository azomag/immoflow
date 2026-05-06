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
  ExternalLink,
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
  MapPin,
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
import { getLandingUrl } from "@/lib/app-routes";
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
  initialTab?: AdminTab;
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
  initialTab,
}: AdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab ?? "dashboard");
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
  <button
    type="button"
    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    className="absolute -right-4 top-8 hidden h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:-right-5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] lg:flex"
    onClick={() => setSidebarCollapsed((current) => !current)}
  >
    <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`} />
  </button>
  <div className="space-y-1 px-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
         <div className="flex h-13 w-13 items-center justify-center overflow-hidden ">
          <Image src="/assets/profile/logo/immoflow-logo.png" alt="ImmoFlow logo" width={100} height={100} className="h-full w-full object-contain" />
        </div>
      </div>
      <button type="button" className="rounded-full p-2 text-[var(--sidebar-text)]/70 lg:hidden" onClick={() => setSidebarOpen(false)}>
        <X className="h-5 w-5" />
      </button>
    </div>
    <div className="h-4" />
  </div>

  {/* FIXED NAV SECTION */}
 <nav className="mt-8 flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              
              const link = (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openTab(item.id)}
                  // Explicit flex classes ensure they stack and align perfectly
                  className={`flex w-full items-center rounded-xl transition-all duration-200 ${
                    sidebarCollapsed ? "justify-center p-3" : "px-3 py-2.5 gap-3"
                  } ${
                    isActive
                      ? "bg-[var(--primary)] text-white shadow-md"
                      : "text-[var(--sidebar-text)] hover:bg-black/5 hover:text-[var(--foreground)]"
                  }`}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : ""}`} />
                  
                  {/* React safely removes the text from the DOM when collapsed */}
                  {!sidebarCollapsed && (
                    <span className="truncate text-sm font-medium">{item.label}</span>
                  )}
                </button>
              );

              return sidebarCollapsed ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent 
                    side="right" 
                    sideOffset={16} 
                    className="rounded-lg bg-white/90 backdrop-blur-lg font-semibold text-[var(--foreground)] shadow-xl border border-white/20"
                  >
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </nav>

  <div className="mt-auto space-y-5 pt-10">
    
    <div className={`space-y-2 border-t border-[var(--sidebar-border)] pt-4 text-[15px] text-[var(--sidebar-text)] ${sidebarCollapsed ? "lg:hidden" : ""}`}>
      <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)]">
        <CircleHelp className="h-5 w-5 shrink-0" />
        <span>Support</span>
      </button>
      <a
        href={getLandingUrl()}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-active)]"
      >
        <ExternalLink className="h-5 w-5 shrink-0" />
        <span>Landing page</span>
      </a>
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

    <main className="min-w-0 flex-1 overflow-y-auto bg-[#fafafa]/50 px-4 py-6 md:px-8 md:py-8">
  <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 xl:flex-row xl:items-center xl:justify-between">
    <div className="flex w-full items-center gap-3 xl:max-w-[640px]">
      <button
        type="button"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--foreground)] shadow-sm transition-colors hover:bg-slate-50 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-white pl-11 text-sm shadow-sm transition-all focus-visible:border-[var(--primary)] focus-visible:ring-4 focus-visible:ring-[var(--primary)]/10"
        />
      </div>
    </div>

    <div className="flex shrink-0 items-center justify-end gap-3">
      <NotificationsPopover
        token={token}
        userId={user.id}
        notifications={notifications}
      />
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] shadow-sm transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)] hover:shadow-md"
      >
        <CircleHelp className="h-[18px] w-[18px]" />
      </button>
      <div className="ml-1 pl-4 border-l border-[var(--border)]">
        <AvatarMenu user={user} onProfile={() => openTab("profile")} />
      </div>
    </div>
  </header>

  {(notice || error) ? (
    <div className="fixed right-6 top-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-xl animate-in slide-in-from-top-4">
      <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${error ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
        {error ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
      </div>
      <div>
        <div className={`text-sm font-semibold ${error ? "text-red-600" : "text-green-600"}`}>
          {error ? "Action failed" : "Success"}
        </div>
        <div className="mt-1 text-sm text-[var(--muted-foreground)]">{error ?? notice}</div>
      </div>
    </div>
  ) : null}

  <div ref={contentRef} className="mt-8 space-y-8 pb-12">
    {/* ── DASHBOARD TAB ── */}
    {activeTab === "dashboard" ? (
      <>
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_280px]">
          <div className="group rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm transition-all hover:shadow-md card-lift">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              My Properties
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{logements.length}</div>
              <div className="text-xs font-medium text-emerald-600">+ live inventory</div>
            </div>
          </div>

          <div className="group rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm transition-all hover:shadow-md card-lift">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 transition-colors group-hover:bg-cyan-100">
              <FileText className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Active Contracts
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{activeContractsCount}</div>
              <div className="text-xs font-medium text-[var(--muted-foreground)]">
                {contrats.length === 0 ? "No contracts yet" : `${Math.round((activeContractsCount / contrats.length) * 100)}% occupancy`}
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm transition-all hover:shadow-md card-lift">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Collections
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-3xl font-bold tracking-tight text-[var(--foreground)]">{formatMoney(collectionsTotal)}</div>
              <div className="text-xs font-medium text-[var(--muted-foreground)]">MAD</div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl bg-[var(--primary)] p-6 text-white shadow-lg card-lift sm:col-span-2 xl:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Pending Visits
                </div>
                <div className="mt-2 text-4xl font-bold tracking-tight">{pendingVisits}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <div className="mb-5 flex items-center justify-between px-1">
              <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">My Properties</h2>
              <button
                type="button"
                className="text-sm font-semibold text-[var(--primary)] transition hover:text-[var(--primary-hover)] hover:underline hover:underline-offset-4"
                onClick={() => openTab("properties")}
              >
                View All
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
              <div className="w-full">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[var(--border)] bg-slate-50/50 px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] sm:grid-cols-[100px_minmax(0,1.5fr)_140px_140px] sm:px-6">
                  <div className="hidden sm:block">Ref</div>
                  <div>Property Name</div>
                  <div className="text-right sm:text-left">Status</div>
                  <div className="hidden sm:block">Next Visit</div>
                </div>

                {propertySnapshots.slice(0, 4).map((property) => (
                  <button
                    key={property.logement.id}
                    type="button"
                    onClick={() => openPropertyDetail(property.logement.id)}
                    className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--border)] px-4 py-4 text-left transition-colors hover:bg-slate-50/80 last:border-b-0 sm:grid-cols-[100px_minmax(0,1.5fr)_140px_140px] sm:px-6"
                  >
                    <div className="hidden text-sm font-medium text-[var(--muted-foreground)] sm:block">{property.ref}</div>
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-slate-50 text-xs font-bold text-[var(--foreground)] group-hover:bg-white">
                        {property.logement.type_logement.nom_type.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--foreground)]">{property.logement.adresse}</div>
                        <div className="truncate text-xs text-[var(--muted-foreground)]">
                          {property.tenantName ?? property.logement.commune.nom}
                        </div>
                      </div>
                    </div>
                    <div className="text-right sm:text-left">
                      <Badge variant={toneForStatus(property.status) as any}>{property.status}</Badge>
                    </div>
                    <div className="hidden text-sm font-medium text-[var(--muted-foreground)] sm:block">
                      {formatShortDate(property.nextEventDate)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="mb-5 px-1 text-xl font-bold tracking-tight text-[var(--foreground)]">Recent Activity</h2>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <div className="space-y-6">
                {recentActivity.map((item, index) => (
                  <div key={item.id} className="relative flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className="z-10 h-3.5 w-3.5 rounded-full border-2 border-[var(--primary)] bg-white ring-4 ring-[var(--primary)]/10" />
                      {index !== recentActivity.length - 1 ? (
                        <div className="absolute bottom-[-24px] top-3.5 w-px bg-[var(--border)]" />
                      ) : null}
                    </div>
                    <div className="-mt-1.5 min-w-0 pb-1">
                      <div className="truncate text-sm font-semibold text-[var(--foreground)]">{item.title}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)] line-clamp-2">
                        {item.description}
                      </div>
                      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]">
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

    {/* ── PROPERTIES TAB (LIST) ── */}
    {activeTab === "properties" && !selectedProperty ? (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Properties</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Manage {filteredProperties.length} total units in your portfolio.</p>
          </div>
          <Button className="w-full sm:w-auto rounded-xl shadow-sm" onClick={openCreateProperty}>
            <Plus className="mr-2 h-4 w-4" />
            Add property
          </Button>
        </div>

        <div className="flex overflow-x-auto items-center gap-2 border-b border-[var(--border)] pb-4 hide-scrollbar">
          {propertyTypeTabs.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setTypeFilter(entry)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === entry
                  ? "bg-slate-100 text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-slate-50 hover:text-[var(--foreground)]"
              }`}
            >
              {entry}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm w-full">
          <div className="min-w-[1140px]">
            <div className="grid grid-cols-[100px_minmax(0,1.5fr)_130px_100px_120px_140px_160px_56px] gap-4 border-b border-[var(--border)] bg-slate-50/50 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
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
                className="group grid w-full cursor-pointer grid-cols-[100px_minmax(0,1.5fr)_130px_100px_120px_140px_160px_56px] items-center gap-4 border-b border-[var(--border)] px-6 py-3.5 text-left text-sm transition-colors hover:bg-slate-50/80 last:border-b-0"
              >
                <div className="font-medium text-[var(--muted-foreground)]">{property.ref}</div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[var(--foreground)]">{property.logement.adresse}</div>
                  <div className="truncate text-xs text-[var(--muted-foreground)]">{property.logement.commune.nom}</div>
                </div>
                <div className="text-[var(--foreground)]">{property.logement.type_logement.nom_type}</div>
                <div className="text-[var(--muted-foreground)]">{property.logement.superficie} m²</div>
                <div className="font-medium text-[var(--foreground)]">{formatMoney(property.logement.loyer)} MAD</div>
                <div>
                  <Badge variant={toneForStatus(property.status)}>{property.status}</Badge>
                </div>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-7 w-7 shrink-0 border border-[var(--border)]">
                    <AvatarFallback className="text-[10px]">{initials(property.logement.agent.user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-[var(--foreground)]">{property.logement.agent.user.name}</span>
                </div>
                <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Property actions"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--muted-foreground)] shadow-sm transition-colors hover:bg-slate-50 hover:text-[var(--foreground)]"
                      >
                        <Ellipsis className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                      <DropdownMenuItem onClick={() => openPropertyDetail(property.logement.id)}>
                        <Eye className="mr-2 h-4 w-4 text-[var(--muted-foreground)]" />
                        Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => beginEditProperty(property)}>
                        <PencilLine className="mr-2 h-4 w-4 text-blue-600" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!property.latestContract} onClick={() => handleInvoice(property)}>
                        <FileDown className="mr-2 h-4 w-4 text-emerald-600" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => void handleDeleteProperty(property)}>
                        <Trash2 className="mr-2 h-4 w-4" />
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

    {/* ── PROPERTIES TAB (DETAIL VIEW) ── */}
    {activeTab === "properties" && selectedProperty ? (
      <section className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedPropertyId(null)}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to properties
        </button>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              <MapPin className="h-3.5 w-3.5" />
              {selectedProperty.logement.commune.nom}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {selectedProperty.logement.adresse}
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm font-medium text-[var(--muted-foreground)]">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[var(--foreground)]">
                {selectedProperty.logement.type_logement.nom_type}
              </span>
              <span>Ref: {selectedProperty.ref}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="flex-1 sm:flex-none rounded-xl shadow-sm bg-white" onClick={() => handleShareProperty(selectedProperty)}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button variant="default" className="flex-1 sm:flex-none rounded-xl shadow-sm" onClick={() => beginEditProperty(selectedProperty)}>
              <PencilLine className="mr-2 h-4 w-4" /> Edit Property
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6 min-w-0">
            {/* Hero Image Section */}
            <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-slate-100 shadow-sm w-full">
              <div className="aspect-[16/9] w-full md:aspect-[21/9]">
                {selectedProperty.logement.images?.[0] ? (
                  <img
                    src={selectedProperty.logement.images[0]}
                    alt={selectedProperty.logement.adresse}
                    className="h-full w-full cursor-pointer object-cover transition-transform duration-500 group-hover:scale-105"
                    onClick={() => setPropertyImageViewer({ images: selectedProperty.logement.images ?? [], index: 0 })}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">No image available</div>
                )}
              </div>
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <Badge variant={toneForStatus(selectedProperty.status)} className="shadow-lg">{selectedProperty.status}</Badge>
              </div>
            </div>

            {/* Sub-images */}
            {selectedProperty.logement.images && selectedProperty.logement.images.length > 1 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {selectedProperty.logement.images.slice(1, 5).map((image, idx) => (
                  <button
                    key={idx}
                    className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border)] shadow-sm transition hover:opacity-90"
                    onClick={() => setPropertyImageViewer({ images: selectedProperty.logement.images ?? [], index: idx + 1 })}
                  >
                    <img src={image} className="h-full w-full object-cover" alt="Property view" />
                    {idx === 3 && selectedProperty.logement.images!.length > 5 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white backdrop-blur-sm">
                        +{selectedProperty.logement.images!.length - 5}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Area</div>
                <div className="mt-1 text-xl font-bold text-[var(--foreground)]">{selectedProperty.logement.superficie} <span className="text-sm font-medium text-[var(--muted-foreground)]">m²</span></div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Rent</div>
                <div className="mt-1 text-xl font-bold text-[var(--foreground)]">{formatMoney(selectedProperty.logement.loyer)} <span className="text-sm font-medium text-[var(--muted-foreground)]">MAD</span></div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Collections</div>
                <div className="mt-1 text-xl font-bold text-[var(--foreground)]">{formatMoney(selectedProperty.collectionsTotal)} <span className="text-sm font-medium text-[var(--muted-foreground)]">MAD</span></div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Payments</div>
                <div className="mt-1 text-xl font-bold text-[var(--foreground)]">{selectedProperty.paymentCount}</div>
              </div>
            </div>

            {/* Description & Features */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">Property Details</h3>
              
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Bedrooms", value: selectedProperty.logement.chambres ?? "Not set", icon: BedDouble },
                  { label: "Bathrooms", value: selectedProperty.logement.salles_bain ?? "Not set", icon: Bath },
                  { label: "Floor", value: selectedProperty.logement.etage ?? "Not set", icon: Layers3 },
                  { label: "Heating", value: selectedProperty.logement.chauffage ?? "Not set", icon: Flame },
                  { label: "Parking", value: selectedProperty.logement.parking ? "Included" : "None", icon: CarFront },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-slate-50/50 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm text-[var(--primary)]">
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
                  {selectedProperty.logement.description || "No detailed description provided for this property."}
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar in Detail View */}
          <div className="space-y-6 min-w-0">
            {/* Agent Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Assigned Agent</div>
              <div className="mt-4 flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-[var(--border)]">
                  <AvatarFallback className="text-lg">{initials(selectedProperty.logement.agent.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-bold text-[var(--foreground)]">{selectedProperty.logement.agent.user.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{selectedProperty.logement.agent.user.email}</div>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-5 w-full rounded-xl"
                onClick={() => { window.location.href = `mailto:${selectedProperty.logement.agent.user.email}`; }}
              >
                <Mail className="mr-2 h-4 w-4" /> Contact Agent
              </Button>
            </div>

            {/* Contract Summary */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Active Contract</div>
                {selectedProperty.activeContract && (
                  <Badge variant="success" className="shadow-sm">Active</Badge>
                )}
              </div>
              
              {selectedProperty.activeContract ?? selectedProperty.latestContract ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-[var(--border)] pb-2">
                    <span className="text-[var(--muted-foreground)]">Tenant</span>
                    <span className="truncate pl-2 font-semibold text-[var(--foreground)]">{(selectedProperty.activeContract ?? selectedProperty.latestContract)?.locataire.user.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--border)] pb-2">
                    <span className="text-[var(--muted-foreground)]">Starts</span>
                    <span className="font-semibold text-[var(--foreground)]">{formatShortDate((selectedProperty.activeContract ?? selectedProperty.latestContract)?.date_debut ?? null)}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-[var(--muted-foreground)]">Ends</span>
                    <span className="font-semibold text-[var(--foreground)]">{formatShortDate((selectedProperty.activeContract ?? selectedProperty.latestContract)?.date_fin ?? null, "Open")}</span>
                  </div>
                  <Button
                    className="mt-2 w-full rounded-xl"
                    onClick={() => {
                      const property = logements.find((entry) => entry.id === selectedProperty.logement.id) ?? null;
                      downloadContractPdf(selectedProperty.activeContract ?? selectedProperty.latestContract!, property);
                    }}
                  >
                    <FileDown className="mr-2 h-4 w-4" /> Download Lease PDF
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-[var(--muted-foreground)]">
                  No active lease agreement for this property.
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-[var(--border)] bg-slate-900 p-6 shadow-lg text-white">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Quick Actions</div>
              <div className="mt-4 space-y-3">
                <Button
                  className="w-full justify-start bg-white/10 text-white hover:bg-white/20 border-0 rounded-xl"
                  onClick={() => {
                    setPaymentForm((current) => ({
                      ...current,
                      contrat_id: String(selectedProperty.activeContract?.id ?? ""),
                      montant: selectedProperty.activeContract?.montant ?? current.montant,
                    }));
                    setPaymentWizardOpen(true); // FIX: Make sure the payment modal actually opens
                  }}
                  disabled={!selectedProperty.activeContract}
                >
                  <CreditCard className="mr-3 h-4 w-4 text-emerald-400" /> Collect Payment
                </Button>
                <Button
                  className="w-full justify-start bg-white/10 text-white hover:bg-white/20 border-0 rounded-xl"
                  onClick={() => handleInvoice(selectedProperty)}
                >
                  <FileText className="mr-3 h-4 w-4 text-blue-400" /> Generate Invoice
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    ) : null}

    {/* ── CONTRACTS TAB ── */}
    {activeTab === "contracts" ? (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Contracts</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Manage {filteredContracts.length} lease agreements.</p>
          </div>
          <Button className="w-full sm:w-auto rounded-xl shadow-sm" onClick={openContractWizard}>
            <Plus className="mr-2 h-4 w-4" /> Create contract
          </Button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm w-full">
          <div className="min-w-[1080px]">
            <div className="grid grid-cols-[100px_minmax(0,1fr)_1fr_130px_130px_130px_56px] gap-4 border-b border-[var(--border)] bg-slate-50/50 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              <div>Ref</div>
              <div>Tenant</div>
              <div>Property</div>
              <div>Start Date</div>
              <div>End Date</div>
              <div>Rent</div>
              <div />
            </div>
            {filteredContracts.map((contrat) => (
              <div
                key={contrat.id}
                className="group grid grid-cols-[100px_minmax(0,1fr)_1fr_130px_130px_130px_56px] items-center gap-4 border-b border-[var(--border)] px-6 py-4 text-sm transition-colors hover:bg-slate-50/80 last:border-b-0"
              >
                <div className="font-mono text-[var(--muted-foreground)]">CTR-{String(contrat.id).padStart(4, "0")}</div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-[var(--border)]">
                    <AvatarImage src={contrat.locataire.user.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">{initials(contrat.locataire.user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-[var(--foreground)]">{contrat.locataire.user.name}</span>
                </div>
                <div className="truncate text-[var(--foreground)]">{contrat.logement.adresse}</div>
                <div className="text-[var(--muted-foreground)]">{formatShortDate(contrat.date_debut)}</div>
                <div className="text-[var(--muted-foreground)]">{formatShortDate(contrat.date_fin)}</div>
                <div className="font-medium">{formatMoney(contrat.montant)} MAD</div>
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--muted-foreground)] shadow-sm hover:bg-slate-50 hover:text-[var(--foreground)]">
                        <Ellipsis className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                      <DropdownMenuItem onClick={() => setContractDetails(contrat)}>
                        <Eye className="mr-2 h-4 w-4 text-[var(--muted-foreground)]" /> Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => beginEditContract(contrat)}>
                        <PencilLine className="mr-2 h-4 w-4 text-blue-600" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => void handleDeleteContract(contrat)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
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

    {/* ── PAYMENTS TAB ── */}
    {activeTab === "payments" ? (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Payments</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Track and record incoming rent collections.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none rounded-xl shadow-sm bg-white"
              onClick={() =>
                downloadTextFile(
                  "payments.csv",
                  ["Tenant,Property,Amount,Date,Mode,Status"].concat(
                    filteredPayments.map((p) => [p.contrat.locataire.user.name, p.contrat.logement.adresse, p.montant, p.date_paiement, p.mode, p.statut].join(","))
                  ).join("\n")
                )
              }
            >
              Export CSV
            </Button>
            <Button className="flex-1 sm:flex-none rounded-xl shadow-sm" onClick={openPaymentWizard}>
              <Plus className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Expected Revenue</div>
            <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">{formatMoney(expectedRevenue)} MAD</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Collected</div>
            <div className="mt-2 text-2xl font-bold text-[var(--success)]">{formatMoney(collectionsTotal)} MAD</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Overdue</div>
            <div className="mt-2 text-2xl font-bold text-[var(--danger)]">{formatMoney(overdueBalance)} MAD</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--primary)] text-white p-5 shadow-md">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Collection Rate</div>
            <div className="mt-2 text-2xl font-bold">{collectionRate}%</div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm w-full">
          <div className="min-w-[920px]">
            <div className="grid grid-cols-[minmax(0,1fr)_1fr_140px_140px_140px] gap-4 border-b border-[var(--border)] bg-slate-50/50 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              <div>Tenant</div>
              <div>Property</div>
              <div>Amount</div>
              <div>Date</div>
              <div>Status</div>
            </div>
            {filteredPayments.map((paiement) => (
              <div key={paiement.id} className="grid grid-cols-[minmax(0,1fr)_1fr_140px_140px_140px] items-center gap-4 border-b border-[var(--border)] px-6 py-4 text-sm last:border-b-0 hover:bg-slate-50/50 transition-colors">
                <div className="font-semibold text-[var(--foreground)]">{paiement.contrat.locataire.user.name}</div>
                <div className="text-[var(--muted-foreground)]">{paiement.contrat.logement.adresse}</div>
                <div className="font-medium text-[var(--foreground)]">{formatMoney(paiement.montant)} MAD</div>
                <div className="text-[var(--muted-foreground)]">{formatShortDate(paiement.date_paiement)}</div>
                <div><Badge variant={toneForStatus(paiement.statut)}>{paiement.statut}</Badge></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    ) : null}

    {/* ── TENANTS TAB ── */}
    {activeTab === "tenants" ? (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Tenants</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Directory of all locataires linked to your properties.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm w-full">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[minmax(0,1.2fr)_1fr_180px_150px_140px] gap-4 border-b border-[var(--border)] bg-slate-50/50 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              <div>Tenant</div>
              <div>Email</div>
              <div>Residence</div>
              <div>Rent</div>
              <div>Status</div>
            </div>
            {filteredTenantRows.map((row) => (
              <div key={row.user.id} className="grid grid-cols-[minmax(0,1.2fr)_1fr_180px_150px_140px] items-center gap-4 border-b border-[var(--border)] px-6 py-4 text-sm last:border-b-0 hover:bg-slate-50/50 transition-colors">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0 border border-[var(--border)]">
                    <AvatarImage src={row.user.avatar_url ?? undefined} />
                    <AvatarFallback>{initials(row.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[var(--foreground)]">{row.user.name}</div>
                    <div className="truncate text-xs text-[var(--muted-foreground)]">{row.user.phone ?? "No phone"}</div>
                  </div>
                </div>
                <div className="truncate text-[var(--muted-foreground)]">{row.user.email}</div>
                <div className="truncate text-[var(--foreground)]">{row.residence}</div>
                <div className="font-medium">{row.rent ? `${formatMoney(row.rent)} MAD` : "N/A"}</div>
                <div><Badge variant={toneForStatus(row.user.status)}>{row.user.status}</Badge></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    ) : null}

    {/* ── USERS TAB ── */}
    {activeTab === "users" ? (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">User Management</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Control access for agents, admins, and tenants.</p>
          </div>
          <Button className="w-full sm:w-auto rounded-xl shadow-sm" onClick={openUserWizard}>
            <UserPlus className="mr-2 h-4 w-4" /> Invite User
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Total Agents</div>
            <div className="mt-2 text-3xl font-bold">{agentUsers.length}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Total Tenants</div>
            <div className="mt-2 text-3xl font-bold">{tenantUsers.length}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">System Admins</div>
            <div className="mt-2 text-3xl font-bold">{adminUsers.length}</div>
          </div>
        </div>

        <div className="flex overflow-x-auto items-center gap-2 border-b border-[var(--border)] pb-4 hide-scrollbar">
          {(role === "super_admin"
            ? [{ id: "admins", label: "Admins", count: adminUsers.length }]
            : [
                { id: "agents", label: "Agents", count: agentUsers.length },
                { id: "locataires", label: "Tenants", count: tenantUsers.length },
              ]
          ).map((entry) => (
            <button
              key={entry.id}
              onClick={() => setUserView(entry.id as UserView)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                userView === entry.id ? "bg-slate-100 text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:bg-slate-50 hover:text-[var(--foreground)]"
              }`}
            >
              <span>{entry.label}</span>
              <span className="rounded-md bg-[var(--border)] px-1.5 py-0.5 text-[10px]">{entry.count}</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm w-full hidden lg:block">
          <div className="min-w-[1020px]">
            <div className="grid grid-cols-[minmax(0,1.4fr)_1fr_170px_120px_140px_150px] gap-4 border-b border-[var(--border)] bg-slate-50/50 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              <div>User</div>
              <div>Email</div>
              <div>Phone</div>
              <div>Records</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            {visibleUsers.map((entry) => {
              const recordCount = entry.role === "agent" ? logements.filter((l) => l.agent.user.id === entry.id).length : entry.role === "locataire" ? contrats.filter((c) => c.locataire.user.id === entry.id).length : users.filter((u) => u.managed_by_id === entry.id).length;
              return (
                <div key={entry.id} className="grid grid-cols-[minmax(0,1.4fr)_1fr_170px_120px_140px_150px] items-center gap-4 border-b border-[var(--border)] px-6 py-4 text-sm last:border-b-0 hover:bg-slate-50/50 transition-colors">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0 border border-[var(--border)]">
                      <AvatarImage src={entry.avatar_url ?? undefined} />
                      <AvatarFallback>{initials(entry.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[var(--foreground)]">{entry.name}</div>
                      <div className="truncate text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{entry.role.replace("_", " ")}</div>
                    </div>
                  </div>
                  <div className="text-[var(--muted-foreground)]">{entry.email}</div>
                  <div className="text-[var(--muted-foreground)]">{entry.phone ?? "No phone"}</div>
                  <div><span className="rounded-lg border border-[var(--border)] bg-slate-50 px-2.5 py-1 text-xs">{recordCount}</span></div>
                  <div><Badge variant={toneForStatus(entry.status)}>{entry.status}</Badge></div>
                  <div className="flex items-center gap-2">
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition" onClick={() => void handleStatusUpdate(entry.id, "active", entry.name)}><Check className="h-4 w-4" /></button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition" onClick={() => void handleStatusUpdate(entry.id, "pending", entry.name)}><Clock3 className="h-4 w-4" /></button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-red-600 hover:bg-red-50 hover:border-red-200 transition" onClick={() => void handleStatusUpdate(entry.id, "suspended", entry.name)}><Ban className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ) : null}

{/* ── SETTINGS TAB ── */}
    {activeTab === "settings" ? (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Settings</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Manage your platform preferences and configurations.</p>
          </div>
          <Button className="w-full sm:w-auto rounded-xl shadow-sm">
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            {/* Organization Settings */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Organization Profile</h3>
              <p className="mb-6 text-sm text-[var(--muted-foreground)]">Update your company details and tax information.</p>
              
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Company Name</Label>
                    <Input className="h-11 rounded-xl" defaultValue="ImmoFlow Enterprises" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Tax ID (ICE)</Label>
                    <Input className="h-11 rounded-xl" defaultValue="001524859600047" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Support Email</Label>
                  <Input className="h-11 rounded-xl" defaultValue="support@immoflow.ma" />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Notification Preferences</h3>
              <p className="mb-6 text-sm text-[var(--muted-foreground)]">Choose what events you want to be notified about.</p>
              
              <div className="space-y-4">
                {[
                  { title: "New Messages", desc: "Receive an email when a tenant sends a message.", defaultOn: true },
                  { title: "Payment Confirmations", desc: "Get notified when a rent payment is recorded.", defaultOn: true },
                  { title: "Contract Expirations", desc: "Alert me 30 days before a lease expires.", defaultOn: true },
                  { title: "System Updates", desc: "News about product and feature updates.", defaultOn: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-[var(--border)] py-3 last:border-0 last:pb-0">
                    <div className="pr-4">
                      <div className="text-sm font-semibold text-[var(--foreground)]">{item.title}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{item.desc}</div>
                    </div>
                    {/* CSS-only Toggle Switch */}
                    <button type="button" className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${item.defaultOn ? 'bg-[var(--primary)]' : 'bg-slate-200'}`}>
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.defaultOn ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Housing Types (Upgraded existing functionality) */}
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">Property Types</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">Configured housing categories.</p>
                </div>
                <Button variant="outline" className="h-8 rounded-lg px-3 shadow-sm">
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
              
              <div className="space-y-3">
                {types.map((entry) => (
                  <div key={entry.id} className="group flex items-center justify-between rounded-xl border border-[var(--border)] bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                    <div>
                      <div className="text-sm font-semibold text-[var(--foreground)]">{entry.nom_type}</div>
                      <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        Base fee: {formatMoney(entry.charge_forfaitaires)} MAD
                      </div>
                    </div>
                    <button className="rounded-md border border-transparent p-1.5 text-[var(--muted-foreground)] shadow-sm transition-colors hover:border-[var(--border)] hover:bg-white hover:text-[var(--primary)]">
                      <PencilLine className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {types.length === 0 && (
                  <div className="py-4 text-center text-sm text-[var(--muted-foreground)]">No property types configured.</div>
                )}
              </div>
            </div>

            {/* System Info Server Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-slate-900 p-6 text-white shadow-lg">
              <h3 className="text-lg font-bold">System Status</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60">Platform Version</span>
                  <span className="font-mono text-emerald-400">v2.4.0</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60">Database Link</span>
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    Connected
                  </span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-white/60">Storage Used</span>
                  <span className="font-medium">14.2 GB / 50 GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    ) : null}
    {/* ── MESSAGES & PROFILE TABS ── */}
    {activeTab === "notifications" ? <NotificationsPanel token={token} user={user} users={users} /> : null}
    {activeTab === "profile" ? <ProfilePanel token={token} user={user} onSaved={reload} /> : null}

  </div>

  {/* ── GLOBAL MODALS (RENDERED OUTSIDE TABS TO PREVENT CRASHES) ── */}
  
  {/* Create/Edit Property Dialog */}
  <Dialog open={propertyPanelOpen} onOpenChange={setPropertyPanelOpen}>
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl p-0 shadow-2xl sm:max-w-[700px] w-[95vw]">
      <DialogHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-5">
        <DialogTitle className="text-xl font-bold">
          {editingPropertyId ? "Edit Property" : "Add Property"}
        </DialogTitle>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Step {propertyWizardStep + 1} of 2
        </div>
      </DialogHeader>

      <div className="h-1 w-full bg-[var(--border)]">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
          style={{ width: `${((propertyWizardStep + 1) / 2) * 100}%` }}
        />
      </div>

      <div className="space-y-6 px-4 py-6 sm:px-6">
        {propertyWizardStep === 0 ? (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Agent Assignment</Label>
              <select
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
                value={propertyForm.agent_id}
                onChange={(event) =>
                  setPropertyForm((current) => ({ ...current, agent_id: event.target.value }))
                }
              >
                <option value="">Select an agent</option>
                {agentUsers.map((entry) => (
                  <option key={entry.id} value={entry.agent_profile?.id ?? ""}>{entry.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Property Address</Label>
              <Input
                className="h-11 rounded-xl"
                placeholder="e.g. 123 Main St, Apt 4B"
                value={propertyForm.adresse}
                onChange={(event) =>
                  setPropertyForm((current) => ({ ...current, adresse: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Property Type</Label>
                <select
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
                  value={propertyForm.type_logement_id}
                  onChange={(event) =>
                    setPropertyForm((current) => ({ ...current, type_logement_id: event.target.value }))
                  }
                >
                  <option value="">Select type</option>
                  {types.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.nom_type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Commune / Area</Label>
                <select
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
                  value={propertyForm.commune_id}
                  onChange={(event) =>
                    setPropertyForm((current) => ({ ...current, commune_id: event.target.value }))
                  }
                >
                  <option value="">Select commune</option>
                  {communes.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.nom}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Area (m²)</Label>
                <Input
                  type="number"
                  className="h-11 rounded-xl"
                  value={propertyForm.superficie}
                  onChange={(event) =>
                    setPropertyForm((current) => ({ ...current, superficie: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Monthly Rent (MAD)</Label>
                <Input
                  type="number"
                  className="h-11 rounded-xl"
                  value={propertyForm.loyer}
                  onChange={(event) =>
                    setPropertyForm((current) => ({ ...current, loyer: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-[var(--border)] bg-slate-50/50 p-4 sm:p-5">
              <Label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Tenant Assignment</Label>
              <select
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
                value={propertyForm.locataire_id}
                onChange={(event) => setPropertyForm((current) => ({ ...current, locataire_id: event.target.value }))}
              >
                <option value="">Keep property vacant</option>
                {tenantUsers.map((entry) => (
                  <option key={entry.id} value={entry.locataire_profile?.id ?? ""}>{entry.name}</option>
                ))}
              </select>
              
              {propertyForm.locataire_id ? (
                <div className="grid gap-4 sm:grid-cols-3 pt-2">
                  <div className="space-y-2">
                    <Label className="text-[11px] text-[var(--muted-foreground)]">Start Date</Label>
                    <Input
                      type="date"
                      className="h-10 rounded-lg text-sm"
                      value={propertyForm.contrat_date_debut}
                      onChange={(event) => setPropertyForm((current) => ({ ...current, contrat_date_debut: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] text-[var(--muted-foreground)]">End Date</Label>
                    <Input
                      type="date"
                      className="h-10 rounded-lg text-sm"
                      value={propertyForm.contrat_date_fin}
                      onChange={(event) => setPropertyForm((current) => ({ ...current, contrat_date_fin: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] text-[var(--muted-foreground)]">Status</Label>
                    <select
                      className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-2 text-sm outline-none focus:border-[var(--primary)]"
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">House Images</Label>
                <span className="text-xs text-[var(--muted-foreground)]">{totalPropertyImageCount}/10 max (min 2)</span>
              </div>
              <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-slate-50/50 px-6 py-6 text-center transition-colors hover:bg-slate-100">
                <UploadCloud className="h-6 w-6 text-[var(--muted-foreground)]" />
                <span className="mt-3 text-sm font-medium text-[var(--foreground)]">Click to upload photos</span>
                <span className="mt-1 text-xs text-[var(--muted-foreground)]">JPG, PNG up to 5MB</span>
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
              
              {preparingImages && <div className="text-xs text-blue-600 font-medium">Preparing images...</div>}

              {propertyExistingImages.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Existing images</div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {propertyExistingImages.map((imageUrl, index) => (
                      <div key={`${imageUrl}-${index}`} className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-white">
                        <img src={imageUrl} alt={`Property ${index}`} className="h-20 w-full object-cover transition-transform group-hover:scale-105" />
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-600 group-hover:opacity-100"
                          onClick={() => removeExistingPropertyImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {propertyImageFiles.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">New uploads</div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {propertyImageFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-white">
                        {propertyImagePreviewUrls[index] ? (
                          <img src={propertyImagePreviewUrls[index]} alt={file.name} className="h-20 w-full object-cover transition-transform group-hover:scale-105" />
                        ) : <div className="h-20 w-full bg-slate-100" />}
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-600 group-hover:opacity-100"
                          onClick={() => removeUploadedPropertyImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[var(--border)] mt-6">
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-xl shadow-sm"
            disabled={propertyWizardStep === 0 || busy}
            onClick={() => setPropertyWizardStep(0)}
          >
            Back
          </Button>
          {propertyWizardStep === 0 ? (
            <Button
              className="w-full sm:w-auto rounded-xl shadow-sm px-6"
              disabled={!propertyForm.agent_id || !propertyForm.type_logement_id || !propertyForm.commune_id || !propertyForm.adresse || busy}
              onClick={() => setPropertyWizardStep(1)}
            >
              Continue
            </Button>
          ) : (
            <div className="flex w-full sm:w-auto gap-3">
              {editingPropertyId && (
                <Button variant="ghost" className="flex-1 sm:flex-none rounded-xl" onClick={resetPropertyEditor}>
                  Cancel
                </Button>
              )}
              <Button 
                className="flex-1 sm:flex-none rounded-xl shadow-sm px-6" 
                disabled={busy || preparingImages || totalPropertyImageCount < 2 || totalPropertyImageCount > 10} 
                onClick={() => void handlePropertySubmit()}
              >
                {editingPropertyId ? "Save Changes" : "Create Property"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>

  {/* Create/Edit Contract Dialog */}
  <Dialog open={contractWizardOpen} onOpenChange={setContractWizardOpen}>
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl p-0 shadow-2xl sm:max-w-[760px]">
      <DialogHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-5">
        <DialogTitle className="text-xl font-bold">{editingContractId ? "Edit Contract" : "Create Contract"}</DialogTitle>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Step {contractWizardStep + 1} of 2
        </div>
      </DialogHeader>

      <div className="h-1 w-full bg-[var(--border)]">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
          style={{ width: `${((contractWizardStep + 1) / 2) * 100}%` }}
        />
      </div>

      <div className="space-y-6 px-6 py-6">
        {contractWizardStep === 0 ? (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Agent</Label>
              <select
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
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
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Primary Tenant</Label>
              <select
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
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
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Property</Label>
              <select
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
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
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Start Date</Label>
                <Input
                  type="date"
                  className="h-11 rounded-xl"
                  value={contractForm.date_debut}
                  onChange={(event) =>
                    setContractForm((current) => ({ ...current, date_debut: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">End Date</Label>
                <Input
                  type="date"
                  className="h-11 rounded-xl"
                  value={contractForm.date_fin}
                  onChange={(event) =>
                    setContractForm((current) => ({ ...current, date_fin: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Monthly Rent (MAD)</Label>
                <Input
                  type="number"
                  className="h-11 rounded-xl"
                  value={contractForm.montant}
                  onChange={(event) =>
                    setContractForm((current) => ({ ...current, montant: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Status</Label>
                <select
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
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

        <div className="flex items-center justify-between gap-3 pt-6 border-t border-[var(--border)] mt-6">
          <Button
            variant="outline"
            className="rounded-xl shadow-sm"
            disabled={contractWizardStep === 0 || busy}
            onClick={() => setContractWizardStep(0)}
          >
            Back
          </Button>
          {contractWizardStep === 0 ? (
            <Button
              className="rounded-xl shadow-sm px-6"
              disabled={!contractForm.agent_id || !contractForm.locataire_id || !contractForm.logement_id || busy}
              onClick={() => setContractWizardStep(1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              className="rounded-xl shadow-sm px-6"
              disabled={!contractForm.date_debut || !contractForm.montant || busy}
              onClick={() => void handleContractSubmit()}
            >
              {editingContractId ? "Save Contract" : "Create Contract"}
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>

  {/* View Contract Details Dialog */}
  <Dialog open={Boolean(contractDetails)} onOpenChange={(open) => !open && setContractDetails(null)}>
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl p-0 shadow-2xl sm:max-w-[640px]">
      <DialogHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-5">
        <DialogTitle className="text-xl font-bold">Contract Details</DialogTitle>
      </DialogHeader>
      
      {contractDetails ? (
        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-slate-50/50 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Tenant</div>
              <div className="mt-3 flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-[var(--border)]">
                  <AvatarImage src={contractDetails.locataire.user.avatar_url ?? undefined} />
                  <AvatarFallback>{initials(contractDetails.locataire.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-[var(--foreground)]">{contractDetails.locataire.user.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{contractDetails.locataire.user.email}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-slate-50/50 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Agent</div>
              <div className="mt-3 flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-[var(--border)]">
                  <AvatarImage src={contractDetails.agent.user.avatar_url ?? undefined} />
                  <AvatarFallback>{initials(contractDetails.agent.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-[var(--foreground)]">{contractDetails.agent.user.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{contractDetails.agent.user.email}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[var(--muted-foreground)]">Contract ref</span>
                <span className="font-semibold text-[var(--foreground)]">CTR-{String(contractDetails.id).padStart(4, "0")}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[var(--muted-foreground)]">Property</span>
                <span className="font-semibold text-[var(--foreground)]">{contractDetails.logement.adresse}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[var(--muted-foreground)]">Amount</span>
                <span className="font-semibold text-[var(--foreground)]">{formatMoney(contractDetails.montant)} MAD</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[var(--muted-foreground)]">Start</span>
                <span className="font-semibold text-[var(--foreground)]">{formatLongDate(contractDetails.date_debut)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[var(--muted-foreground)]">End</span>
                <span className="font-semibold text-[var(--foreground)]">{formatLongDate(contractDetails.date_fin, "Open")}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[var(--muted-foreground)]">Status</span>
                <Badge variant={toneForStatus(contractDetails.statut)}>{contractDetails.statut}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Signature</span>
                <Badge variant={toneForStatus(contractDetails.signature_status)}>{contractDetails.signature_status}</Badge>
              </div>
              {contractDetails.signed_at ? (
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <span className="text-[var(--muted-foreground)]">Signed at</span>
                  <span className="font-semibold text-[var(--foreground)]">{formatLongDate(contractDetails.signed_at)}</span>
                </div>
              ) : null}
            </div>
          </div>

          {contractDetails.signature_data ? (
            <div className="rounded-2xl border border-[var(--border)] bg-slate-50/50 p-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Tenant Signature</div>
              <div className="flex items-center justify-center rounded-xl bg-white p-4 shadow-sm border border-[var(--border)]">
                <img src={contractDetails.signature_data} alt="Tenant signature" className="h-20 object-contain" />
              </div>
            </div>
          ) : null}

          <Button
            className="w-full rounded-xl shadow-sm"
            onClick={() => {
              const property = logements.find((entry) => entry.id === contractDetails.logement.id) ?? null;
              downloadContractPdf(contractDetails, property);
            }}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Download PDF Agreement
          </Button>
        </div>
      ) : null}
    </DialogContent>
  </Dialog>

  {/* Image Viewer Dialog (Carousel) */}
  <Dialog open={Boolean(propertyImageViewer)} onOpenChange={(open) => !open && setPropertyImageViewer(null)}>
    <DialogContent className="overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-[980px] bg-black/95 border-white/10">
      {propertyImageViewer ? (
        <div>
          <div className="relative flex items-center justify-center p-4">
            <img
              src={propertyImageViewer.images[propertyImageViewer.index]}
              alt={`Property image ${propertyImageViewer.index + 1}`}
              className="h-[75vh] w-full object-contain"
            />
            {propertyImageViewer.images.length > 1 ? (
              <>
                <Button
                  variant="outline"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border-white/20 bg-black/50 text-white hover:bg-black/80 backdrop-blur-md"
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
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border-white/20 bg-black/50 text-white hover:bg-black/80 backdrop-blur-md"
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
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            ) : null}
          </div>
          <div className="px-6 py-4 text-center text-sm font-medium text-white/80 border-t border-white/10">
            {propertyImageViewer.index + 1} of {propertyImageViewer.images.length}
          </div>
        </div>
      ) : null}
    </DialogContent>
  </Dialog>

  {/* Record Payment Dialog */}
  <Dialog open={paymentWizardOpen} onOpenChange={setPaymentWizardOpen}>
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl p-0 shadow-2xl sm:max-w-[760px]">
      <DialogHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-5">
        <DialogTitle className="text-xl font-bold">Record Payment</DialogTitle>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Step {paymentWizardStep + 1} of 2
        </div>
      </DialogHeader>

      <div className="h-1 w-full bg-[var(--border)]">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
          style={{ width: `${((paymentWizardStep + 1) / 2) * 100}%` }}
        />
      </div>

      <div className="space-y-6 px-6 py-6">
        {paymentWizardStep === 0 ? (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Contract</Label>
              <select
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
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
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Received Amount (MAD)</Label>
                <Input
                  type="number"
                  className="h-11 rounded-xl"
                  value={paymentForm.montant}
                  onChange={(event) =>
                    setPaymentForm((current) => ({ ...current, montant: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Payment Date</Label>
                <Input
                  type="date"
                  className="h-11 rounded-xl"
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
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Method</Label>
                <select
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
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
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Status</Label>
                <select
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
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
              <div className="rounded-2xl border border-[var(--border)] bg-slate-50/50 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Bank Transfer Details</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input className="h-11 rounded-xl" value={paymentForm.rib} onChange={(event) => setPaymentForm((current) => ({ ...current, rib: event.target.value }))} placeholder="RIB / IBAN" />
                  <Input className="h-11 rounded-xl" value={paymentForm.reference} onChange={(event) => setPaymentForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Transfer reference" />
                </div>
              </div>
            ) : null}
            
            {paymentForm.mode === "Cash" ? (
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-[var(--border)] bg-slate-50/50 p-4 text-sm outline-none transition-all focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10"
                value={paymentForm.cash_note}
                onChange={(event) => setPaymentForm((current) => ({ ...current, cash_note: event.target.value }))}
                placeholder="Cash receipt note: receiver, place, receipt number..."
              />
            ) : null}
            
            {selectedPaymentContract ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="font-semibold text-[var(--foreground)]">{selectedPaymentContract.locataire.user.name}</div>
                <div className="mt-1 text-sm text-[var(--muted-foreground)]">{selectedPaymentContract.logement.adresse}</div>
                <div className="mt-3 text-sm font-medium text-[var(--foreground)]">Expected rent: {formatMoney(selectedPaymentContract.montant)} MAD</div>
              </div>
            ) : null}
          </>
        )}

        <div className="flex items-center justify-between gap-3 pt-6 border-t border-[var(--border)] mt-6">
          <Button
            variant="outline"
            className="rounded-xl shadow-sm"
            disabled={paymentWizardStep === 0 || busy}
            onClick={() => setPaymentWizardStep(0)}
          >
            Back
          </Button>
          {paymentWizardStep === 0 ? (
            <Button
              className="rounded-xl shadow-sm px-6"
              disabled={!paymentForm.contrat_id || !paymentForm.montant || busy}
              onClick={() => setPaymentWizardStep(1)}
            >
              Continue
            </Button>
          ) : (
            <Button className="rounded-xl shadow-sm px-6" disabled={busy} onClick={() => void handleRecordPayment()}>
              Confirm Payment
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>

  {/* Invite User Dialog */}
  <Dialog
    open={userWizardOpen}
    onOpenChange={(open) => {
      setUserWizardOpen(open);
      if (!open) resetUserWizardState();
    }}
  >
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl p-0 shadow-2xl sm:max-w-[760px]">
      <DialogHeader className="border-b border-[var(--border)] bg-slate-50/50 px-6 py-5">
        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm">
            <UserPlus className="h-5 w-5" />
          </div>
          Add System User
        </DialogTitle>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Step {userWizardStep + 1} of 3
        </div>
      </DialogHeader>

      <div className="h-1 w-full bg-[var(--border)]">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
          style={{ width: `${((userWizardStep + 1) / 3) * 100}%` }}
        />
      </div>

      <div className="space-y-6 px-6 py-6">
        {userWizardStep === 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Role</Label>
              <select
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
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
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Initial Status</Label>
              <select
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
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
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Full Name</Label>
              <Input
                className="h-11 rounded-xl"
                value={userForm.name}
                onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Sarah Chen"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Email Address</Label>
              <Input
                className="h-11 rounded-xl"
                type="email"
                value={userForm.email}
                onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Phone Number</Label>
              <Input
                className="h-11 rounded-xl"
                value={userForm.phone}
                onChange={(event) => setUserForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+212 6 00 00 00 00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">System Username</Label>
              <Input
                className="h-11 rounded-xl"
                value={userForm.login}
                onChange={(event) => setUserForm((current) => ({ ...current, login: event.target.value }))}
                placeholder="sarah.chen"
              />
            </div>
            
            {userForm.role === "agent" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Agent Code</Label>
                <Input
                  className="h-11 rounded-xl"
                  value={userForm.code_agent}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, code_agent: event.target.value }))
                  }
                  placeholder="AGT-00024"
                />
              </div>
            )}
            
            {userForm.role === "admin" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Access Level</Label>
                <select
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm shadow-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
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
            )}
            
            {userForm.role === "locataire" && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Birth Date</Label>
                  <Input
                    className="h-11 rounded-xl"
                    type="date"
                    value={userForm.date_naissance}
                    onChange={(event) =>
                      setUserForm((current) => ({ ...current, date_naissance: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Residential Address</Label>
                  <Input
                    className="h-11 rounded-xl"
                    value={userForm.adresse}
                    onChange={(event) =>
                      setUserForm((current) => ({ ...current, adresse: event.target.value }))
                    }
                    placeholder="Enter current address"
                  />
                </div>
              </>
            )}
          </div>
        ) : null}

        {userWizardStep === 2 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Temporary Password</Label>
              <Input
                className="h-11 rounded-xl"
                type="password"
                value={userForm.password}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Confirm Password</Label>
              <Input
                className="h-11 rounded-xl"
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

        <div className="flex items-center justify-between gap-3 pt-6 border-t border-[var(--border)] mt-6">
          <Button
            variant="outline"
            className="rounded-xl shadow-sm"
            disabled={userWizardStep === 0 || busy}
            onClick={() => setUserWizardStep((current) => Math.max(0, current - 1))}
          >
            Back
          </Button>
          {userWizardStep < 2 ? (
            <Button
              className="rounded-xl shadow-sm px-6"
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
              className="rounded-xl shadow-sm px-6"
              disabled={busy || !userForm.password || userForm.password !== userForm.password_confirmation}
              onClick={() => void handleCreateUser()}
            >
              Create User Profile
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>
</main>
      </div>
    </div>
  );
}
