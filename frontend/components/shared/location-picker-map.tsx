"use client";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

export type MapPoint = {
  latitude: number;
  longitude: number;
};

type LocationPickerMapProps = {
  marker: MapPoint;
  onPick: (point: MapPoint) => void;
};

const markerIcon = L.divIcon({
  className: "location-picker-marker",
  html: '<span class="location-picker-marker-dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapClickHandler({ onPick }: { onPick: (point: MapPoint) => void }) {
  useMapEvents({
    click(event) {
      onPick({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function MapRecentering({ marker }: { marker: MapPoint }) {
  const map = useMap();

  useEffect(() => {
    map.setView([marker.latitude, marker.longitude], Math.max(map.getZoom(), 13), {
      animate: true,
    });
  }, [map, marker.latitude, marker.longitude]);

  return null;
}

export default function LocationPickerMap({ marker, onPick }: LocationPickerMapProps) {
  return (
    <MapContainer
      center={[marker.latitude, marker.longitude]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full min-h-[280px] w-full"
    >
      {/* Change this URL if you later move to a self-hosted or commercial tile provider. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapRecentering marker={marker} />
      <MapClickHandler onPick={onPick} />
      <Marker position={[marker.latitude, marker.longitude]} icon={markerIcon} />
    </MapContainer>
  );
}
