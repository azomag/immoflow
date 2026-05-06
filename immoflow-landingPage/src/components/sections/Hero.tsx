"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const foregroundRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  const shouldReduceMotion = useReducedMotion();
  const { t } = useI18n();

  // Safely fallback to an empty string to prevent SSR crashes if translation is delayed
  const headingText = t.hero.title || "";

  useEffect(() => {
    if (!headingRef.current || !containerRef.current) return;

    // We no longer manually mutate innerHTML here! React handles it in the JSX below.
    const words = headingRef.current.querySelectorAll(".hero-word");

    const ctx = gsap.context(() => {
      // Entrance Animation
      const entranceTl = gsap.timeline({ defaults: { ease: "power4.out" } });

      entranceTl
        .fromTo(
          badgeRef.current,
          { autoAlpha: 0, y: 20, scale: 0.9 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 1, delay: 0.45 }
        )
        .fromTo(
          words,
          { y: "110%", rotateX: -10 },
          { y: "0%", rotateX: 0, duration: 1.2, stagger: 0.06 },
          "-=0.6"
        )
        .fromTo(
          subtextRef.current,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 1 },
          "-=0.7"
        )
        .fromTo(
          scrollIndicatorRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1.2 },
          "-=0.4"
        );

      // Parallax Scroll Animation (Desktop only)
      if (!shouldReduceMotion) {
        const mm = gsap.matchMedia();

        mm.add("(min-width: 768px)", () => {
          const scrollTl = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "+=155%",
              pin: true,
              scrub: 1,
            },
          });

          scrollTl
            .to(skyRef.current, { y: "10%", ease: "none" }, 0)
            .to(contentWrapperRef.current, { y: "-12vh", opacity: 0, ease: "power1.inOut" }, 0)
            .fromTo(
              foregroundRef.current,
              { y: "58vh", scale: 1.03 },
              { y: "-42vh", scale: 1.14, ease: "none" },
              0
            );

          return () => {};
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [shouldReduceMotion, headingText]); // Added headingText to dependency array

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative h-screen w-full overflow-hidden bg-white"
    >
      <div
        ref={skyRef}
        aria-hidden="true"
        className="absolute inset-x-0 -top-[12%] z-0 h-[118%] bg-[linear-gradient(180deg,#5fa7e9_0%,#9fd1f4_36%,#dceff9_66%,#ffffff_100%)]"
      />

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/36 via-black/18 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-[30] h-[34vh] bg-gradient-to-b from-transparent via-white/88 to-white" />

      <div
        ref={foregroundRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 z-[5] h-[60%] w-full will-change-transform md:inset-0 md:-top-[15%] md:z-20 md:h-[130%] md:translate-y-[58vh] md:scale-[1.03]"
      >
        <Image
          src="/background/hero-imag.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      <div
        ref={contentWrapperRef}
        className="relative z-10 container mx-auto flex h-full flex-col items-center justify-start px-6 pb-24 pt-28 text-center text-white sm:pb-16 md:justify-center"
      >
        <div ref={badgeRef} className="opacity-0">
          <div className="glass-dark mb-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5">
            <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-white/80">
              {t.hero.badge}
            </span>
          </div>
        </div>

        {/* FIX: Text is now split by React natively! */}
        <h1
          ref={headingRef}
          className="mb-8 max-w-5xl text-[2.8rem] font-medium leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl xl:text-[6.3rem]"
        >
          {headingText.split(" ").map((word, index) => (
            <span key={index} className="inline-block mr-[0.3em] overflow-hidden align-bottom">
              <span className="inline-block hero-word">{word}</span>
            </span>
          ))}
        </h1>

        <p
          ref={subtextRef}
          className="opacity-0 mb-12 max-w-2xl text-base leading-relaxed text-white/78 md:text-lg"
        >
          {t.hero.description}
        </p>
      </div>

      <div
        ref={scrollIndicatorRef}
        className="opacity-0 absolute bottom-8 left-1/2 z-40 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-primary/45">
            {t.hero.scroll}
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-primary/30 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}