"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { AuthNavActions } from "@/components/shared/AuthNavActions";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export function PublicHeader() {
  const { t } = useI18n();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-black/8 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo/logo-immoflow.png"
            alt="Immoflow"
            width={48}
            height={48}
            className="h-11 w-11 object-contain"
          />
          <span className="font-heading text-xl font-semibold tracking-tight">Immoflow</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-black/62 md:flex">
          <Link href="/" className="transition hover:text-black">
            {t.nav.links[0]?.label ?? "Accueil"}
          </Link>
          <Link href="/listings" className="transition hover:text-black">
            {t.nav.links[1]?.label ?? "Listing"}
          </Link>
          <Link href="/#contact" className="transition hover:text-black">
            {t.nav.links[3]?.label ?? "Contact"}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <Link
            href="/"
            className="hidden items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/72 transition hover:border-black/20 hover:text-black sm:flex"
          >
            <ArrowLeft className="h-4 w-4" />
            Accueil
          </Link>
          <AuthNavActions variant="light" />
        </div>
      </div>
    </header>
  );
}
