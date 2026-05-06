"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bath,
  BedDouble,
  Building2,
  CarFront,
  Home,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Waves,
} from "lucide-react";
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

const categories = [
  { key: "all", value: "all", icon: Search },
  { key: "apartments", value: "Appartement", icon: Building2 },
  { key: "houses", value: "Maison", icon: Home },
  { key: "parking", value: "parking", icon: CarFront },
  { key: "premium", value: "premium", icon: Waves },
] as const;

export default function Properties() {
  const { t } = useI18n();
  const filters = t.listings.filters;
  const [properties, setProperties] = useState<PublicProperty[]>(fallbackPublicProperties);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
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

  const filteredProperties = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const selectedBedrooms = bedrooms === "all" ? null : Number.parseInt(bedrooms, 10);
    const selectedMaxPrice = maxPrice ? Number.parseFloat(maxPrice) : null;

    return properties.filter((property) => {
      const typeName = property.type_logement.nom_type.toLowerCase();
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
      const matchesCategory =
        category === "all" ||
        typeName.includes(category.toLowerCase()) ||
        (category === "parking" && property.parking) ||
        (category === "premium" && getPropertyPriceValue(property) >= 10000);
      const matchesBedrooms = selectedBedrooms ? (property.chambres ?? 0) >= selectedBedrooms : true;
      const matchesPrice = selectedMaxPrice ? getPropertyPriceValue(property) <= selectedMaxPrice : true;

      return matchesSearch && matchesCategory && matchesBedrooms && matchesPrice;
    });
  }, [bedrooms, category, maxPrice, properties, search]);

  return (
    <section id="listings" className="bg-white pb-16 pt-16 md:pt-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-5xl pt-5">
          <div className="rounded-[28px] border border-black/10 bg-white p-2 shadow-[0_10px_35px_rgba(0,0,0,0.10)] md:rounded-full">
            <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_150px_150px_auto]">
              <label className="flex min-h-14 items-center gap-3 rounded-2xl px-4 py-2 transition hover:bg-[#F7F7F7] md:rounded-full md:px-5 md:py-0">
                <Search className="h-5 w-5 text-black/45" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-black">{filters.destination}</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={filters.destinationPlaceholder}
                    className="mt-0.5 w-full bg-transparent text-sm text-black/62 outline-none placeholder:text-black/36"
                  />
                </span>
              </label>

              <select
                value={bedrooms}
                onChange={(event) => setBedrooms(event.target.value)}
                className="h-14 min-w-0 rounded-2xl border-0 bg-white px-4 text-sm font-medium outline-none transition hover:bg-[#F7F7F7] md:rounded-full md:px-5"
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
                className="h-14 min-w-0 rounded-2xl bg-white px-4 text-sm font-medium outline-none transition placeholder:text-black/45 hover:bg-[#F7F7F7] md:rounded-full md:px-5"
              />

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setBedrooms("all");
                  setMaxPrice("");
                }}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-sm font-semibold text-white transition hover:bg-black/85 md:rounded-full"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {filters.reset}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-7 flex gap-8 overflow-x-auto border-b border-black/10 pb-4">
          {categories.map((entry) => {
            const Icon = entry.icon;
            const isActive = category === entry.value;

            return (
              <button
                key={entry.value}
                type="button"
                onClick={() => setCategory(entry.value)}
                className={`flex shrink-0 flex-col items-center gap-2 border-b-2 px-1 pb-3 text-xs font-semibold transition ${
                  isActive
                    ? "border-black text-black"
                    : "border-transparent text-black/55 hover:border-black/30 hover:text-black"
                }`}
              >
                <Icon className="h-5 w-5" />
                {filters.categories[entry.key]}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {filters.availableTitle}
            </h1>
            <p className="mt-1 text-sm text-black/55">
              {filteredProperties.length}{" "}
              {filteredProperties.length > 1 ? filters.listingPlural : filters.listingSingular}{" "}
              {filters.publishedByAgents}
            </p>
          </div>
          <Link
            href="/listings"
            className="hidden rounded-full border border-black/12 px-5 py-3 text-sm font-semibold transition hover:border-black hover:bg-black hover:text-white sm:inline-flex"
          >
            {filters.viewAll}
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="aspect-[1.05] animate-pulse rounded-xl bg-[#F2F0EC]" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-[#F2F0EC]" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-[#F2F0EC]" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && filteredProperties.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-black/10 bg-[#F7F7F7] p-10 text-center">
            <h2 className="text-2xl font-semibold">{filters.noResultsTitle}</h2>
            <p className="mt-2 text-black/55">{filters.noResultsDescription}</p>
          </div>
        ) : null}

        {!loading && filteredProperties.length > 0 ? (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProperties.map((property, index) => {
              const image = getPropertyImages(property)[0];

              return (
                <Link key={property.id} href={`/listings/${property.id}`} className="group block">
                  <div className="relative aspect-[1.05] overflow-hidden rounded-xl bg-[#F2F0EC]">
                    <Image
                      src={image}
                      alt={getPropertyTitle(property)}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow-sm">
                      {getPropertyBadge(property)}
                    </div>
                    <div
                      className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-black shadow-sm transition hover:bg-white"
                      aria-label={filters.saveListing}
                    >
                      <Star className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[15px] font-semibold">{getPropertyTitle(property)}</h2>
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

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-black/58">
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

                  <div className="mt-2">
                    <span className="font-semibold">{formatPropertyPrice(property)}</span>
                    <span className="text-black/55"> {filters.perMonth}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
