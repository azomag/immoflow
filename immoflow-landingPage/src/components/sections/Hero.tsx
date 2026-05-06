"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Building2, LayoutDashboard } from "lucide-react";
import { getSignupUrl } from "@/lib/app-routes";
import { useI18n } from "@/lib/i18n";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const foregroundRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const metricStripRef = useRef<HTMLDivElement>(null);
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
          dashboardRef.current,
          { autoAlpha: 0, y: 72, rotateX: 8, scale: 0.94 },
          { autoAlpha: 1, y: 0, rotateX: 0, scale: 1, duration: 1.2 },
          "-=0.58"
        )
        .fromTo(
          metricStripRef.current?.children ?? [],
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08 },
          "-=0.62"
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
            .to(dashboardRef.current, { y: "-20vh", scale: 1.05, ease: "none" }, 0)
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
      className="relative min-h-[900px] w-full overflow-hidden bg-[#07131c] md:h-screen md:min-h-[780px]"
    >
      <div
        ref={skyRef}
        aria-hidden="true"
        className="absolute inset-x-0 -top-[12%] z-0 h-[118%] bg-[linear-gradient(180deg,#2e84c8_0%,#81bee4_36%,#dceff9_68%,#ffffff_100%)]"
      />

      <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(7,19,28,0.76)_0%,rgba(7,19,28,0.38)_42%,rgba(255,255,255,0.2)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 z-[30] h-[26vh] bg-gradient-to-b from-transparent via-white/82 to-white" />

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
        className="relative z-30 container mx-auto flex min-h-[560px] flex-col items-center justify-start px-6 pb-10 pt-28 text-center text-white sm:pt-32 md:h-[58vh] md:min-h-[430px] md:justify-center md:pt-24"
      >
        <div ref={badgeRef} className="opacity-0">
          <div className="glass-dark mb-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 md:mb-8">
            <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-white/80">
              {t.hero.badge}
            </span>
          </div>
        </div>

        {/* FIX: Text is now split by React natively! */}
        <h1
          ref={headingRef}
          className="mb-6 max-w-5xl text-[2.7rem] font-medium leading-[1.04] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl xl:text-[6.1rem]"
        >
          {headingText.split(" ").map((word, index) => (
            <span key={index} className="inline-block mr-[0.3em] overflow-hidden align-bottom">
              <span className="inline-block hero-word">{word}</span>
            </span>
          ))}
        </h1>

        <p
          ref={subtextRef}
          className="mb-8 max-w-2xl text-base leading-relaxed text-white/78 opacity-0 md:text-lg"
        >
          {t.hero.description}
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/listings"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-primary shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:bg-white/92"
          >
            <Building2 className="h-4 w-4" />
            {t.hero.primaryCta}
          </Link>
          <Link
            href={getSignupUrl()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/18 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/16"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t.nav.signup}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div
        ref={dashboardRef}
        className="absolute bottom-[8.5rem] left-1/2 z-[28] w-[94vw] max-w-6xl -translate-x-1/2 opacity-0 [perspective:1600px] sm:bottom-[7.5rem] md:bottom-[-5vh]"
      >
        <div className="relative rounded-[28px] border border-white/24 bg-white/12 p-1.5 shadow-[0_34px_100px_rgba(7,19,28,0.38)] backdrop-blur-md md:p-2">
          <div className="pointer-events-none absolute -inset-px rounded-[28px] bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.08)_38%,rgba(200,169,110,0.34))]" />
          <div className="relative overflow-hidden rounded-[22px] border border-white/30 bg-white">
            <div className="absolute inset-x-0 top-0 z-10 h-8 border-b border-black/6 bg-white/78 backdrop-blur-sm">
              <div className="flex h-full items-center gap-1.5 px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b5f]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbf4d]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#45c763]" />
              </div>
            </div>
            <div className="relative aspect-[1913/960]">
              <Image
                src="/background/dashboard-immoflow.png"
                alt="Immoflow dashboard preview"
                fill
                priority
                className="object-cover object-left-top pt-8"
                sizes="(min-width: 1280px) 1152px, 94vw"
              />
            </div>
          </div>
        </div>

        <div
          ref={metricStripRef}
          className="pointer-events-none absolute -top-5 right-4 hidden items-center gap-3 lg:flex"
        >
          <div className="rounded-full border border-white/18 bg-[#07131c]/72 px-4 py-2 text-xs font-medium text-white shadow-xl shadow-black/20 backdrop-blur-md">
            10.000 MAD tracked
          </div>
          <div className="rounded-full border border-white/18 bg-white/88 px-4 py-2 text-xs font-semibold text-primary shadow-xl shadow-black/10 backdrop-blur-md">
            4 active contracts
          </div>
        </div>
      </div>

      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-8 left-1/2 z-40 -translate-x-1/2 opacity-0"
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
