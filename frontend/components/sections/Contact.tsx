"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const icons = [Mail, Phone, MapPin];
const sectionViewport = { once: true, margin: "0px 0px 220px 0px" };
const sectionTransition = { duration: 1, ease: [0.16, 1, 0.3, 1] as const };
const cardHover = { y: -4, scale: 1.02 };
const ctaHover = { scale: 1.05, boxShadow: "0 20px 60px rgba(26, 26, 26, 0.15)" };
const ctaTap = { scale: 0.95 };

export default function Contact() {
  const { t } = useI18n();

  return (
    <section
      id="contact"
      className="section-optimized relative overflow-hidden bg-background py-28 noise-overlay"
    >
      <div className="orb orb-gold left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 opacity-8" />

      <div className="container relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={sectionViewport}
          transition={sectionTransition}
          className="flex transform-gpu flex-col items-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 glass-card">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {t.contact.badge}
            </span>
          </div>

          <h2 className="mb-6 text-4xl font-medium text-foreground md:text-5xl lg:text-[3.5rem]">
            {t.contact.title}
          </h2>

          <div className="gold-line mx-auto mb-6 w-16" />

          <p className="mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t.contact.description}
          </p>

          <div className="mb-12 grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
            {t.contact.cards.map((card, index) => {
              const Icon = icons[index];

              return (
                <motion.div
                  key={card.label}
                  whileHover={cardHover}
                  className="glass-card flex transform-gpu flex-col items-center gap-3 rounded-2xl p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                    <Icon className="h-5 w-5 text-secondary" />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    {card.label}
                  </span>
                  <span className="text-sm text-foreground/80">{card.value}</span>
                </motion.div>
              );
            })}
          </div>

          <motion.a
            whileHover={ctaHover}
            whileTap={ctaTap}
            href="mailto:contact@immoflow.app"
            className="group flex transform-gpu items-center gap-2 rounded-full bg-primary px-10 py-4 text-base font-medium text-primary-foreground transition-all duration-500"
          >
            {t.contact.cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
