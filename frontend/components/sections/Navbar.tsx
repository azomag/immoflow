"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n, type Locale } from "@/lib/i18n";
import { AuthNavActions } from "@/components/shared/AuthNavActions";

const localeOptions: Record<Locale, { short: string; label: string; flag: string }> = {
  en: { short: "EN", label: "English", flag: "/language/en.svg" },
  fr: { short: "FR", label: "Français", flag: "/language/fr.svg" },
  ar: { short: "AR", label: "العربية", flag: "/language/ar.svg" },
};

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const desktopLocaleRef = useRef<HTMLDivElement>(null);
  const mobileLocaleRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale, t } = useI18n();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopLocaleOpen, setIsDesktopLocaleOpen] = useState(false);
  const [isMobileLocaleOpen, setIsMobileLocaleOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileLocaleOpen(false);
  };

  // GSAP Navbar Entrance Animation
  useEffect(() => {
    if (!navRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, delay: 0.2 }
    );
  }, []);

  // Handle clicking outside of dropdowns
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (desktopLocaleRef.current && !desktopLocaleRef.current.contains(target)) {
        setIsDesktopLocaleOpen(false);
      }
      if (mobileLocaleRef.current && !mobileLocaleRef.current.contains(target)) {
        setIsMobileLocaleOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const activeLocale = localeOptions[locale];

  return (
    <>
      <nav
        ref={navRef}
        className="absolute top-0 left-0 right-0 z-50  border-white/12  backdrop-blur-md"
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-4 lg:px-12">
          {/* Logo */}
          <Link href="/" className="relative z-10 flex items-center">
            <Image
              src="assets/profile/immoflow-logo-light.png"
              alt="Immoflow"
              width={100}
              height={100}
              className="h-15 w-15 object-contain"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-1 md:flex text-gray-200">
            {t.nav.links.map((link) => (
              <Link
                key={`desktop-link-${link.href}`}
                href={link.href}
                className="nav-link group relative px-4 py-2 text-sm font-medium text-white/82 transition-colors duration-300 hover:text-white"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-secondary transition-all duration-500 ease-out group-hover:w-1/2" />
              </Link>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Desktop Locale Dropdown */}
            <div ref={desktopLocaleRef} className="relative ">
              <button
                type="button"
                onClick={() => setIsDesktopLocaleOpen((open) => !open)}
                className="flex items-center gap-3  rounded-full border border-white/14 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-md transition-colors hover:bg-white/14"
              >
                <Image
                  src={activeLocale.flag}
                  alt={activeLocale.label}
                  width={18}
                  height={18}
                  className="h-[19px] w-[25px] rounded-xl object-cover"
                />
                <span className="font-mono text-xs uppercase tracking-widest text-white/88">
                  {activeLocale.short}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-white/70 transition-transform duration-300 ${
                    isDesktopLocaleOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isDesktopLocaleOpen && (
                  <motion.div
                    key="desktop-locale-dropdown"
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute  right-0 top-[calc(100%+12px)] min-w-[180px] overflow-hidden rounded-2xl border border-white/14 bg-[#13202b]/92 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl"
                  >
                    {(["fr", "en", "ar"] as Locale[]).map((lang) => {
                      const option = localeOptions[lang];
                      const isActive = locale === lang;
                      return (
                        <button
                          key={`desktop-lang-${lang}`}
                          type="button"
                          onClick={() => {
                            setLocale(lang);
                            setIsDesktopLocaleOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            isActive ? "bg-white text-primary" : "text-white/82 hover:bg-white/10"
                          }`}
                        >
                          <Image
                            src={option.flag}
                            alt={option.label}
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] rounded-full object-cover"
                          />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AuthNavActions variant="hero" />
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="relative z-10 p-2 text-white transition-transform active:scale-90 md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* ── NEW BULLETPROOF MOBILE MENU (TAILWIND CSS ONLY) ── 
        No Framer Motion AnimatePresence used here to avoid DOM Node errors.
      */}
      
      {/* 1. Backdrop */}
      <div
        className={`fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={closeMobileMenu}
      />

      {/* 2. Sliding Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[60] flex w-[88vw] max-w-sm flex-col overflow-y-auto bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <Image
            src="/logo/logo-immoflow.png"
            alt="Immoflow"
            width={52}
            height={52}
            className="h-12 w-12 object-contain"
          />
          <button
            className="rounded-full p-2 text-foreground transition-colors hover:bg-black/5 active:scale-90"
            onClick={closeMobileMenu}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Locale Selector */}
        <div ref={mobileLocaleRef} className="relative mb-8">
          <button
            type="button"
            onClick={() => setIsMobileLocaleOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 active:bg-gray-50"
          >
            <span className="flex items-center gap-3">
              <Image
                src={activeLocale.flag}
                alt={activeLocale.label}
                width={20}
                height={20}
                className="h-5 w-5 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-foreground">{activeLocale.label}</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                isMobileLocaleOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Locale Dropdown - CSS Grid transition for smooth height animation */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
              isMobileLocaleOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-white px-2 shadow-sm">
              <div className="py-2">
                {(["fr", "en", "ar"] as Locale[]).map((lang) => {
                  const option = localeOptions[lang];
                  const isActive = locale === lang;
                  return (
                    <button
                      key={`mobile-lang-${lang}`}
                      type="button"
                      onClick={() => {
                        setLocale(lang);
                        setIsMobileLocaleOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                        isActive ? "bg-muted text-foreground" : "text-foreground/80 hover:bg-muted"
                      }`}
                    >
                      <Image
                        src={option.flag}
                        alt={option.label}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                      <span className="text-sm">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Links */}
        <div className="flex flex-1 flex-col">
          {t.nav.links.map((link) => (
            <Link
              key={`mobile-link-${link.href}`}
              href={link.href}
              onClick={closeMobileMenu}
              className="flex items-center justify-between border-b border-border/40 py-4 text-lg font-heading font-medium text-foreground transition-colors hover:text-primary"
            >
              {link.label}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}

          <AuthNavActions variant="light" mobile onNavigate={closeMobileMenu} />
        </div>
      </div>
    </>
  );
}
