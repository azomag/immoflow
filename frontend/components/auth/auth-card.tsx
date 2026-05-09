"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Globe,
  Image as ImageIcon,
  ShieldCheck,
  UserRound,
  KeyRound,
  Mail,
} from "lucide-react";
import { registerFormWithBackend } from "@/lib/api";
import { prepareImageForUpload } from "@/lib/image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

type SignupChoice = "agent" | "locataire" | "administration";

const choices: Array<{
  id: SignupChoice;
  label: string;
  description: string;
  icon: typeof UserRound;
  iconClass: string;
}> = [
  {
    id: "agent",
    label: "Agent",
    description: "Create properties, contracts, and collect payments.",
    icon: Building2,
    iconClass: "bg-[linear-gradient(135deg,#7f5539_0%,#9c6644_100%)] text-white",
  },
  {
    id: "locataire",
    label: "Locataire",
    description: "Access contracts, residence details, and receipts.",
    icon: UserRound,
    iconClass: "bg-[linear-gradient(135deg,#b08968_0%,#ddb892_100%)] text-white",
  },
  {
    id: "administration",
    label: "Administration",
    description: "Admins sign in here. Super admin creates admin accounts.",
    icon: ShieldCheck,
    iconClass: "bg-[linear-gradient(135deg,#111827_0%,#000000_100%)] text-white",
  },
];

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [choice, setChoice] = useState<SignupChoice | null>(
    mode === "login" ? "administration" : null
  );
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
  const [preparingAvatar, setPreparingAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);

  const loginMode = mode === "login" || choice === "administration";
  const selectedChoice = choices.find((item) => item.id === choice) ?? null;
  const progress =
    mode === "signup" && !loginMode ? Math.round((step / 3) * 100) : 100;
  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile]
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

  async function signInWithRetry(identifier: string, password: string) {
    let lastError: string | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (!result?.error) {
        return true;
      }

      lastError = normalizeAuthError(result.error);
      const retryable =
        /fetch|network|timeout|server|failed/i.test(lastError);
      if (!retryable || attempt === 2) {
        throw new Error(lastError);
      }

      await new Promise((resolve) =>
        setTimeout(resolve, attempt === 0 ? 1200 : 2200),
      );
    }

    if (lastError) {
      throw new Error(lastError);
    }

    return false;
  }

  function resetMessages() {
    setError(null);
    setMessage(null);
  }

  async function handleAvatarChange(file: File | null) {
    resetMessages();

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

  function selectChoice(nextChoice: SignupChoice) {
    resetMessages();
    setChoice(nextChoice);
    setStep(2);
  }

  function validateSignupStep() {
    if (!choice || choice === "administration") return;

    if (step === 2) {
      if (!fullName()) throw new Error("First name and last name are required.");
      if (!form.login.trim() || !form.email.trim())
        throw new Error("Username and email are required.");
    }

    if (
      step === 3 &&
      (!form.password || form.password !== form.password_confirmation)
    ) {
      throw new Error("Password confirmation must match.");
    }
  }

  async function handleCredentialSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    resetMessages();

    try {
      if (loginMode) {
        setPending(true);
        await signInWithRetry(form.identifier, form.password);

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
      if (!signupRole) throw new Error("Choose Agent or Locataire to create an account.");

      const payload = new FormData();
      payload.set("name", fullName());
      payload.set("login", form.login.trim());
      payload.set("email", form.email.trim());
      payload.set("phone", form.phone.trim());
      payload.set("role", signupRole);
      payload.set("password", form.password);
      payload.set("password_confirmation", form.password_confirmation);

      if (signupRole === "locataire") {
        if (form.date_naissance) payload.set("date_naissance", form.date_naissance);
        if (form.adresse.trim()) payload.set("adresse", form.adresse.trim());
      }

      if (avatarFile) {
        payload.set("avatar_image", avatarFile);
      }

      const response = await registerFormWithBackend(payload);

      if (response.user.status !== "active") {
        router.push("/pending");
        return;
      }

      await signInWithRetry(form.login.trim() || form.email, form.password);

      router.push("/dashboard");
      router.refresh();
    } catch (submissionError) {
      if (
        submissionError instanceof Error &&
        submissionError.message.toLowerCase().includes("awaiting approval")
      ) {
        router.push("/pending");
        return;
      }

      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Authentication failed."
      );
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
    localStorage.setItem(
      "immoflow-auth-role",
      choice === "locataire" ? "locataire" : "agent"
    );
    startTransition(() => {
      void signIn("google", { callbackUrl: `/auth/complete?flow=${flow}` });
    });
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left Visual Panel ── */}
      <div className="relative hidden lg:block lg:w-[44%] overflow-hidden bg-[#dfeff7]">
        <Image
          src="/assets/profile/logo/immoflow-logo.png"
          alt="ImmoFlow"
          fill
          priority
          className="object-contain p-16 xl:p-24"
        />
      </div>

      {/* ── Right Form Panel ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-[var(--background)] px-6 py-10 md:px-12 lg:px-16">
        <LanguageSwitcher className="absolute right-6 top-6" />

        {/* Mobile logo */}
        <div className="mb-8 flex items-center lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-[0_4px_12px_rgba(1,79,134,0.25)]">
            <Image src="/assets/profile/logo/immoflow-logo.png" alt="ImmoFlow logo" width={36} height={36} className="h-full w-full object-contain" />
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Step badge */}
          <div className="mb-4 flex items-center gap-3">
            <Badge className="rounded-full border-[rgba(1,73,124,0.24)] bg-[var(--primary-glow)] text-[var(--primary)] text-xs font-semibold">
              {loginMode ? "Secure access" : `Step ${step} of 3`}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-[34px] font-bold tracking-tight text-[var(--foreground)]">
            {loginMode
              ? "Sign in to your workspace."
              : step === 1
              ? "Choose your workspace."
              : selectedChoice?.id === "agent"
              ? "Create your agent profile."
              : "Create your tenant profile."}
          </h1>
          <p className="mt-2 text-sm leading-6 text-black/65">
            {loginMode
              ? "One global login for super admin, admins, agents, and locataires."
              : "Pick an account type first. Administration is login-only."}
          </p>

          {/* Progress bar */}
          {mode === "signup" && !loginMode ? (
            <div className="mt-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-black/60">
                <span>Step {step} of 3</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--muted)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          <Separator className="my-6" />

          {/* ── Step 1: Role selector ── */}
          {mode === "signup" && step === 1 && !loginMode ? (
            <div className="space-y-5 animate-fade-in-up">
              <div className="grid gap-3">
                {choices.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectChoice(item.id)}
                    className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 text-left transition-all hover:border-[rgba(1,73,124,0.3)] hover:shadow-[0_4px_16px_rgba(1,73,124,0.08)] hover:-translate-y-0.5"
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.iconClass} shadow-[0_4px_12px_rgba(0,0,0,0.16)] transition-transform group-hover:scale-105`}
                    >
                      <item.icon className="h-6 w-6" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-[var(--foreground)]">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-sm text-black/65">
                        {item.description}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
              <div className="text-center text-sm text-black/60">
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
                  onClick={() => selectChoice("administration")}
                >
                  Sign in
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-5 animate-fade-in-up" onSubmit={handleCredentialSubmit}>
              {/* Back button */}
              {mode === "signup" && !loginMode ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  onClick={() => {
                    resetMessages();
                    setStep((current) => Math.max(1, current - 1));
                    if (step === 2) setChoice(null);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : null}

              {/* Step 2 fields */}
              {mode === "signup" && !loginMode && step === 2 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={form.first_name}
                        onChange={(e) =>
                          setForm((c) => ({ ...c, first_name: e.target.value }))
                        }
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={form.last_name}
                        onChange={(e) =>
                          setForm((c) => ({ ...c, last_name: e.target.value }))
                        }
                        className="h-11 rounded-xl"
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
                        onChange={(e) =>
                          setForm((c) => ({ ...c, login: e.target.value }))
                        }
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((c) => ({ ...c, email: e.target.value }))
                        }
                        className="h-11 rounded-xl"
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
                        onChange={(e) =>
                          setForm((c) => ({ ...c, phone: e.target.value }))
                        }
                        className="h-11 rounded-xl"
                      />
                    </div>
                    {choice === "agent" || choice === "locataire" ? (
                      <div className="space-y-2">
                        <Label htmlFor="avatar_image">Profile Image</Label>
                        <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--muted-foreground)] hover:border-[var(--border-strong)] transition-colors">
                          <ImageIcon className="h-4 w-4" />
                          <span className="truncate">
                            {preparingAvatar ? "Preparing image..." : avatarFile?.name ?? "Upload image"}
                          </span>
                          <input
                            id="avatar_image"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) =>
                              void handleAvatarChange(e.target.files?.[0] ?? null)
                            }
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
                          onChange={(e) =>
                            setForm((c) => ({
                              ...c,
                              date_naissance: e.target.value,
                            }))
                          }
                          className="h-11 rounded-xl"
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
                        onChange={(e) =>
                          setForm((c) => ({ ...c, adresse: e.target.value }))
                        }
                        className="h-11 rounded-xl"
                      />
                    </div>
                  ) : null}
                  {avatarPreview ? (
                    <div
                      aria-label="Profile preview"
                      className="h-20 w-20 rounded-2xl bg-cover bg-center shadow-[var(--shadow-sm)]"
                      style={{ backgroundImage: `url(${avatarPreview})` }}
                    />
                  ) : null}
                </>
              ) : null}

              {/* Step 3 — password + review */}
              {mode === "signup" && !loginMode && step === 3 ? (
                <>
                  <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl icon-indigo shrink-0">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">
                        {fullName()}
                      </div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        {selectedChoice?.label} · {form.email}
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
                        onChange={(e) =>
                          setForm((c) => ({ ...c, password: e.target.value }))
                        }
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation">
                        Confirm Password
                      </Label>
                      <Input
                        id="password_confirmation"
                        type="password"
                        value={form.password_confirmation}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            password_confirmation: e.target.value,
                          }))
                        }
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : null}

              {/* Login fields */}
              {loginMode ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Email or Username</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <Input
                        id="identifier"
                        value={form.identifier}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            identifier: e.target.value,
                          }))
                        }
                        placeholder="name@company.com or username"
                        className="h-11 rounded-xl pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) =>
                          setForm((c) => ({ ...c, password: e.target.value }))
                        }
                        className="h-11 rounded-xl pl-10"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : null}

              {/* Status messages */}
              {message ? (
                <div className="rounded-xl border border-[rgba(44,125,160,0.2)] bg-[var(--success-bg)] px-4 py-3 text-sm font-medium text-[var(--success)]">
                  {message}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-xl border border-[rgba(1,42,74,0.2)] bg-[var(--danger-bg)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
                  {error}
                </div>
              ) : null}

              {/* Action buttons */}
              <div className="grid gap-3 pt-1">
                <Button
                  type="submit"
                  size="lg"
                  disabled={pending || preparingAvatar}
                  className="h-12 w-full rounded-xl bg-[var(--primary)] font-semibold shadow-[var(--shadow-primary)] hover:bg-[var(--primary-hover)] disabled:opacity-60"
                >
                  {loginMode ? (
                    <UserRound className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {loginMode
                    ? preparingAvatar
                      ? "Preparing image..."
                      : pending
                      ? "Signing in…"
                      : "Sign in"
                    : step === 3
                    ? preparingAvatar
                      ? "Preparing image..."
                      : pending
                      ? "Creating…"
                      : `Create ${selectedChoice?.label} account`
                    : "Continue"}
                </Button>

                {googleAvailable ? (
                  <>
                    <div className="relative flex items-center gap-3">
                      <div className="h-px flex-1 bg-[var(--border)]" />
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                        or
                      </span>
                      <div className="h-px flex-1 bg-[var(--border)]" />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="h-12 w-full rounded-xl font-semibold hover:bg-white"
                      onClick={() =>
                        handleGoogle(loginMode ? "login" : "signup")
                      }
                    >
                      <Globe className="h-4 w-4" />
                      Continue with Google
                    </Button>
                  </>
                ) : null}
              </div>
            </form>
          )}

          {/* Footer link */}
          <Separator className="my-6" />
          <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
            <span>
              {loginMode ? "Need a new account?" : "Already registered?"}
            </span>
            <Link
              href={loginMode ? "/signup" : "/login"}
              className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
            >
              {loginMode ? "Choose account type" : "Go to login"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
