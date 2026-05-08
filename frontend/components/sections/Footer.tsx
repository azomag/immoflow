"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative overflow-hidden bg-[#0D0D0D] pb-8 pt-24 text-white">
      <div className="absolute top-0 left-1/2 h-[1px] w-[800px] -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
      <div className="absolute top-0 left-1/2 h-[100px] w-[400px] -translate-x-1/2 rounded-full bg-secondary/5 blur-[80px]" />

      <div className="container relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col lg:col-span-2">
            <Link href="/" className="mb-6 inline-flex items-center">
              <Image
                src="assets/profile/immoflow-logo-light.png"
                alt="Immoflow"
                width={80}
                height={80}
                className="h-18 w-18 object-contain"
              />
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-white/50">{t.footer.tagline}</p>
          </div>

          {t.footer.columns.map((column) => (
            <div key={column.title} className="flex flex-col">
              <h4 className="mb-6 font-mono text-sm uppercase tracking-widest text-white/40">
                {column.title}
              </h4>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link}>
                    <span className="group flex items-center text-sm text-white/60 transition-colors duration-300 hover:text-white">
                      <ArrowRight className="mr-2 h-3 w-3 -translate-x-2 opacity-0 text-secondary transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mb-8 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/30 md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Immoflow. {t.footer.rights}
          </p>
          <div className="flex gap-6">
            {t.footer.legal.map((item) => (
              <span key={item} className="transition-colors hover:text-white/60">
                {item}
              </span>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
