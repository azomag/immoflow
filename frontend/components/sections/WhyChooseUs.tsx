"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Users, FileText, BarChart3 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const icons = [Users, FileText, BarChart3];
const headerViewport = { once: true, margin: "0px 0px 180px 0px" };
const dashboardViewport = { once: true, margin: "0px 0px 160px 0px" };
const cardViewport = { once: true, margin: "0px 0px 120px 0px" };
const headerTransition = { duration: 0.8 };
const dashboardTransition = { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const };
const cardHover = { y: -8, scale: 1.02 };

export default function WhyChooseUs() {
  const { t } = useI18n();

  return (
    <section
      id="workflows"
      className="section-optimized relative overflow-hidden bg-background py-28 md:py-36 noise-overlay"
    >
      <div className="orb orb-blue top-0 left-0 h-[500px] w-[500px] opacity-10" />
      <div className="orb orb-gold bottom-0 right-0 h-[400px] w-[400px] opacity-10" />

      <div className="container relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={headerViewport}
          transition={headerTransition}
          className="mx-auto mb-16 max-w-3xl transform-gpu text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 glass-card">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {t.workflows.badge}
            </span>
          </div>
          <h2 className="mb-6 text-4xl font-medium leading-tight text-foreground md:text-5xl lg:text-[3.5rem]">
            {t.workflows.title}
          </h2>
          <div className="gold-line mx-auto mb-6 w-16" />
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t.workflows.description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 44, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={dashboardViewport}
          transition={dashboardTransition}
          className="relative mx-auto mb-16 max-w-6xl transform-gpu md:mb-20"
        >
          <div className="absolute -inset-x-8 bottom-0 top-20 rounded-[2rem] bg-gradient-to-r from-transparent via-primary/10 to-transparent blur-3xl" />
          <div className="relative rounded-[2rem] border border-primary/10 bg-white/70 p-2 shadow-[0_34px_90px_rgba(127,85,57,0.16)] backdrop-blur-xl md:p-3">
            <div className="overflow-hidden rounded-[1.55rem] border border-white/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <div className="flex h-10 items-center gap-2 border-b border-primary/10 bg-gradient-to-r from-[#fffaf6] via-white to-[#fbf7f2] px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#c96f52]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#d8b18d]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#9c6644]" />
                <div className="ml-3 h-4 flex-1 rounded-full bg-primary/5" />
              </div>
              <div className="relative aspect-[1913/960] bg-[#fbfaf9]">
                <Image
                  src="/background/dashboard-immoflow.png"
                  alt="Apercu du tableau de bord ImmoFlow"
                  fill
                  priority
                  className="object-cover object-top"
                  sizes="(min-width: 1280px) 1152px, (min-width: 768px) 90vw, 100vw"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {t.workflows.items.map((item, index) => {
            const Icon = icons[index];

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={cardViewport}
                transition={{ duration: 0.8, delay: index * 0.12 }}
                whileHover={cardHover}
                className="glass-card transform-gpu rounded-3xl p-8 lg:p-10"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-secondary/10 bg-gradient-to-br from-secondary/20 to-secondary/5 text-secondary">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-4 text-xl font-heading font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
