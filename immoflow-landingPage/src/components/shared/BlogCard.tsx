"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface BlogProps {
  id: string;
  image: string;
  tag: string;
  title: string;
  author: string;
  date: string;
}

export function BlogCard({ blog }: { blog: BlogProps }) {
  return (
    <Link href={`#blog-${blog.id}`} className="block h-full blog-card group">
      <div className="h-full overflow-hidden glass-card rounded-3xl cursor-pointer">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <div className="absolute top-4 left-4 z-10">
            <div className="glass rounded-full px-3 py-1.5">
              <span className="text-white text-xs font-mono tracking-wider uppercase">{blog.tag}</span>
            </div>
          </div>
          {/* Hover arrow */}
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
            <div className="w-10 h-10 rounded-full glass flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
          </div>
          <Image
            src={blog.image}
            alt={blog.title}
            fill
            className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4 group-hover:text-secondary transition-colors duration-300 line-clamp-2 leading-snug">
            {blog.title}
          </h3>

          <div className="flex items-center text-sm text-muted-foreground gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-secondary/20 relative overflow-hidden">
                <Image src={blog.image} alt={blog.author} fill className="object-cover" />
              </div>
              <span className="font-medium text-foreground/70">{blog.author}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="font-mono text-xs">{blog.date}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
