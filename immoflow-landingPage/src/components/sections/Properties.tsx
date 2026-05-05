"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { PropertyCard } from "@/components/shared/PropertyCard";
import { useI18n } from "@/lib/i18n";

export default function Properties() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!sectionRef.current || !gridRef.current) return;

    const cards = gridRef.current.querySelectorAll(".property-card");

    gsap.fromTo(
      cards,
      { y: 80, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.9,
        stagger: 0.14,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  return (
    <section
      id="listings"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#F9F8F6] py-28 noise-overlay"
    >
      <div className="orb orb-gold left-1/2 -top-[100px] h-[500px] w-[500px] opacity-10" />

      <div className="container relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 glass-card">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {t.listings.badge}
              </span>
            </div>
            <h2 className="text-4xl font-medium leading-tight text-foreground md:text-5xl lg:text-[3.5rem]">
              {t.listings.title}
            </h2>
          </div>

          <motion.a
            whileHover={{ scale: 1.03, x: 4 }}
            whileTap={{ scale: 0.97 }}
            href="#contact"
            className="group inline-flex items-center gap-2 rounded-full border border-foreground px-6 py-3 text-sm font-medium text-foreground transition-all duration-500 hover:bg-foreground hover:text-background"
          >
            {t.listings.cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.a>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {t.listings.items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}
