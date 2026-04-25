"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Globe2,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { registerFormWithBackend } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupChoice = "agent" | "locataire" | "administration";

const choices: Array<{
  id: SignupChoice;
  label: string;
  description: string;
  icon: typeof UserRound;
}> = [
  {
    id: "agent",
    label: "Agent",
    description: "Create properties, contracts, and collect payments.",
    icon: Building2,
  },
  {
    id: "locataire",
    label: "Locataire",
    description: "Access contracts, residence details, and receipts.",
    icon: UserRound,
  },
  {
    id: "administration",
    label: "Administration",
    description: "Admins sign in here. Super admin creates admin accounts.",
    icon: ShieldCheck,
  },
];

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [choice, setChoice] = useState<SignupChoice | null>(mode === "login" ? "administration" : null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    login: "",
    identifier: "",
    email: "",
    phone: "",
    date_naissance: "",
    adresse: "",
    password: "",
    password_confirmation: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);

  const loginMode = mode === "login" || choice === "administration";
  const selectedChoice = choices.find((item) => item.id === choice) ?? null;
  const progress = mode === "signup" && !loginMode ? Math.round((step / 3) * 100) : 100;
  const avatarPreview = useMemo(() => (avatarFile ? URL.createObjectURL(avatarFile) : null), [avatarFile]);

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
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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

  function resetMessages() {
    setError(null);
    setMessage(null);
  }

  function selectChoice(nextChoice: SignupChoice) {
    resetMessages();
    setChoice(nextChoice);
    setStep(2);
  }

  function validateSignupStep() {
    if (!choice || choice === "administration") {
      return;
    }

    if (step === 2) {
      if (!fullName()) {
        throw new Error("First name and last name are required.");
      }

      if (!form.login.trim() || !form.email.trim()) {
        throw new Error("Username and email are required.");
      }
    }

    if (step === 3 && (!form.password || form.password !== form.password_confirmation)) {
      throw new Error("Password confirmation must match.");
    }
  }

  async function handleCredentialSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    try {
      if (loginMode) {
        setPending(true);
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
        return;
      }

      validateSignupStep();

      if (step < 3) {
        setStep((current) => current + 1);
        return;
      }

      setPending(true);
      const signupRole = choice;
      if (!signupRole) {
        throw new Error("Choose Agent or Locataire to create an account.");
      }

      const payload = new FormData();
      payload.set("name", fullName());
      payload.set("login", form.login.trim());
      payload.set("email", form.email.trim());
      payload.set("phone", form.phone.trim());
      payload.set("role", signupRole);
      payload.set("password", form.password);
      payload.set("password_confirmation", form.password_confirmation);

      if (signupRole === "locataire") {
        if (form.date_naissance) {
          payload.set("date_naissance", form.date_naissance);
        }
        if (form.adresse.trim()) {
          payload.set("adresse", form.adresse.trim());
        }
      }

      if (signupRole === "agent" && avatarFile) {
        payload.set("avatar_image", avatarFile);
      }

      const response = await registerFormWithBackend(payload);

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
        throw new Error(normalizeAuthError(result.error));
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Authentication failed.");
    } finally {
      setPending(false);
    }
  }

  function handleGoogle(flow: "login" | "signup") {
    resetMessages();
    if (!googleAvailable) {
      setError("Google sign-in is not enabled for this frontend session.");
      return;
    }

    localStorage.setItem("immoflow-auth-role", choice === "locataire" ? "locataire" : "agent");

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
              <Badge variant="warning">{loginMode ? "Secure access" : `Step ${step} of 3`}</Badge>
              <CardTitle className="mt-3 text-[40px] leading-[1.05] tracking-tight">
                {loginMode
                  ? "Sign in to your workspace."
                  : step === 1
                    ? "Choose your workspace."
                    : selectedChoice?.id === "agent"
                      ? "Create your agent profile."
                      : "Create your tenant profile."}
              </CardTitle>
            </div>
          </div>
          <div className="rounded-2xl border border-black/6 bg-[#faf8f4] px-4 py-3 text-sm text-[var(--muted-foreground)]">
            ImmoFlow
          </div>
        </div>

        <CardDescription className="max-w-2xl text-[15px] leading-7">
          {loginMode
            ? "One global login for super admin, admins, agents, and locataires."
            : "Pick an account type first. Administration is login-only because admins are created by the super admin dashboard."}
        </CardDescription>

        {mode === "signup" && !loginMode ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-black/50">
              <span>Step {step} of 3</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/8">
              <div className="h-full rounded-full bg-black transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-6">
        {mode === "signup" && step === 1 && !loginMode ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {choices.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectChoice(item.id)}
                  className="rounded-[22px] border border-black/10 bg-white p-5 text-center transition hover:-translate-y-0.5 hover:border-black/30 hover:shadow-[0_16px_32px_rgba(0,0,0,0.08)]"
                >
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
                    <item.icon className="h-6 w-6" />
                  </span>
                  <span className="mt-4 block text-lg font-semibold">{item.label}</span>
                  <span className="mt-2 block text-sm leading-6 text-black/55">{item.description}</span>
                </button>
              ))}
            </div>
            <div className="text-center text-sm text-black/45">
              Already have an account?{" "}
              <button type="button" className="font-semibold text-black" onClick={() => selectChoice("administration")}>
                Login
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleCredentialSubmit}>
            {mode === "signup" && !loginMode ? (
              <>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-black/55"
                  onClick={() => {
                    resetMessages();
                    setStep((current) => Math.max(1, current - 1));
                    if (step === 2) {
                      setChoice(null);
                    }
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                {step === 2 ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={form.first_name}
                          onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={form.last_name}
                          onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
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
                          onChange={(event) => setForm((current) => ({ ...current, login: event.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        />
                      </div>
                      {choice === "agent" ? (
                        <div className="space-y-2">
                          <Label htmlFor="avatar_image">Profile Image</Label>
                          <label className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/75 px-4 text-sm">
                            <ImageIcon className="h-4 w-4 text-black/45" />
                            <span className="truncate">{avatarFile?.name ?? "Upload image"}</span>
                            <input
                              id="avatar_image"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="date_naissance">Birth Date</Label>
                          <Input
                            id="date_naissance"
                            type="date"
                            value={form.date_naissance}
                            onChange={(event) => setForm((current) => ({ ...current, date_naissance: event.target.value }))}
                          />
                        </div>
                      )}
                    </div>

                    {choice === "locataire" ? (
                      <div className="space-y-2">
                        <Label htmlFor="adresse">Address</Label>
                        <Input
                          id="adresse"
                          value={form.adresse}
                          onChange={(event) => setForm((current) => ({ ...current, adresse: event.target.value }))}
                        />
                      </div>
                    ) : null}

                    {avatarPreview ? (
                      <div
                        aria-label="Profile preview"
                        className="h-24 w-24 rounded-2xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${avatarPreview})` }}
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="rounded-[22px] border border-black/8 bg-[#faf8f4] p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                          <Check className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold">{fullName()}</div>
                          <div className="text-sm text-black/55">
                            {selectedChoice?.label} • {form.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={form.password}
                          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password_confirmation">Confirm Password</Label>
                        <Input
                          id="password_confirmation"
                          type="password"
                          value={form.password_confirmation}
                          onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or Username</Label>
                  <Input
                    id="identifier"
                    value={form.identifier}
                    onChange={(event) => setForm((current) => ({ ...current, identifier: event.target.value }))}
                    placeholder="name@company.com or username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                </div>
              </>
            )}

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
                {loginMode ? <UserRound className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                {loginMode ? "Sign in" : step === 3 ? `Create ${selectedChoice?.label} account` : "Continue"}
              </Button>

              {googleAvailable ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="rounded-2xl"
                  onClick={() => handleGoogle(loginMode ? "login" : "signup")}
                >
                  <Globe2 className="h-4 w-4" />
                  Continue with Google
                </Button>
              ) : null}
            </div>
          </form>
        )}

        <div className="rounded-[22px] border border-black/6 bg-[#faf8f4] px-4 py-4 text-sm text-[var(--muted-foreground)]">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--secondary)]" />
            <div>
              {loginMode
                ? "Use the same login page for super admin, admin, agent, and locataire."
                : "Agent accounts wait for admin approval. Locataire accounts open their portal immediately."}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-black/8 pt-5 text-sm text-[var(--muted-foreground)]">
          <span>{loginMode ? "Need a new account?" : "Already registered?"}</span>
          <Link
            href={loginMode ? "/signup" : "/login"}
            className="inline-flex items-center gap-2 font-semibold text-[var(--foreground)]"
          >
            <span>{loginMode ? "Choose account type" : "Go to login"}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
