"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote: "Absolutely loved our stay! The place was perfect, even better than expected. Great location, and the host was fantastic. Highly recommend!",
    name: "Emily Johnson",
    role: "Solo Traveler",
    avatar: "/images/property-1.png",
  },
  {
    id: 2,
    quote: "An unforgettable experience. The property was pristine, and the views were breathtaking. We'll definitely be booking with Immoflow again.",
    name: "Michael Chen",
    role: "Family Vacation",
    avatar: "/images/property-2.png",
  },
  {
    id: 3,
    quote: "The attention to detail in this home was incredible. Everything we needed was provided, making our weekend getaway truly relaxing.",
    name: "Sarah Miller",
    role: "Couples Retreat",
    avatar: "/images/property-3.png",
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
  };

  return (
    <section className="relative py-28 bg-background overflow-hidden noise-overlay">
      {/* Ambient orbs */}
      <div className="orb orb-gold w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-8" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Quote Side */}
          <div className="w-full lg:w-1/2 flex flex-col">
            {/* Gold quote icon */}
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-8">
              <Quote className="w-6 h-6 text-secondary fill-secondary" />
            </div>

            <div className="min-h-[280px] md:min-h-[240px] relative">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <p className="text-2xl md:text-3xl lg:text-4xl font-heading font-medium italic text-foreground leading-[1.4] mb-10">
                    &quot;{testimonials[currentIndex].quote}&quot;
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden relative border-2 border-secondary/30">
                      <Image
                        src={testimonials[currentIndex].avatar}
                        alt={testimonials[currentIndex].name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-lg text-foreground">
                        {testimonials[currentIndex].name}
                      </h4>
                      <p className="text-muted-foreground text-sm font-mono">
                        {testimonials[currentIndex].role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 mt-12">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevTestimonial}
                className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:bg-foreground hover:text-background transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextTestimonial}
                className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:bg-foreground hover:text-background transition-colors duration-300"
              >
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              {/* Dots */}
              <div className="flex gap-2 ml-4">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDirection(idx > currentIndex ? 1 : -1);
                      setCurrentIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === currentIndex
                        ? "w-8 bg-secondary"
                        : "w-1.5 bg-border hover:bg-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Images Side */}
          <div className="w-full lg:w-1/2 relative h-[450px] md:h-[500px] hidden md:block">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="absolute top-0 right-0 w-[75%] h-[65%] rounded-3xl overflow-hidden shadow-xl z-10"
            >
              <Image
                src="/images/property-2.png"
                alt="Property"
                fill
                className="object-cover"
              />
              {/* Glass overlay tag */}
              <div className="absolute bottom-4 left-4 glass-dark rounded-full px-4 py-2">
                <span className="text-white text-xs font-mono">Verified Stay</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="absolute bottom-0 left-0 w-[65%] h-[55%] rounded-3xl overflow-hidden shadow-xl z-20 border-4 border-background"
            >
              <Image
                src="/images/property-3.png"
                alt="Property Interior"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
