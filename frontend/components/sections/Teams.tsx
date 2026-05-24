"use client";

import { Mail, ArrowUpRight, Sparkles } from "lucide-react";
import Image from "next/image";

// --- Drop-in replacements for the removed Lucide brand icons ---
const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/>
    <path d="M9 18c-4.5 1.5-5-2.5-7-3"/>
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5 2.8 12.8 3 11c-1.5 1-2.9 2-4.5 1.7 1.2-4.5 4.8-6.6 9-7-1.8-1.5-2.4-3.9-1.5-6.1 4.5 2.4 8.6 6 13 6 1.5-1.5 4-1.5 5 0z"/>
  </svg>
);
// ---------------------------------------------------------------

// Split the roles into 'department' and 'specialty' for the dual-pill design
const team = [
  {
    id: 1,
    name: "Mohamed Azoumag",
    department: "Genie Informatique",
    specialty: "Full Stack Developer",
    image: "/teams/mohamed.png",
    socials: {
      twitter: "#",
      linkedin: "#",
      github: "#",
    },
  },
  {
    id: 2,
    name: "Hajar Kandri",
    department: "Genie Informatique",
    specialty: "Administratrice Réseau",
    image: "/teams/hajar.png",
    socials: {
      twitter: "#",
      linkedin: "#",
      mail: "mailto:#",
    },
  },
  {
    id: 3,
    name: "Hind Khodari",
    department: "Genie Informatique",
    specialty: "Cybersecurity Specialist",
    image: "/teams/hind.png",
    socials: {
      linkedin: "#",
      github: "#",
    },
  },
];

export default function TeamSection() {
  return (
    <section className="relative w-full bg-[#FAFAFA] py-24 md:py-32 overflow-hidden selection:bg-black selection:text-white">
      {/* Abstract Background Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-200/60 via-transparent to-transparent opacity-60 blur-3xl pointer-events-none" />

      {/* Expanded Container Width to handle the larger cards */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-12 lg:px-16">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-20 md:mb-28 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="mb-6 flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 backdrop-blur-md px-5 py-2 shadow-sm">
            <Sparkles className="h-4 w-4 text-black" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-neutral-800">
              The Visionaries
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 mb-6 drop-shadow-sm leading-[1.1] max-w-3xl">
            Meet the minds behind the architecture.
          </h2>
          <p className="text-lg text-neutral-500 font-medium max-w-2xl leading-relaxed">
            A collective of designers, engineers, and strategists dedicated to elevating your digital and physical workspaces.
          </p>
        </div>

        {/* Huge Cinematic Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {team.map((member, index) => (
            <div
              key={member.id}
              className="group relative h-[550px] lg:h-[680px] w-full rounded-[2.5rem] overflow-hidden bg-neutral-900 shadow-2xl transition-all duration-700 hover:-translate-y-3 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] cursor-pointer animate-in fade-in slide-in-from-bottom-12 fill-mode-both"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Full-Bleed Background Image */}
              <Image 
                src={member.image} 
                alt={member.name} 
                fill 
                className="object-cover object-top transition-all duration-1000 ease-out group-hover:scale-110 grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0" 
              />
              
              {/* Multi-layered Cinematic Overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-700" />

              {/* Top-Right Floating Social Links */}
              <div className="absolute top-6 right-6 flex flex-col gap-3 z-30">
                {member.socials.twitter && (
                  <SocialButton icon={Twitter} href={member.socials.twitter} delay="delay-[0ms]" />
                )}
                {member.socials.linkedin && (
                  <SocialButton icon={Linkedin} href={member.socials.linkedin} delay="delay-[75ms]" />
                )}
                {member.socials.github && (
                  <SocialButton icon={Github} href={member.socials.github} delay="delay-[150ms]" />
                )}
                {member.socials.mail && (
                  <SocialButton icon={Mail} href={member.socials.mail} delay="delay-[225ms]" />
                )}
              </div>

              {/* Bottom Pinned Content Area */}
              <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 z-20 flex flex-col justify-end transform transition-transform duration-700 ease-out group-hover:-translate-y-4">
                
                {/* Floating Glass Badges - Slide in on hover */}
                <div className="flex flex-wrap gap-2 mb-5 opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 delay-100">
                  <span className="px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
                    {member.department}
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full bg-white text-[11px] font-bold uppercase tracking-wider text-black shadow-lg">
                    {member.specialty}
                  </span>
                </div>

                <div className="flex items-end justify-between w-full">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
                      {member.name}
                    </h3>
                  </div>

                  {/* Circular Arrow Button - Fades in on hover */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 translate-x-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 hover:bg-white hover:text-black">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>

                {/* Animated Expanding Divider Line */}
                <div className="w-12 h-1 bg-white/30 rounded-full mt-6 transition-all duration-700 ease-in-out group-hover:w-full group-hover:bg-white" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Highly stylized social button specifically for dark overlays
function SocialButton({ icon: Icon, href, delay }: { icon: React.ElementType; href: string; delay: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-black/20 backdrop-blur-xl border border-white/20 text-white shadow-2xl opacity-0 translate-x-8 group-hover:opacity-100 group-hover:translate-x-0 hover:bg-white hover:text-black hover:scale-110 transition-all duration-500 ease-out ${delay}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </a>
  );
}