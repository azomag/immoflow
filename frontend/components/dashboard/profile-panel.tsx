"use client";

import { useMemo, useState } from "react";
import type { AuthenticatedUser } from "@/lib/api";
import { backendRequest } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLongDate, initials } from "@/components/dashboard/workspace-utils";

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const avatarPreview = useMemo(() => (avatarFile ? URL.createObjectURL(avatarFile) : form.avatar_url), [avatarFile, form.avatar_url]);

  async function saveProfile() {
    setBusy(true);
    setNotice(null);
    setError(null);

    try {
      const payload = new FormData();
      payload.set("name", form.name);
      payload.set("email", form.email);
      payload.set("phone", form.phone || "");
      if (form.login) {
        payload.set("login", form.login);
      }
      if (form.avatar_url && !avatarFile) {
        payload.set("avatar_url", form.avatar_url);
      }
      if (avatarFile) {
        payload.set("avatar_image", avatarFile);
      }
      if (form.current_password) {
        payload.set("current_password", form.current_password);
      }
      if (form.password) {
        payload.set("password", form.password);
        payload.set("password_confirmation", form.password_confirmation);
      }
      payload.set("_method", "PATCH");

      await backendRequest("/api/auth/me", {
        method: "POST",
        body: payload,
      }, token);
      setNotice("Profile saved. Sign out and in again to refresh session labels.");
      setForm((current) => ({
        ...current,
        current_password: "",
        password: "",
        password_confirmation: "",
      }));
      setAvatarFile(null);
      await onSaved();
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Profile update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
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

      {notice ? (
        <div className="rounded-2xl bg-[rgba(47,143,98,0.12)] px-4 py-3 text-sm text-[var(--success)]">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl bg-[rgba(186,74,69,0.12)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-black/10 bg-white p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 border border-black/10">
                  <AvatarImage src={avatarPreview || undefined} alt={form.name} />
                  <AvatarFallback>{initials(form.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-[28px] font-semibold">{form.name}</div>
                  <div className="text-black/55">{user.role.replace("_", " ")}</div>
                </div>
              </div>
              <Button className="rounded-2xl" disabled={busy} onClick={() => void saveProfile()}>
                Save Changes
              </Button>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <FieldLabel label="Full name" value={user.name} />
              <FieldLabel label="Email address" value={user.email} />
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />

              <FieldLabel label="Phone number" value={user.phone ?? "Empty"} />
              <FieldLabel label="Username" value={user.login ?? "Empty"} />
              <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              <Input value={form.login} onChange={(event) => setForm((current) => ({ ...current, login: event.target.value }))} />

              <div className="space-y-2 md:col-span-2">
                <FieldLabel label="Profile image" value={avatarFile?.name ?? user.avatar_url ?? "Empty"} />
                <label className="flex h-12 cursor-pointer items-center rounded-2xl border border-[var(--border)] bg-white/75 px-4 text-sm text-black/60">
                  {avatarFile?.name ?? "Upload new image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[24px] border border-black/10 bg-white p-7">
              <div className="text-[20px] font-semibold">Security Password</div>
              <p className="mt-3 text-sm leading-6 text-black/55">
                Keep these empty when you only want profile data changes.
              </p>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Current password</Label>
                  <Input type="password" value={form.current_password} onChange={(event) => setForm((current) => ({ ...current, current_password: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>New password</Label>
                  <Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Confirm new password</Label>
                  <Input type="password" value={form.password_confirmation} onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))} />
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-black/10 bg-white p-7">
              <div className="text-[20px] font-semibold">Account Details</div>
              <div className="mt-6 space-y-4 text-sm">
                <ProfileRow label="Role" value={user.role.replace("_", " ")} />
                <ProfileRow label="Status" value={user.status} />
                <ProfileRow label="Last login" value={user.last_login_at ? formatLongDate(user.last_login_at) : "Not recorded"} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] bg-black p-7 text-white">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/55">Plan Status</div>
            <div className="mt-5 text-[38px] font-semibold">Enterprise</div>
            <div className="mt-2 text-white/60">ImmoFlow workspace</div>
            <div className="mt-6 h-2 rounded-full bg-white/20">
              <div className="h-full w-[84%] rounded-full bg-white" />
            </div>
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
  );
}

function FieldLabel({ label, value }: { label: string; value: string }) {
  return (
    <Label>
      {label}
      <span className="ml-2 font-normal normal-case tracking-normal text-black/40">{value}</span>
    </Label>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-black/55">{label}</span>
      <span className="font-semibold capitalize">{value}</span>
    </div>
  );
}
