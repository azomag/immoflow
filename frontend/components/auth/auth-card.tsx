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
  CheckCircle2
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

// Keeping your beautiful original gradients for the icons
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
    iconClass: "bg-[linear-gradient(135deg,#7f5539_0%,#9c6644_100%)] text-white shadow-[0_4px_12px_rgba(127,85,57,0.3)]",
  },
  {
    id: "locataire",
    label: "Locataire",
    description: "Access contracts, residence details, and receipts.",
    icon: UserRound,
    iconClass: "bg-[linear-gradient(135deg,#b08968_0%,#ddb892_100%)] text-white shadow-[0_4px_12px_rgba(176,137,104,0.3)]",
  },
  {
    id: "administration",
    label: "Administration",
    description: "Admins sign in here. Super admin creates admin accounts.",
    icon: ShieldCheck,
    iconClass: "bg-[linear-gradient(135deg,#18181b_0%,#09090b_100%)] text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]",
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
        setTimeout(resolve, attempt === 0 ? 1200 : 2200)
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
          : "Could not prepare the avatar image."
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
      if (!signupRole)
        throw new Error("Choose Agent or Locataire to create an account.");

      const payload = new FormData();
      payload.set("name", fullName());
      payload.set("login", form.login.trim());
      payload.set("email", form.email.trim());
      payload.set("phone", form.phone.trim());
      payload.set("role", signupRole);
      payload.set("password", form.password);
      payload.set("password_confirmation", form.password_confirmation);

      if (signupRole === "locataire") {
        if (form.date_naissance)
          payload.set("date_naissance", form.date_naissance);
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

  // Next-Gen Premium Inputs
  const inputClassName =
    "h-12 w-full rounded-xl bg-zinc-50/50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-400 px-4 transition-all duration-300 shadow-sm";
  
  const labelClassName = "text-[13px] font-semibold text-zinc-700 mb-1.5 block";

  return (
    <div className="flex min-h-screen bg-white font-sans selection:bg-zinc-900 selection:text-white p-5">
     
      {/* ── Left Visual Panel (Full Bleed Image with Glassmorphism) ── */}
      <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden bg-zinc-100 items-end p-12 xl:p-20 rounded-l-2xl">
        <Image
          src="/assets/profile/logo/login-image.jpeg"
          alt="ImmoFlow Architecture"
          fill
          priority
          className="object-cover object-center rounded-l-2xl"
        />
        {/* Beautiful Multi-Stop Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/40 to-transparent z-10" />
        
        {/* <div className="relative z-20 w-full max-w-lg">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl">
            <Building2 className="h-7 w-7" />
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-white mb-4 drop-shadow-sm leading-tight">
            Design your future, <br />
            one blueprint at a time.
          </h2>
          <p className="text-zinc-300 text-base leading-relaxed mb-8 max-w-md">
            Join an exclusive network of visionaries. Immoflow provides premium resources to elevate your architectural excellence.
          </p>
          <div className="flex items-center gap-4 text-sm text-zinc-400 font-medium">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-zinc-300" /> Premium Access
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-zinc-300" /> Secure Cloud
            </span>
          </div>
        </div> */}
      </div>

      {/* ── Right Form Panel (Clean, Spacious, Minimalist) ── */}
      <div className="relative flex flex-1 flex-col justify-center px-6 py-12 md:px-16 lg:px-24">

        {/* Mobile logo */}
        <div className="mb-10 flex items-center lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <Badge className="rounded-full border border-zinc-200 bg-zinc-100/50 text-zinc-700 px-3 py-1 text-[11px] font-bold tracking-wider uppercase shadow-none">
                {loginMode ? "Secure Authentication" : `Step ${step} of 3`}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 mb-2">
              {loginMode
                ? "Welcome back."
                : step === 1
                ? "Choose account type"
                : selectedChoice?.id === "agent"
                ? "Agent Profile"
                : "Tenant Profile"}
            </h1>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {loginMode
                ? "Enter your credentials to access your unified workspace."
                : "Select the workspace that best fits your professional needs."}
            </p>
          </div>

          {/* Progress bar */}
          {mode === "signup" && !loginMode ? (
            <div className="mb-10">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                <span>Account Setup</span>
                <span className="text-zinc-900">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-900 transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {/* ── Step 1: Immersive Selection Cards ── */}
          {mode === "signup" && step === 1 && !loginMode ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
              <div className="grid gap-4">
                {choices.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectChoice(item.id)}
                    className="group relative flex items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-5 text-left transition-all duration-300 hover:border-zinc-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-zinc-900/5"
                  >
                    <span
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${item.iconClass} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <item.icon className="h-6 w-6" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[17px] font-semibold text-zinc-900">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-[13px] text-zinc-500 leading-relaxed">
                        {item.description}
                      </span>
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition-all duration-300 group-hover:bg-zinc-900 group-hover:text-white group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-center text-[13px] font-medium text-zinc-500 mt-8">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-zinc-900 hover:text-zinc-600 transition-colors underline-offset-4 hover:underline"
                  onClick={() => selectChoice("administration")}
                >
                  Sign in securely
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" onSubmit={handleCredentialSubmit}>
              {/* Back button */}
              {mode === "signup" && !loginMode ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-400 hover:text-zinc-900 transition-colors"
                  onClick={() => {
                    resetMessages();
                    setStep((current) => Math.max(1, current - 1));
                    if (step === 2) setChoice(null);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go back
                </button>
              ) : null}

              {/* Step 2 fields */}
              {mode === "signup" && !loginMode && step === 2 ? (
                <div className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="first_name" className={labelClassName}>First name</Label>
                      <Input
                        id="first_name"
                        value={form.first_name}
                        onChange={(e) => setForm((c) => ({ ...c, first_name: e.target.value }))}
                        className={inputClassName}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name" className={labelClassName}>Last name</Label>
                      <Input
                        id="last_name"
                        value={form.last_name}
                        onChange={(e) => setForm((c) => ({ ...c, last_name: e.target.value }))}
                        className={inputClassName}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="login" className={labelClassName}>Username</Label>
                      <Input
                        id="login"
                        value={form.login}
                        onChange={(e) => setForm((c) => ({ ...c, login: e.target.value }))}
                        className={inputClassName}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className={labelClassName}>Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                        className={inputClassName}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="phone" className={labelClassName}>Phone number</Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                        className={inputClassName}
                      />
                    </div>
                    {choice === "agent" || choice === "locataire" ? (
                      <div>
                        <Label htmlFor="avatar_image" className={labelClassName}>Profile picture</Label>
                        <label className={`${inputClassName} flex cursor-pointer items-center gap-3 !px-4 hover:border-zinc-300`}>
                          <ImageIcon className="h-4 w-4 text-zinc-400" />
                          <span className="truncate text-zinc-600 text-[13px] font-medium">
                            {preparingAvatar ? "Processing..." : avatarFile?.name ?? "Choose file"}
                          </span>
                          <input
                            id="avatar_image"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => void handleAvatarChange(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="date_naissance" className={labelClassName}>Date of birth</Label>
                        <Input
                          id="date_naissance"
                          type="date"
                          value={form.date_naissance}
                          onChange={(e) => setForm((c) => ({ ...c, date_naissance: e.target.value }))}
                          className={inputClassName}
                        />
                      </div>
                    )}
                  </div>
                  {choice === "locataire" ? (
                    <div>
                      <Label htmlFor="adresse" className={labelClassName}>Home address</Label>
                      <Input
                        id="adresse"
                        value={form.adresse}
                        onChange={(e) => setForm((c) => ({ ...c, adresse: e.target.value }))}
                        className={inputClassName}
                      />
                    </div>
                  ) : null}
                  {avatarPreview ? (
                    <div
                      aria-label="Profile preview"
                      className="h-16 w-16 rounded-full bg-cover bg-center shadow-md border-2 border-white ring-1 ring-zinc-200"
                      style={{ backgroundImage: `url(${avatarPreview})` }}
                    />
                  ) : null}
                </div>
              ) : null}

              {/* Step 3 — password + review */}
              {mode === "signup" && !loginMode && step === 3 ? (
                <div className="space-y-6">
                  {/* Premium Profile Summary Card */}
                  <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shrink-0 shadow-md">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900">
                        {fullName()}
                      </div>
                      <div className="text-[13px] text-zinc-500 font-medium">
                        {selectedChoice?.label} · {form.email}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="password" className={labelClassName}>Create password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                        className={inputClassName}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password_confirmation" className={labelClassName}>Confirm password</Label>
                      <Input
                        id="password_confirmation"
                        type="password"
                        value={form.password_confirmation}
                        onChange={(e) => setForm((c) => ({ ...c, password_confirmation: e.target.value }))}
                        className={inputClassName}
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Login fields */}
              {loginMode ? (
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="identifier" className={labelClassName}>Email or username</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="identifier"
                        value={form.identifier}
                        onChange={(e) => setForm((c) => ({ ...c, identifier: e.target.value }))}
                        placeholder="name@company.com"
                        className={`${inputClassName} pl-12`}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password" className={labelClassName}>Password</Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                        placeholder="••••••••••••"
                        className={`${inputClassName} pl-12`}
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Status messages */}
              {message ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-[13px] font-medium text-zinc-700 shadow-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {message}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-[13px] font-medium text-red-600 shadow-sm">
                  {error}
                </div>
              ) : null}

              {/* Action buttons - Sleek and modern */}
              <div className="pt-4 space-y-4">
                <Button
                  type="submit"
                  disabled={pending || preparingAvatar}
                  className="h-12 w-full rounded-xl bg-zinc-900 text-white font-semibold text-[14px] shadow-[0_4px_14px_0_rgb(24,24,27,0.25)] hover:shadow-[0_6px_20px_rgba(24,24,27,0.2)] hover:bg-zinc-800 disabled:opacity-50 transition-all duration-200 active:scale-[0.98]"
                >
                  {loginMode
                    ? preparingAvatar
                      ? "Preparing..."
                      : pending
                      ? "Authenticating..."
                      : "Sign in"
                    : step === 3
                    ? preparingAvatar
                      ? "Processing image..."
                      : pending
                      ? "Creating account..."
                      : `Create account`
                    : "Continue"}
                </Button>

                {googleAvailable ? (
                  <>
                    <div className="relative flex items-center gap-4 py-1">
                      <div className="h-px flex-1 bg-zinc-200" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                        Or continue with
                      </span>
                      <div className="h-px flex-1 bg-zinc-200" />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 w-full rounded-xl border border-zinc-200 bg-white text-zinc-700 font-semibold text-[14px] shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200 active:scale-[0.98]"
                      onClick={() => handleGoogle(loginMode ? "login" : "signup")}
                    >
                      <Globe className="h-4 w-4 mr-2 text-zinc-500" />
                      Google
                    </Button>
                  </>
                ) : null}
              </div>

              {/* Bottom Nav Links */}
              <div className="text-center text-[13px] font-medium text-zinc-500 pt-2">
                {loginMode ? "Don't have an account? " : "Already have an account? "}
                <Link
                  href={loginMode ? "/signup" : "/login"}
                  className="text-zinc-900 hover:text-zinc-600 transition-colors underline-offset-4 hover:underline"
                >
                  {loginMode ? "Sign up" : "Log in"}
                </Link>
              </div>
            </form>
          )}

          {/* Footer Terms */}
        
        </div>
      </div>
    </div>
  );
}