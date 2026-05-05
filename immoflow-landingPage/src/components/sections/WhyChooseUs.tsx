"use client";

import { motion } from "framer-motion";
import { Users, FileText, BarChart3 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const icons = [Users, FileText, BarChart3];

export default function WhyChooseUs() {
  const { t } = useI18n();

  return (
    <section
      id="management"
      className="relative overflow-hidden bg-background py-28 md:py-36 noise-overlay"
    >
      <div className="orb orb-blue top-0 left-0 h-[500px] w-[500px] opacity-10" />
      <div className="orb orb-gold bottom-0 right-0 h-[400px] w-[400px] opacity-10" />

      <div className="container relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-16 max-w-3xl text-center"
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

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {t.workflows.items.map((item, index) => {
            const Icon = icons[index];

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: index * 0.12 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card rounded-3xl p-8 lg:p-10"
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
