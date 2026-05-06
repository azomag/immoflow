"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  CarFront,
  Flame,
  Layers3,
  Mail,
  MapPin,
  Ruler,
  Share2,
  ShieldCheck,
  Star,
} from "lucide-react";
import Footer from "@/components/sections/Footer";
import { PublicHeader } from "@/components/shared/PublicHeader";
import {
  fallbackPublicProperties,
  fetchPublicProperty,
  formatPropertyPrice,
  getPropertyBadge,
  getPropertyImages,
  getPropertyLocation,
  getPropertyTitle,
  type PublicProperty,
} from "@/lib/public-properties";

export default function ListingDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fallback = fallbackPublicProperties.find((entry) => String(entry.id) === id) ?? null;

    fetchPublicProperty(id, controller.signal)
      .then(setProperty)
      .catch(() => setProperty(fallback))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  const images = useMemo(() => (property ? getPropertyImages(property) : []), [property]);
  const galleryImages = images.length > 0 ? images : ["/images/property-1.png"];

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <PublicHeader />
        <div className="mx-auto max-w-7xl px-5 pt-32 lg:px-8">
          <div className="h-[520px] animate-pulse rounded-2xl bg-[#F2F0EC]" />
        </div>
      </main>
    );
  }

  if (!property) {
    return (
      <main className="min-h-screen bg-white text-foreground">
        <PublicHeader />
        <section className="mx-auto max-w-3xl px-5 pb-20 pt-32 text-center">
          <h1 className="text-4xl font-semibold">Logement introuvable</h1>
          <p className="mt-3 text-black/55">Cette annonce n&apos;est pas disponible publiquement.</p>
          <Link
            href="/listings"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux logements
          </Link>
        </section>
      </main>
    );
  }

  const amenities = [
    { label: `${property.chambres ?? "-"} chambres`, icon: BedDouble },
    { label: `${property.salles_bain ?? "-"} salles de bain`, icon: Bath },
    { label: `${property.superficie} m2`, icon: Ruler },
    { label: property.etage ? `Etage ${property.etage}` : "Etage non precise", icon: Layers3 },
    { label: property.parking ? "Parking inclus" : "Parking non indique", icon: CarFront },
    { label: property.chauffage ?? "Chauffage non precise", icon: Flame },
  ];

  return (
    <main className="min-h-screen bg-white text-foreground">
      <PublicHeader />

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-28 lg:px-8">
        <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-black/58 hover:text-black">
          <ArrowLeft className="h-4 w-4" />
          Tous les logements
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-black/58">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-black text-black" />
                4.9
              </span>
              <span className="h-1 w-1 rounded-full bg-black/30" />
              <span>{getPropertyBadge(property)}</span>
              <span className="h-1 w-1 rounded-full bg-black/30" />
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {getPropertyLocation(property)}
              </span>
            </div>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              {getPropertyTitle(property)}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigator.share?.({ title: getPropertyTitle(property), url: window.location.href })}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-black/70 transition hover:border-black/20 hover:text-black"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </button>
        </div>

        <div className="mt-8 grid h-auto gap-2 overflow-hidden rounded-2xl lg:h-[520px] lg:grid-cols-4 lg:grid-rows-2">
          <div className="relative min-h-[320px] overflow-hidden bg-[#F2F0EC] lg:col-span-2 lg:row-span-2 lg:min-h-0">
            <Image
              src={galleryImages[0]}
              alt={getPropertyTitle(property)}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          {Array.from({ length: 4 }).map((_, index) => {
            const image = galleryImages[index + 1] ?? galleryImages[0];

            return (
              <div key={`${image}-${index}`} className="relative hidden overflow-hidden bg-[#F2F0EC] lg:block">
                <Image
                  src={image}
                  alt={`${getPropertyTitle(property)} ${index + 2}`}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="space-y-10">
            <div className="flex items-start justify-between gap-5 border-b border-black/8 pb-8">
              <div>
                <h2 className="text-2xl font-semibold">
                  {property.type_logement.nom_type} a {property.commune.nom}
                </h2>
                <p className="mt-2 text-black/58">
                  Publie par {property.agent.user.name} - reference {property.agent.code_agent}
                </p>
              </div>
              <div className="rounded-full bg-[#F9F8F6] p-3">
                <ShieldCheck className="h-6 w-6 text-secondary" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {amenities.map((amenity) => {
                const Icon = amenity.icon;
                return (
                  <div key={amenity.label} className="flex items-center gap-4 rounded-2xl border border-black/8 p-5">
                    <Icon className="h-5 w-5 text-black/55" />
                    <span className="font-medium">{amenity.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-black/8 pt-8">
              <h2 className="text-2xl font-semibold">Description</h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-8 text-black/62">
                {property.description?.trim() ||
                  "Ce logement est disponible a la location. Contactez l'agent pour confirmer les conditions, organiser une visite et recevoir les documents necessaires."}
              </p>
            </div>

            <div className="border-t border-black/8 pt-8">
              <h2 className="text-2xl font-semibold">Localisation</h2>
              <div className="mt-4 rounded-2xl border border-black/8 bg-[#F9F8F6] p-6">
                <div className="flex items-center gap-3 text-black/70">
                  <MapPin className="h-5 w-5 text-secondary" />
                  {getPropertyLocation(property)}
                </div>
              </div>
            </div>
          </div>

          <aside className="sticky top-28 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold">{formatPropertyPrice(property)}</div>
                <div className="text-sm text-black/55">par mois</div>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Star className="h-4 w-4 fill-black text-black" />
                4.9
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-black/10">
              <div className="grid grid-cols-2">
                <div className="border-r border-black/10 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Disponibilite</div>
                  <div className="mt-1 text-sm font-medium">A confirmer</div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Visite</div>
                  <div className="mt-1 text-sm font-medium">Sur demande</div>
                </div>
              </div>
              <div className="border-t border-black/10 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Agent</div>
                <div className="mt-1 text-sm font-medium">{property.agent.user.name}</div>
              </div>
            </div>

            <a
              href={`mailto:${property.agent.user.email}?subject=Demande de visite - ${encodeURIComponent(getPropertyTitle(property))}`}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-black/86"
            >
              <CalendarDays className="h-4 w-4" />
              Demander une visite
            </a>

            <a
              href={`mailto:${property.agent.user.email}`}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 px-5 py-4 text-sm font-semibold text-black/72 transition hover:border-black/20 hover:text-black"
            >
              <Mail className="h-4 w-4" />
              Contacter l&apos;agent
            </a>

            <p className="mt-5 text-center text-xs leading-5 text-black/45">
              Immoflow affiche uniquement les logements publies par l&apos;agent avec le statut public.
            </p>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
