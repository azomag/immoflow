"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { AuthenticatedUser } from "@/lib/api";
import { backendRequest } from "@/lib/api";
import { prepareImageForUpload } from "@/lib/image-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatLongDate, initials } from "@/components/dashboard/workspace-utils";
import {
  User,
  Mail,
  Phone,
  AtSign,
  Camera,
  Lock,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  agent: "Agent",
  locataire: "Locataire",
};

type UpdateProfileResponse = {
  message: string;
  user: AuthenticatedUser;
};

export function ProfilePanel({
  token,
  user,
  onSaved,
}: {
  token: string;
  user: AuthenticatedUser;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    login: user.login ?? "",
    avatar_url: user.avatar_url ?? "",
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [busy, setBusy] = useState(false);
  const [preparingAvatar, setPreparingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { update } = useSession();
  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : form.avatar_url),
    [avatarFile, form.avatar_url]
  );

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  async function saveProfile() {
    setBusy(true);
    setNotice(null);
    setError(null);

    try {
      const payload = new FormData();
      payload.set("name", form.name);
      payload.set("email", form.email);
      payload.set("phone", form.phone || "");
      if (form.login) payload.set("login", form.login);
      if (form.avatar_url && !avatarFile) payload.set("avatar_url", form.avatar_url);
      if (avatarFile) payload.set("avatar_image", avatarFile);
      if (form.current_password) payload.set("current_password", form.current_password);
      if (form.password) {
        payload.set("password", form.password);
        payload.set("password_confirmation", form.password_confirmation);
      }
      payload.set("_method", "PATCH");

      const response = await backendRequest<UpdateProfileResponse>(
        "/api/auth/me",
        { method: "POST", body: payload },
        token
      );

      await update({
        backendSync: {
          token,
          user: response.user,
        },
      });

      setForm((current) => ({
        ...current,
        name: response.user.name,
        email: response.user.email,
        phone: response.user.phone ?? "",
        login: response.user.login ?? "",
        avatar_url: response.user.avatar_url ?? "",
      }));
      setNotice("Profile saved successfully.");
      setForm((c) => ({ ...c, current_password: "", password: "", password_confirmation: "" }));
      setAvatarFile(null);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAvatarChange(file: File | null) {
    setError(null);

    if (!file) {
      setAvatarFile(null);
      return;
    }

    try {
      setPreparingAvatar(true);
      setAvatarFile(await prepareImageForUpload(file));
    } catch (avatarError) {
      setAvatarFile(null);
      setError(
        avatarError instanceof Error
          ? avatarError.message
          : "Could not prepare the avatar image.",
      );
    } finally {
      setPreparingAvatar(false);
    }
  }

  return (
    <section className="w-full space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Profile Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Manage your personal information and account security.
        </p>
      </div>

      {/* Feedback banners */}
      {notice ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[rgba(44,125,160,0.2)] bg-[var(--success-bg)] px-5 py-4 text-sm font-medium text-[var(--success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[rgba(1,42,74,0.2)] bg-[var(--danger-bg)] px-5 py-4 text-sm font-medium text-[var(--danger)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {/* Avatar + identity card */}
          <div className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-sm)]">
            <h2 className="mb-6 text-base font-semibold text-[var(--foreground)]">Personal Information</h2>

            {/* Avatar row */}
            <div className="mb-8 flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-[var(--border)] shadow-[var(--shadow-sm)]">
                  <AvatarImage src={avatarPreview || undefined} alt={form.name} />
                  <AvatarFallback className="bg-[var(--primary)] text-white text-xl font-bold">
                    {initials(form.name)}
                  </AvatarFallback>
                </Avatar>
                <label
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-primary)] transition hover:bg-[var(--primary-hover)]"
                  title="Upload photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => void handleAvatarChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--foreground)]">{form.name}</div>
                <div className="mt-0.5 text-sm text-[var(--muted-foreground)]">{form.email}</div>
                <div className="mt-2 inline-flex items-center rounded-full bg-[rgba(1,73,124,0.1)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                  {roleLabel[user.role] ?? user.role}
                </div>
              </div>
            </div>

            <Separator className="mb-7" />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prof-name" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  <User className="h-3.5 w-3.5" /> Full Name
                </Label>
                <Input
                  id="prof-name"
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prof-email" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  <Mail className="h-3.5 w-3.5" /> Email Address
                </Label>
                <Input
                  id="prof-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prof-phone" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  <Phone className="h-3.5 w-3.5" /> Phone Number
                </Label>
                <Input
                  id="prof-phone"
                  value={form.phone}
                  onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prof-login" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  <AtSign className="h-3.5 w-3.5" /> Username
                </Label>
                <Input
                  id="prof-login"
                  value={form.login}
                  onChange={(e) => setForm((c) => ({ ...c, login: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                className="h-11 rounded-xl bg-[var(--primary)] px-6 font-semibold shadow-[var(--shadow-primary)] hover:bg-[var(--primary-hover)]"
                disabled={busy || preparingAvatar}
                onClick={() => void saveProfile()}
              >
                {preparingAvatar ? "Preparing image..." : busy ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Security card */}
          <div className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-sm)]">
            <div className="mb-1 flex items-center gap-2">
              <Lock className="h-4 w-4 text-[var(--muted-foreground)]" />
              <h2 className="text-base font-semibold text-[var(--foreground)]">Change Password</h2>
            </div>
            <p className="mb-6 text-sm text-[var(--muted-foreground)]">
              Leave these blank if you only want to update profile information.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cur-pw" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Current Password
                </Label>
                <Input
                  id="cur-pw"
                  type="password"
                  value={form.current_password}
                  onChange={(e) => setForm((c) => ({ ...c, current_password: e.target.value }))}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-pw" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    New Password
                  </Label>
                  <Input
                    id="new-pw"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conf-pw" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Confirm New Password
                  </Label>
                  <Input
                    id="conf-pw"
                    type="password"
                    value={form.password_confirmation}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, password_confirmation: e.target.value }))
                    }
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                className="h-11 rounded-xl bg-[var(--primary)] px-6 font-semibold shadow-[var(--shadow-primary)] hover:bg-[var(--primary-hover)]"
                disabled={busy || preparingAvatar}
                onClick={() => void saveProfile()}
              >
                {preparingAvatar ? "Preparing image..." : "Update Password"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          {/* Account status */}
          <div className="rounded-3xl border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-sm)]">
            <div className="mb-5 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--muted-foreground)]" />
              <h2 className="text-base font-semibold text-[var(--foreground)]">Account Details</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Role", value: roleLabel[user.role] ?? user.role },
                { label: "Status", value: user.status },
                {
                  label: "Last login",
                  value: user.last_login_at
                    ? formatLongDate(user.last_login_at)
                    : "Not recorded",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 rounded-xl bg-[var(--muted)] px-4 py-3"
                >
                  <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
                  <span className="text-sm font-semibold capitalize text-[var(--foreground)]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan card */}
          <div className="overflow-hidden rounded-3xl shadow-[var(--shadow-lg)]">
            <div className="stat-indigo p-7">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Plan Status
              </div>
              <div className="mt-3 text-4xl font-bold">Enterprise</div>
              <div className="mt-1 text-sm text-[var(--muted-foreground)]">ImmoFlow workspace</div>
              <div className="mt-5 h-2 rounded-full bg-[var(--accent)]">
                <div className="h-full w-[84%] rounded-full bg-[var(--primary)]/70" />
              </div>
              <div className="mt-2 text-xs text-[var(--muted-foreground)]">84% of resources used</div>
            </div>
          </div>

          {/* Invoice template info */}
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
            <div className="bg-[var(--sidebar-bg)] px-7 py-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Invoice Template
                </span>
              </div>
              <div className="mt-2 text-lg font-bold text-[var(--foreground)]">Premium rental invoice</div>
              <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                Used when generating PDF invoices from property details.
              </div>
            </div>
            <div className="space-y-0 p-2">
              {[
                ["Brand", "ImmoFlow"],
                ["Sections", "Tenant, property, rent, balance"],
                ["Output", "PDF"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm"
                >
                  <span className="text-[var(--muted-foreground)]">{label}</span>
                  <span className="font-semibold text-[var(--foreground)]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
