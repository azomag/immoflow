"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Building2, MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import Footer from "@/components/sections/Footer";
import { PublicHeader } from "@/components/shared/PublicHeader";
import {
  fallbackPublicProperties,
  fetchPublicProperties,
  formatPropertyPrice,
  getPropertyBadge,
  getPropertyImages,
  getPropertyLocation,
  getPropertyPriceValue,
  getPropertyTitle,
  type PublicProperty,
} from "@/lib/public-properties";
import { useI18n } from "@/lib/i18n";

export default function ListingsPage() {
  const { t } = useI18n();
  const filters = t.listings.filters;
  const [properties, setProperties] = useState<PublicProperty[]>(fallbackPublicProperties);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetchPublicProperties(controller.signal)
      .then((loadedProperties) => {
        setProperties(loadedProperties.length > 0 ? loadedProperties : fallbackPublicProperties);
      })
      .catch(() => setProperties(fallbackPublicProperties))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const propertyTypes = useMemo(() => {
    return Array.from(new Set(properties.map((property) => property.type_logement.nom_type))).sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const selectedBedrooms = bedrooms === "all" ? null : Number.parseInt(bedrooms, 10);
    const selectedMaxPrice = maxPrice ? Number.parseFloat(maxPrice) : null;

    return properties.filter((property) => {
      const matchesSearch = normalizedSearch
        ? [
            getPropertyTitle(property),
            getPropertyLocation(property),
            property.type_logement.nom_type,
            property.description ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        : true;
      const matchesType = type === "all" || property.type_logement.nom_type === type;
      const matchesBedrooms = selectedBedrooms ? (property.chambres ?? 0) >= selectedBedrooms : true;
      const matchesPrice = selectedMaxPrice ? getPropertyPriceValue(property) <= selectedMaxPrice : true;

      return matchesSearch && matchesType && matchesBedrooms && matchesPrice;
    });
  }, [bedrooms, maxPrice, properties, search, type]);

  return (
    <main className="min-h-screen bg-white text-foreground">
      <PublicHeader />

      <section className="mx-auto max-w-7xl px-5 pb-10 pt-28 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F9F8F6] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
              <Building2 className="h-4 w-4 text-secondary" />
              {t.listings.badge}
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              {t.listings.title}
            </h1>
          </div>

          <div className="rounded-2xl border border-black/8 bg-[#F9F8F6] p-5">
            <div className="text-sm font-semibold text-black/70">
              {filteredProperties.length}{" "}
              {filteredProperties.length > 1 ? filters.listingPlural : filters.listingSingular}
            </div>
            <p className="mt-2 text-sm leading-6 text-black/55">
              {filters.publishedByAgents}
            </p>
          </div>
        </div>

        <div className="sticky top-20 z-30 mt-8 rounded-2xl border border-black/10 bg-white/92 p-3 shadow-sm backdrop-blur-xl">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_150px_170px_auto]">
            <label className="flex h-12 items-center gap-3 rounded-xl border border-black/8 bg-white px-4">
              <Search className="h-4 w-4 text-black/40" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={filters.destinationPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/35"
              />
            </label>

            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-12 rounded-xl border border-black/8 bg-white px-4 text-sm outline-none"
            >
              <option value="all">{filters.categories.all}</option>
              {propertyTypes.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>

            <select
              value={bedrooms}
              onChange={(event) => setBedrooms(event.target.value)}
              className="h-12 rounded-xl border border-black/8 bg-white px-4 text-sm outline-none"
            >
              <option value="all">{filters.bedrooms}</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>

            <input
              type="number"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder={filters.maxBudget}
              className="h-12 rounded-xl border border-black/8 bg-white px-4 text-sm outline-none"
            />

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setType("all");
                setBedrooms("all");
                setMaxPrice("");
              }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-black/86"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {filters.reset}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[390px] animate-pulse rounded-2xl bg-[#F2F0EC]" />
            ))}
          </div>
        ) : null}

        {!loading && filteredProperties.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-black/8 bg-[#F9F8F6] p-10 text-center">
            <h2 className="text-2xl font-semibold">{filters.noResultsTitle}</h2>
            <p className="mt-2 text-black/55">{filters.noResultsDescription}</p>
          </div>
        ) : null}

        {!loading && filteredProperties.length > 0 ? (
          <div className="mt-10 grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {filteredProperties.map((property, index) => {
              const image = getPropertyImages(property)[0];

              return (
                <Link key={property.id} href={`/listings/${property.id}`} className="group block">
                  <div className="relative aspect-[1.12] overflow-hidden rounded-2xl bg-[#F2F0EC]">
                    <Image
                      src={image}
                      alt={getPropertyTitle(property)}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                    <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold shadow-sm">
                      {getPropertyBadge(property)}
                    </div>
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">{getPropertyTitle(property)}</h2>
                      <div className="mt-1 flex items-center gap-1 text-sm text-black/55">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{getPropertyLocation(property)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-black text-black" />
                      {(4.82 + (index % 3) * 0.03).toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-black/58">
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="h-4 w-4" />
                      {property.chambres ?? "-"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {property.salles_bain ?? "-"}
                    </span>
                    <span>{property.superficie} m2</span>
                  </div>

                  <div className="mt-3">
                    <span className="font-semibold">{formatPropertyPrice(property)}</span>
                    <span className="text-black/55"> {filters.perMonth}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      <Footer />
    </main>
  );
}
