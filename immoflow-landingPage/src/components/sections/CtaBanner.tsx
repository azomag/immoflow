"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function CtaBanner() {
  const { t } = useI18n();

  return (
    <section
      id="plans"
      className="relative overflow-hidden bg-[#F9F8F6] py-28 md:py-36 noise-overlay"
    >
      <div className="orb orb-blue top-0 right-0 h-[520px] w-[520px] opacity-10" />

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
              {t.plans.badge}
            </span>
          </div>
          <h2 className="mb-6 text-4xl font-medium leading-tight text-foreground md:text-5xl lg:text-[3.5rem]">
            {t.plans.title}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t.plans.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {t.plans.cards.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: index * 0.12 }}
              className={`rounded-3xl p-8 lg:p-10 ${
                plan.featured
                  ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/10"
                  : "glass-card"
              }`}
            >
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`mb-3 font-mono text-xs uppercase tracking-[0.24em] ${
                      plan.featured ? "text-primary-foreground/70" : "text-secondary"
                    }`}
                  >
                    {plan.name}
                  </p>
                  <h3 className="text-4xl font-heading font-semibold">{plan.price}</h3>
                </div>
                {plan.featured && (
                  <span className="rounded-full bg-white/12 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-white">
                    Popular
                  </span>
                )}
              </div>

              <p
                className={`mb-8 text-sm leading-relaxed ${
                  plan.featured ? "text-primary-foreground/78" : "text-muted-foreground"
                }`}
              >
                {plan.audience}
              </p>

              <div className="mb-10 space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                        plan.featured ? "bg-white/12" : "bg-secondary/12"
                      }`}
                    >
                      <Check
                        className={`h-3.5 w-3.5 ${
                          plan.featured ? "text-white" : "text-secondary"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm leading-relaxed ${
                        plan.featured ? "text-primary-foreground/88" : "text-foreground/80"
                      }`}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <motion.a
                whileHover={{ scale: 1.03, x: 4 }}
                whileTap={{ scale: 0.97 }}
                href="#contact"
                className={`group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 ${
                  plan.featured
                    ? "bg-white text-primary"
                    : "border border-foreground text-foreground hover:bg-foreground hover:text-background"
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </motion.a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
