"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Play, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function BrandStory() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!containerRef.current) return;

    const img = containerRef.current.querySelector(".parallax-img");
    if (img) {
      gsap.fromTo(
        img,
        { y: "-5%" },
        {
          y: "5%",
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }
  }, []);

  return (
    <section ref={containerRef} className="relative py-28 bg-[#F9F8F6] overflow-hidden noise-overlay">
      {/* Ambient orbs */}
      <div className="orb orb-pink w-[500px] h-[500px] top-0 right-0 opacity-10" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-1/2 flex flex-col items-start order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Our Story
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-heading font-medium text-foreground leading-[1.1] mb-6">
              Creating unforgettable stays since 2021
            </h2>

            <div className="gold-line w-16 mb-6" />

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
              We started with a simple vision: to connect travelers with extraordinary spaces. Over the years, we have carefully curated a collection of premium vacation rentals that offer more than just a place to sleep—they offer an experience.
            </p>

            <motion.button
              whileHover={{ scale: 1.03, x: 4 }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-2 rounded-full px-8 py-4 border border-foreground text-foreground hover:bg-foreground hover:text-background font-medium text-base transition-all duration-500"
            >
              Find Out More
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-full lg:w-1/2 relative order-1 lg:order-2"
          >
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-black/10 group cursor-pointer">
              {/* Play button */}
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-20 h-20 rounded-full glass flex items-center justify-center animate-pulse-glow"
                >
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </motion.div>
              </div>
              <div className="parallax-img absolute inset-[-10%] w-[120%] h-[120%]">
                <Image
                  src="/images/property-2.png"
                  alt="Brand Story"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-500" />
            </div>

            {/* Floating stat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-6 -left-6 glass-card rounded-2xl px-6 py-4 animate-float-delayed"
            >
              <p className="text-3xl font-heading font-bold text-foreground">4+</p>
              <p className="text-sm text-muted-foreground">Years of Experience</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
