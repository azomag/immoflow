"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import {
  getDashboardUrl,
  getLoginUrl,
  getSignupUrl,
  type LandingSession,
  type LandingUser,
} from "@/lib/app-routes";
import { useI18n } from "@/lib/i18n";

type AuthNavActionsProps = {
  variant: "hero" | "light";
  mobile?: boolean;
  onNavigate?: () => void;
};

function initials(name?: string | null) {
  if (!name) {
    return "IF";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getDisplayUser(session: LandingSession | null): LandingUser | null {
  const user = session?.user;
  if (!user) {
    return null;
  }

  return {
    ...user,
    name: user.backendUser?.name ?? user.name,
    email: user.backendUser?.email ?? user.email,
    avatar_url: user.backendUser?.avatar_url ?? user.avatar_url ?? user.image,
    role: user.backendUser?.role ?? user.role,
  };
}

export function AuthNavActions({ variant, mobile = false, onNavigate }: AuthNavActionsProps) {
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [signedOut, setSignedOut] = useState(false);

  const user = useMemo(
    () => (signedOut ? null : getDisplayUser(session as LandingSession | null)),
    [session, signedOut],
  );
  const loading = status === "loading";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const loginClass =
    variant === "hero"
      ? "rounded-full border border-white/16 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-primary"
      : "rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/72 transition hover:border-black/20 hover:text-black";
  const signupClass =
    variant === "hero"
      ? "btn-glow rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
      : "rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/86";

  const handleLogout = () => {
    setSignedOut(true);
    setOpen(false);
    onNavigate?.();
    void signOut({ callbackUrl: "/" });
  };

  if (loading && !mobile) {
    return <div className="h-10 w-28 rounded-full bg-white/10" />;
  }

  if (!user) {
    if (mobile) {
      return (
        <div className="grid gap-3 pt-8">
          <Link
            href={getLoginUrl()}
            onClick={onNavigate}
            className="flex w-full items-center justify-center rounded-full border border-black/10 py-4 text-base font-medium text-foreground transition-transform active:scale-[0.98]"
          >
            {t.nav.login}
          </Link>
          <Link
            href={getSignupUrl()}
            onClick={onNavigate}
            className="flex w-full items-center justify-center rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform active:scale-[0.98]"
          >
            {t.nav.signup}
          </Link>
        </div>
      );
    }

    return (
      <>
        <Link href={getLoginUrl()} className={loginClass}>
          {t.nav.login}
        </Link>
        <Link href={getSignupUrl()} className={signupClass}>
          {t.nav.signup}
        </Link>
      </>
    );
  }

  const avatar = user.avatar_url ?? user.image;
  const dashboardUrl = getDashboardUrl(user.role);
  const profileUrl = getDashboardUrl(user.role, true);

  if (mobile) {
    return (
      <div className="pt-8">
        <div className="rounded-2xl border border-black/10 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full  text-sm font-bold ">
              {avatar ? <Image src={avatar} alt={user.name} width={44} height={44} className="h-full w-full object-cover" /> : initials(user.name)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <Link href={profileUrl} onClick={onNavigate} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted">
              <Settings className="h-4 w-4" />
              {t.nav.profileSettings}
            </Link>
            <Link href={dashboardUrl} onClick={onNavigate} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted">
              <LayoutDashboard className="h-4 w-4" />
              {t.nav.dashboard}
            </Link>
            <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              {t.nav.logout}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center gap-2 rounded-full border px-2 py-1.5 transition ${
          variant === "hero"
            ? "border-white/16 bg-white/10 text-white hover:bg-white/14"
            : "border-black/10 bg-white text-black hover:bg-black/5"
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-primary-foreground">
          {avatar ? <Image src={avatar} alt={user.name} width={25} height={25} className="h-full w-full object-cover" /> : initials(user.name)}
        </span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-64 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 text-black shadow-2xl">
          <div className="px-3 py-2.5">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="mt-0.5 truncate text-xs text-black/52">{user.email}</div>
            {user.role ? (
              <div className="mt-2 inline-flex rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-black/62">
                {user.role.replace("_", " ")}
              </div>
            ) : null}
          </div>
          <div className="my-1 h-px bg-black/8" />
          <Link href={profileUrl} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-black/5">
            <Settings className="h-4 w-4 text-black/48" />
            {t.nav.profileSettings}
          </Link>
          <Link href={dashboardUrl} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-black/5">
            <LayoutDashboard className="h-4 w-4 text-black/48" />
            {t.nav.dashboard}
          </Link>
          <div className="my-1 h-px bg-black/8" />
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            {t.nav.logout}
          </button>
        </div>
      ) : null}
    </div>
  );
}
