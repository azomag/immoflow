"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { BlogCard } from "@/components/shared/BlogCard";
import { motion } from "framer-motion";

const blogPosts = [
  {
    id: "1",
    image: "/images/property-3.png",
    tag: "Travel Guide",
    title: "10 Hidden Gems to Visit This Summer Before They Become Popular",
    author: "Alice Wonderland",
    date: "Oct 12, 2024",
  },
  {
    id: "2",
    image: "/images/property-2.png",
    tag: "Tips & Tricks",
    title: "How to Pack Light for a Two-Week Vacation in Europe",
    author: "John Doe",
    date: "Sep 28, 2024",
  },
  {
    id: "3",
    image: "/images/property-1.png",
    tag: "Destinations",
    title: "The Ultimate Guide to Exploring the Amalfi Coast Like a Local",
    author: "Sarah Smith",
    date: "Sep 15, 2024",
  },
];

export default function Blog() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!sectionRef.current || !gridRef.current) return;

    const cards = gridRef.current.querySelectorAll(".blog-card");

    gsap.fromTo(
      cards,
      { y: 60, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.9,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      }
    );
  }, []);

  return (
    <section ref={sectionRef} className="relative py-28 bg-[#F9F8F6] overflow-hidden noise-overlay">
      {/* Ambient orbs */}
      <div className="orb orb-blue w-[500px] h-[500px] top-0 right-0 opacity-10" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Our Articles
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-heading font-medium text-foreground leading-tight">
              Together, let&apos;s make your travels awesome
            </h2>
          </div>
          <motion.div whileHover={{ x: 4 }}>
            <Link
              href="#blog"
              className="group flex items-center gap-2 text-foreground font-medium transition-colors hover:text-secondary"
            >
              View All
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} blog={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
