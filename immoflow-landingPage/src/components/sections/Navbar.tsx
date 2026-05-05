"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n, type Locale } from "@/lib/i18n";

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

  useEffect(() => {
    if (!navRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, delay: 0.2 }
    );
  }, []);

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

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const activeLocale = localeOptions[locale];

  return (
    <>
      <nav
        ref={navRef}
        className="absolute top-0 left-0 right-0 z-50 border-b border-white/12 bg-white/8 backdrop-blur-md"
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-4 lg:px-12">
          <Link href="#home" className="relative z-10 flex items-center">
            <Image
              src="/logo/logo-immoflow.png"
              alt="Immoflow"
              width={52}
              height={52}
              className="h-12 w-12 object-contain"
            />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {t.nav.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link group relative px-4 py-2 text-sm font-medium text-white/82 transition-colors duration-300 hover:text-white"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-secondary transition-all duration-500 ease-out group-hover:w-1/2" />
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div ref={desktopLocaleRef} className="relative">
              <button
                type="button"
                onClick={() => setIsDesktopLocaleOpen((open) => !open)}
                className="flex items-center gap-3 rounded-full border border-white/14 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-md transition-colors hover:bg-white/14"
              >
                <Image
                  src={activeLocale.flag}
                  alt={activeLocale.label}
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px] rounded-full object-cover"
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
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-[calc(100%+12px)] min-w-[180px] overflow-hidden rounded-2xl border border-white/14 bg-[#13202b]/92 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl"
                  >
                    {(["fr", "en", "ar"] as Locale[]).map((lang) => {
                      const option = localeOptions[lang];
                      const isActive = locale === lang;

                      return (
                        <button
                          key={lang}
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

            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="#contact"
              className="btn-glow flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            >
              {t.nav.cta}
              <ArrowRight className="h-4 w-4" />
            </motion.a>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="relative z-10 p-2 text-white md:hidden"
            onClick={() => {
              setIsMobileLocaleOpen(false);
              setIsMobileMenuOpen(true);
            }}
          >
            <Menu className="h-6 w-6" />
          </motion.button>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: "100%", opacity: 0.92 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.96 }}
              transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.85 }}
              className="fixed top-0 right-0 bottom-0 z-[60] flex w-[88vw] max-w-sm flex-col overflow-y-auto bg-white p-6 shadow-2xl md:hidden"
            >
              <div className="mb-10 flex items-center justify-between">
                <Image
                  src="/logo/logo-immoflow.png"
                  alt="Immoflow"
                  width={52}
                  height={52}
                  className="h-12 w-12 object-contain"
                />
                <motion.button
                  whileTap={{ scale: 0.9, rotate: 90 }}
                  className="rounded-full p-2 text-foreground hover:bg-black/5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              <div ref={mobileLocaleRef} className="relative mb-8">
                <button
                  type="button"
                  onClick={() => setIsMobileLocaleOpen((open) => !open)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-white px-4 py-3"
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

                <AnimatePresence>
                  {isMobileLocaleOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-xl"
                    >
                      {(["fr", "en", "ar"] as Locale[]).map((lang) => {
                        const option = localeOptions[lang];
                        const isActive = locale === lang;

                        return (
                          <button
                            key={lang}
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-1 flex-col">
                {t.nav.links.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 26 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 18 }}
                    transition={{ delay: index * 0.07 + 0.12, duration: 0.32 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between border-b border-border/40 py-4 text-lg font-heading font-medium text-foreground"
                    >
                      {link.label}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </motion.div>
                ))}

                <motion.a
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  href="#contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-auto rounded-full bg-primary py-4 text-center text-base font-medium text-primary-foreground"
                >
                  {t.nav.cta}
                </motion.a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
