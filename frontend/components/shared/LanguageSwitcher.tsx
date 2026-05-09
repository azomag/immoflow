"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useI18n, type Locale } from "@/lib/i18n";
import { localeOptions } from "@/lib/runtime-translations";

type LanguageSwitcherProps = {
  compact?: boolean;
  className?: string;
};

export function LanguageSwitcher({ compact = false, className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const activeLocale = localeOptions[locale];

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:border-[var(--border-strong)] hover:shadow-md"
        aria-label="Language"
      >
        <Image
          src={activeLocale.flag}
          alt={activeLocale.nativeLabel}
          width={18}
          height={18}
          className="h-[18px] w-[18px] rounded-full object-cover"
        />
        {compact ? null : <span className="font-mono text-xs">{activeLocale.short}</span>}
        <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 min-w-44 overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-1.5 text-[var(--foreground)] shadow-2xl">
          {(["fr", "en", "ar"] as Locale[]).map((lang) => {
            const option = localeOptions[lang];
            const active = locale === lang;

            return (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setLocale(lang);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  active ? "bg-[var(--muted)] font-semibold" : "hover:bg-[var(--muted)]"
                }`}
              >
                <Image
                  src={option.flag}
                  alt={option.nativeLabel}
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px] rounded-full object-cover"
                />
                <span>{option.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

