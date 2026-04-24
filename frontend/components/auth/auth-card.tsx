"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Globe2,
  Home,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { registerWithBackend, type AppRole } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const roleOptions: Array<{
  label: string;
  value: Exclude<AppRole, "super_admin">;
  description: string;
  status: string;
}> = [
  {
    label: "Locataire",
    value: "locataire",
    description: "Immediate access to contracts, residence details, and payment history.",
    status: "Active immediately",
  },
  {
    label: "Agent",
    value: "agent",
    description: "Property operations, contracts, collections, and tenant follow-up.",
    status: "Needs admin approval",
  },
  {
    label: "Admin",
    value: "admin",
    description: "Operational supervision, user approvals, communes, and property types.",
    status: "Needs super admin approval",
  },
];

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [role, setRole] = useState<Exclude<AppRole, "super_admin">>("locataire");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    login: "",
    identifier: "",
    email: "",
    phone: "",
    code_agent: "",
    niveau_acces: "admin",
    date_naissance: "",
    adresse: "",
    password: "",
    password_confirmation: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);

  const roleMeta = useMemo(
    () => roleOptions.find((option) => option.value === role) ?? roleOptions[0],
    [role],
  );

  useEffect(() => {
    let cancelled = false;

    void getProviders()
      .then((providers) => {
        if (!cancelled) {
          setGoogleAvailable(Boolean(providers?.google));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGoogleAvailable(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function fullName() {
    return `${form.first_name} ${form.last_name}`.trim();
  }

  function normalizeAuthError(value: string) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  async function handleCredentialSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    try {
      if (mode === "signup") {
        const compositeName = fullName();

        if (!compositeName) {
          throw new Error("First name and last name are required.");
        }

        const response = await registerWithBackend({
          name: compositeName,
          login: form.login.trim() || undefined,
          email: form.email,
          phone: form.phone,
          code_agent: role === "agent" ? form.code_agent.trim() || undefined : undefined,
          niveau_acces: role === "admin" ? form.niveau_acces.trim() || "admin" : undefined,
          date_naissance: role === "locataire" ? form.date_naissance || undefined : undefined,
          adresse: role === "locataire" ? form.adresse.trim() || undefined : undefined,
          role,
          password: form.password,
          password_confirmation: form.password_confirmation,
        });

        if (response.user.status !== "active") {
          router.push("/pending");
          return;
        }

        const result = await signIn("credentials", {
          identifier: form.login.trim() || form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.error) {
          const normalizedError = normalizeAuthError(result.error);

          if (normalizedError.toLowerCase().includes("awaiting approval")) {
            router.push("/pending");
            return;
          }

          throw new Error(normalizedError);
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      const result = await signIn("credentials", {
        identifier: form.identifier,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        const normalizedError = normalizeAuthError(result.error);

        if (normalizedError.toLowerCase().includes("awaiting approval")) {
          router.push("/pending");
          return;
        }

        throw new Error(normalizedError);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Authentication failed.",
      );
    } finally {
      setPending(false);
    }
  }

  function handleGoogle(flow: "login" | "signup") {
    setError(null);
    setMessage(null);
    if (!googleAvailable) {
      setError("Google sign-in is not enabled for this frontend session.");
      return;
    }

    localStorage.setItem("immoflow-auth-role", role);

    startTransition(() => {
      void signIn("google", {
        callbackUrl: `/auth/complete?flow=${flow}`,
      });
    });
  }

  return (
    <Card className="w-full max-w-2xl border-white/70 bg-white/95 shadow-[0_35px_90px_rgba(20,16,10,0.08)]">
      <CardHeader className="space-y-6 pb-3">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <Badge variant="warning">{mode === "signup" ? "Create access" : "Secure access"}</Badge>
              <CardTitle className="mt-3 text-[40px] leading-[1.05] tracking-tight">
                {mode === "signup" ? "Start with the right role." : "Sign in to your workspace."}
              </CardTitle>
            </div>
          </div>
          <div className="rounded-2xl border border-black/6 bg-[#faf8f4] px-4 py-3 text-sm text-[var(--muted-foreground)]">
            Clean white shadcn-style auth
          </div>
        </div>

        <CardDescription className="max-w-2xl text-[15px] leading-7">
          {mode === "signup"
            ? "Choose the actor you need, complete the form, and the platform will create the correct account and profile. Locataires enter directly. Agents and admins go to approval."
            : "Select your account type, then sign in with credentials or Google. Existing accounts are redirected to their real workspace automatically."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Account Type
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-[22px] bg-[var(--muted)] p-2">
            {roleOptions.map((option) => (
              <label
                key={option.value}
                htmlFor={`role-${option.value}-${mode}`}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  role === option.value
                    ? "bg-white text-[var(--foreground)] shadow-[0_10px_20px_rgba(31,29,26,0.08)]"
                    : "cursor-pointer text-[var(--muted-foreground)] hover:bg-white/60"
                }`}
              >
                <input
                  id={`role-${option.value}-${mode}`}
                  type="radio"
                  name={`auth-role-${mode}`}
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          <div className="rounded-[22px] border border-black/6 bg-[#faf8f4] px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold">{roleMeta.label} workspace</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                  {roleMeta.description}
                </div>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  role === "locataire"
                    ? "bg-[rgba(47,143,98,0.14)] text-[var(--success)]"
                    : "bg-[rgba(210,138,30,0.14)] text-[var(--warning)]"
                }`}
              >
                {roleMeta.status}
              </div>
            </div>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleCredentialSubmit}>
          {mode === "signup" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, first_name: event.target.value }))
                    }
                    placeholder="Yassine"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, last_name: event.target.value }))
                    }
                    placeholder="El Idrissi"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="login">Username</Label>
                  <Input
                    id="login"
                    value={form.login}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, login: event.target.value }))
                    }
                    placeholder="yassine.elidrissi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="+212 6 00 00 00 00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="name@company.com"
                  required
                />
              </div>

              {role === "locataire" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_naissance">Birth Date</Label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                      <Input
                        id="date_naissance"
                        type="date"
                        value={form.date_naissance}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            date_naissance: event.target.value,
                          }))
                        }
                        className="pl-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adresse">Address</Label>
                    <div className="relative">
                      <Home className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                      <Input
                        id="adresse"
                        value={form.adresse}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, adresse: event.target.value }))
                        }
                        placeholder="Residence address"
                        className="pl-11"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {role === "agent" ? (
                <div className="space-y-2">
                  <Label htmlFor="code_agent">Agent Code</Label>
                  <div className="relative">
                    <BadgeCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                    <Input
                      id="code_agent"
                      value={form.code_agent}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, code_agent: event.target.value }))
                      }
                      placeholder="AGT-00001"
                      className="pl-11"
                    />
                  </div>
                </div>
              ) : null}

              {role === "admin" ? (
                <div className="space-y-2">
                  <Label htmlFor="niveau_acces">Access Level</Label>
                  <select
                    id="niveau_acces"
                    value={form.niveau_acces}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, niveau_acces: event.target.value }))
                    }
                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="support">Support</option>
                  </select>
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Username</Label>
              <Input
                id="identifier"
                value={form.identifier}
                onChange={(event) =>
                  setForm((current) => ({ ...current, identifier: event.target.value }))
                }
                placeholder="name@company.com or username"
                required
              />
            </div>
          )}

          <div className={`grid gap-4 ${mode === "signup" ? "md:grid-cols-2" : ""}`}>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder={mode === "signup" ? "Minimum 8 characters" : "Enter your password"}
                required
              />
            </div>

            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  value={form.password_confirmation}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password_confirmation: event.target.value,
                    }))
                  }
                  placeholder="Repeat the password"
                  required
                />
              </div>
            ) : null}
          </div>

          {message ? (
            <div className="rounded-2xl bg-[rgba(47,143,98,0.12)] px-4 py-3 text-sm text-[var(--success)]">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl bg-[rgba(186,74,69,0.12)] px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3 pt-2">
            <Button type="submit" size="lg" disabled={pending} className="rounded-2xl">
              {mode === "signup" ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
              {mode === "signup" ? `Create ${roleMeta.label} account` : `Sign in as ${roleMeta.label}`}
            </Button>

            {googleAvailable ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-2xl"
                onClick={() => handleGoogle(mode)}
              >
                <Globe2 className="h-4 w-4" />
                {mode === "signup"
                  ? `Continue with Google as ${roleMeta.label}`
                  : `Continue with Google`}
              </Button>
            ) : (
              <div className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--muted-foreground)]">
                Google sign-in is not enabled in local environment yet.
              </div>
            )}
          </div>
        </form>

        <div className="rounded-[22px] border border-black/6 bg-[#faf8f4] px-4 py-4 text-sm text-[var(--muted-foreground)]">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--secondary)]" />
            <div>
              {role === "locataire"
                ? "Locataires enter immediately after signup and can sign contracts, view residence details, and download receipts."
                : `${roleMeta.label} accounts are created instantly, but dashboard access opens after approval.`}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-black/8 pt-5 text-sm text-[var(--muted-foreground)]">
          <span>{mode === "signup" ? "Already registered?" : "Need a new account?"}</span>
          <Link
            href={mode === "signup" ? "/login" : "/signup"}
            className="inline-flex items-center gap-2 font-semibold text-[var(--foreground)]"
          >
            <span>{mode === "signup" ? "Go to login" : "Go to signup"}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
