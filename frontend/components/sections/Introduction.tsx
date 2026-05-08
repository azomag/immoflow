"use client";

import { motion } from "framer-motion";
import { UserRound, Building2, ShieldCheck, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const icons = [UserRound, Building2, ShieldCheck];
const cardViewport = { once: true, margin: "-80px" };
const cardTransition = { duration: 0.7 };
const ctaHover = { scale: 1.03, x: 4 };
const ctaTap = { scale: 0.97 };

export default function Introduction() {
  const { t } = useI18n();

  return (
    <section
      id="overview"
      className="section-optimized relative overflow-hidden bg-background py-28 md:py-36 noise-overlay"
    >
      <div className="orb orb-gold top-0 right-0 h-[600px] w-[600px] opacity-15" />
      <div className="orb orb-pink bottom-0 left-0 h-[400px] w-[400px] opacity-10" />

      <div className="container relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 glass-card">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {t.overview.badge}
              </span>
            </div>

            <h2 className="mb-6 text-4xl font-medium leading-[1.08] text-foreground md:text-5xl lg:text-[3.5rem]">
              {t.overview.title}
            </h2>

            <div className="gold-line mb-6 w-16" />

            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t.overview.description}
            </p>
          </div>

          <motion.a
            whileHover={ctaHover}
            whileTap={ctaTap}
            href="#workflows"
            className="group inline-flex transform-gpu items-center gap-3 rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground transition-all duration-300 hover:shadow-xl hover:shadow-primary/15"
          >
            {t.overview.cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.a>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {t.overview.cards.map((card, index) => {
            const Icon = icons[index];

            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={cardViewport}
                transition={{ ...cardTransition, delay: index * 0.12 }}
                className="glass-card transform-gpu rounded-3xl p-8 lg:p-9"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/12 text-secondary">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-secondary">
                  {card.metric}
                </p>
                <h3 className="mb-4 text-2xl font-heading font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
