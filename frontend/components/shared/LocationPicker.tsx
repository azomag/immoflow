"use client";

import dynamic from "next/dynamic";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MapPoint } from "@/components/shared/location-picker-map";

const LocationPickerMap = dynamic(
  () => import("@/components/shared/location-picker-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-slate-50 text-sm text-[var(--muted-foreground)]">
        Loading map...
      </div>
    ),
  },
);

export type LocationValue = {
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
  country: string;
};

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    footway?: string;
    neighbourhood?: string;
    suburb?: string;
    quarter?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

type LocationPickerProps = {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
};

const DEFAULT_CENTER: MapPoint = {
  latitude: 33.5731,
  longitude: -7.5898,
};

const SEARCH_DEBOUNCE_MS = 700;
const MIN_REQUEST_INTERVAL_MS = 1100;
// Change these endpoints to your own Nominatim proxy/cache if traffic grows.
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

function extractCity(result: NominatimResult): string {
  return (
    result.address?.city ??
    result.address?.town ??
    result.address?.village ??
    result.address?.municipality ??
    result.address?.county ??
    result.address?.state ??
    ""
  );
}

function uniqueAddressParts(parts: Array<string | undefined>): string[] {
  const seen = new Set<string>();

  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      const key = part.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function limitAddress(value: string): string {
  return value.length > 110 ? `${value.slice(0, 107).trim()}...` : value;
}

function compactAddress(result: NominatimResult): string {
  const address = result.address;
  if (!address) {
    return limitAddress(result.display_name);
  }

  const street = uniqueAddressParts([address.house_number, address.road ?? address.pedestrian ?? address.footway]).join(" ");
  const area = address.neighbourhood ?? address.suburb ?? address.quarter ?? address.city_district;
  const city = extractCity(result);
  const compact = uniqueAddressParts([street, area, city, address.postcode, address.country]).join(", ");

  return limitAddress(compact || result.display_name);
}

function resultToLocation(result: NominatimResult): LocationValue {
  return {
    latitude: Number.parseFloat(result.lat),
    longitude: Number.parseFloat(result.lon),
    address: compactAddress(result),
    city: extractCity(result),
    country: result.address?.country ?? "",
  };
}

function fallbackAddress(latitude: number, longitude: number) {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [query, setQuery] = useState(value.address);
  const [debouncedQuery, setDebouncedQuery] = useState(value.address);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRequestAt = useRef(0);
  const cache = useRef(new Map<string, NominatimResult[]>());
  const reverseCache = useRef(new Map<string, LocationValue>());

  const marker = useMemo<MapPoint>(() => {
    if (value.latitude !== null && value.longitude !== null) {
      return {
        latitude: value.latitude,
        longitude: value.longitude,
      };
    }

    return DEFAULT_CENTER;
  }, [value.latitude, value.longitude]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  async function waitForNominatimSlot() {
    const elapsed = Date.now() - lastRequestAt.current;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await new Promise((resolve) => window.setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
    }
    lastRequestAt.current = Date.now();
  }

  async function fetchNominatim(url: URL) {
    await waitForNominatimSlot();
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Location service is temporarily unavailable.");
    }

    return response.json();
  }

  async function searchAddress() {
    const searchText = query.trim();
    if (searchText.length < 3) {
      setError("Enter at least 3 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cacheKey = searchText.toLowerCase();
      const cached = cache.current.get(cacheKey);
      if (cached) {
        setResults(cached);
        return;
      }

      const url = new URL(NOMINATIM_SEARCH_URL);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "5");
      url.searchParams.set("q", searchText);
      url.searchParams.set("accept-language", navigator.language || "en");

      const data = (await fetchNominatim(url)) as NominatimResult[];
      cache.current.set(cacheKey, data);
      setResults(data);
      if (data.length === 0) {
        setError("No matching location found.");
      }
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Location search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function reverseGeocode(point: MapPoint) {
    const cacheKey = `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`;
    const cached = reverseCache.current.get(cacheKey);
    if (cached) {
      onChange(cached);
      setQuery(cached.address);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // The delay above keeps requests below Nominatim's public limit.
      const url = new URL(NOMINATIM_REVERSE_URL);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("lat", String(point.latitude));
      url.searchParams.set("lon", String(point.longitude));
      url.searchParams.set("accept-language", navigator.language || "en");

      const result = (await fetchNominatim(url)) as NominatimResult;
      const nextLocation = result.display_name
        ? resultToLocation(result)
        : {
            latitude: point.latitude,
            longitude: point.longitude,
            address: fallbackAddress(point.latitude, point.longitude),
            city: "",
            country: "",
          };

      reverseCache.current.set(cacheKey, nextLocation);
      onChange(nextLocation);
      setQuery(nextLocation.address);
    } catch (reverseError) {
      const nextLocation = {
        latitude: point.latitude,
        longitude: point.longitude,
        address: fallbackAddress(point.latitude, point.longitude),
        city: "",
        country: "",
      };
      onChange(nextLocation);
      setQuery(nextLocation.address);
      setError(reverseError instanceof Error ? reverseError.message : "Reverse geocoding failed.");
    } finally {
      setLoading(false);
    }
  }

  function selectResult(result: NominatimResult) {
    const nextLocation = resultToLocation(result);
    onChange(nextLocation);
    setQuery(nextLocation.address);
    setResults([]);
    setError(null);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        void reverseGeocode({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setLocating(false);
        setError("Could not access your current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            className="h-11 rounded-xl pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void searchAddress();
              }
            }}
            placeholder="Search address or city"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl bg-white"
          disabled={loading || debouncedQuery.length < 3 || query.trim() !== debouncedQuery}
          onClick={() => void searchAddress()}
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl bg-white"
          disabled={loading || locating}
          onClick={useCurrentLocation}
        >
          <LocateFixed className="h-4 w-4" />
          {locating ? "Locating..." : "Use current"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? <div className="text-xs font-medium text-[var(--muted-foreground)]">Loading location data...</div> : null}

      {results.length > 0 ? (
        <div className="max-h-44 overflow-y-auto rounded-xl border border-[var(--border)] bg-slate-50/60">
          {results.map((result) => (
            <button
              key={result.place_id}
              type="button"
              className="flex w-full items-start gap-2 border-b border-[var(--border)] px-3 py-2 text-left text-sm last:border-b-0 hover:bg-white"
              onClick={() => selectResult(result)}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
              <span className="line-clamp-2 leading-5" title={result.display_name}>
                {compactAddress(result)}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <LocationPickerMap marker={marker} onPick={(point) => void reverseGeocode(point)} />
      </div>

      <div className="grid gap-2 text-xs text-[var(--muted-foreground)] sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <span className="font-semibold text-[var(--foreground)]">Latitude:</span>{" "}
          {value.latitude !== null ? value.latitude.toFixed(6) : "Not set"}
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <span className="font-semibold text-[var(--foreground)]">Longitude:</span>{" "}
          {value.longitude !== null ? value.longitude.toFixed(6) : "Not set"}
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <span className="font-semibold text-[var(--foreground)]">Place:</span>{" "}
          {[value.city, value.country].filter(Boolean).join(", ") || "Not set"}
        </div>
      </div>
    </div>
  );
}
