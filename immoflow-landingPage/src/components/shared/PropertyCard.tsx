"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";

export interface PropertyProps {
  id: string;
  image: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  badge?: string;
  featured?: boolean;
  featuredLabel?: string;
  priceSuffix?: string;
  statusLabel?: string;
}

export function PropertyCard({ property }: { property: PropertyProps }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full property-card"
    >
      <div className="h-full overflow-hidden glass-card rounded-3xl group cursor-pointer">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {property.badge && (
            <div className="absolute top-4 left-4 z-10">
              <div className="glass-dark rounded-full px-3 py-1.5">
                <span className="text-white text-xs font-mono tracking-wider">{property.badge}</span>
              </div>
            </div>
          )}
          {property.featured && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-secondary/90 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="text-white text-xs font-mono tracking-wider">
                  {property.featuredLabel ?? "FEATURED"}
                </span>
              </div>
            </div>
          )}
          <Image
            src={property.image}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center text-muted-foreground text-sm mb-2">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-secondary flex-shrink-0" />
                <span className="truncate">{property.location}</span>
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground truncate">
                {property.title}
              </h3>
            </div>
            <div className="flex items-center gap-1 glass-card rounded-lg px-2.5 py-1 ml-3">
              <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
              <span className="text-sm font-semibold">{property.rating}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border/30">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground">${property.price}</span>
              <span className="text-sm text-muted-foreground">
                {property.priceSuffix ?? "/ night"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium">
                {property.statusLabel ?? "Available"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
