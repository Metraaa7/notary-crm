'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Client } from '@/types/client.types';
import { getCityCoords } from '@/lib/cityCoords';

// ── Color scale by count ───────────────────────────────────────────────────────
function markerColor(count: number): string {
  if (count >= 10) return '#dc2626'; // red-600
  if (count >= 5)  return '#ea580c'; // orange-600
  if (count >= 3)  return '#d97706'; // amber-600
  if (count >= 2)  return '#2563eb'; // blue-600
  return '#6366f1'; // indigo-500
}

function markerRadius(count: number): number {
  return Math.max(5, Math.min(14, 5 + Math.sqrt(count) * 2.5));
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface CityGroup {
  city: string;
  coords: [number, number];
  clients: Client[];
}

interface ClientMapProps {
  groups: CityGroup[];
  onCitySelect: (city: string | null) => void;
  selectedCity: string | null;
}

export default function ClientMap({ groups, onCitySelect, selectedCity }: ClientMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [49.0, 32.0],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Re-render markers when groups change
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    layer.clearLayers();

    for (const group of groups) {
      const isSelected = selectedCity === group.city;
      const color = isSelected ? '#7c3aed' : markerColor(group.clients.length);
      const radius = markerRadius(group.clients.length) * (isSelected ? 1.4 : 1);

      const circle = L.circleMarker(group.coords, {
        radius,
        fillColor: color,
        color: 'rgba(255,255,255,0.7)',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.65,
      });

      const clientList = group.clients
        .slice(0, 6)
        .map((c) => `<li class="lm-client">${c.lastName} ${c.firstName}</li>`)
        .join('');
      const more = group.clients.length > 6
        ? `<li class="lm-more">…ще ${group.clients.length - 6}</li>`
        : '';

      circle.bindPopup(`
        <div class="lm-popup">
          <div class="lm-city">${group.city}</div>
          <div class="lm-count">${group.clients.length} клієнт${
            group.clients.length === 1 ? '' :
            group.clients.length < 5 ? 'и' : 'ів'
          }</div>
          <ul class="lm-list">${clientList}${more}</ul>
        </div>
      `, { minWidth: 180 });

      circle.on('click', () => onCitySelect(group.city));
      layer.addLayer(circle);
    }
  }, [groups, selectedCity, onCitySelect]);

  // Pan to selected city
  useEffect(() => {
    if (!mapRef.current || !selectedCity) return;
    const group = groups.find((g) => g.city === selectedCity);
    if (group) {
      mapRef.current.flyTo(group.coords, 9, { duration: 0.8 });
    }
  }, [selectedCity, groups]);

  return (
    <>
      <style>{`
        .lm-popup { font-family: inherit; line-height: 1.4; }
        .lm-city { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
        .lm-count { font-size: 12px; color: #64748b; margin-bottom: 6px; }
        .lm-list { margin: 0; padding: 0; list-style: none; }
        .lm-client { font-size: 13px; color: #334155; padding: 1px 0; }
        .lm-more { font-size: 12px; color: #94a3b8; padding: 1px 0; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 8px 24px rgba(0,0,0,.12) !important; }
        .leaflet-popup-tip { display: none; }
      `}</style>
      <div ref={containerRef} className="h-full w-full rounded-2xl" />
    </>
  );
}

export type { CityGroup };
