'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, X, ChevronRight, AlertCircle } from 'lucide-react';
import { clientsService } from '@/services/clients.service';
import { getCityCoords } from '@/lib/cityCoords';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import type { Client } from '@/types/client.types';
import type { CityGroup } from '@/components/map/ClientMap';

// Lazy-load Leaflet (no SSR)
const ClientMap = dynamic(() => import('@/components/map/ClientMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gray-100">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <MapPin className="h-10 w-10 animate-pulse" />
        <p className="text-sm">Завантаження карти…</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    clientsService.getAll({ includeInactive: true })
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  // Group clients by city, resolve coordinates
  const groups = useMemo<CityGroup[]>(() => {
    const map = new Map<string, Client[]>();
    for (const client of clients) {
      const city = client.address?.city?.trim();
      if (!city) continue;
      if (!map.has(city)) map.set(city, []);
      map.get(city)!.push(client);
    }
    const result: CityGroup[] = [];
    for (const [city, cls] of map.entries()) {
      const coords = getCityCoords(city);
      if (coords) result.push({ city, coords, clients: cls });
    }
    return result.sort((a, b) => b.clients.length - a.clients.length);
  }, [clients]);

  // Clients without a mappable city
  const unmapped = useMemo(() => {
    return clients.filter((c) => {
      const city = c.address?.city?.trim();
      return !city || !getCityCoords(city);
    });
  }, [clients]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.city.toLowerCase().includes(q));
  }, [groups, search]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.city === selectedCity) ?? null,
    [groups, selectedCity],
  );

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
        <PageHeader title="Карта клієнтів" description="Географічний розподіл клієнтів" />
        <Skeleton className="flex-1 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <PageHeader
        title="Карта клієнтів"
        description={`${clients.length} клієнтів у ${groups.length} містах`}
      />

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* ── Left panel ──────────────────────────────────────────────────── */}
        <div className="flex w-72 shrink-0 flex-col gap-3 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Пошук міста…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* City list */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
                <MapPin className="h-8 w-8" />
                <p className="text-sm">Міста не знайдено</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredGroups.map((g, i) => {
                  const isSelected = selectedCity === g.city;
                  const pct = Math.round((g.clients.length / clients.length) * 100);
                  return (
                    <li key={g.city}>
                      <button
                        onClick={() =>
                          setSelectedCity(isSelected ? null : g.city)
                        }
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? 'bg-violet-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Rank badge */}
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                          {i + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`truncate text-sm font-medium ${isSelected ? 'text-violet-700' : 'text-gray-900'}`}>
                              {g.city}
                            </span>
                            <span className={`ml-2 shrink-0 text-sm font-semibold ${isSelected ? 'text-violet-700' : 'text-gray-700'}`}>
                              {g.clients.length}
                            </span>
                          </div>
                          {/* Mini bar */}
                          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                            <div
                              className={`h-1.5 rounded-full transition-all ${isSelected ? 'bg-violet-500' : 'bg-blue-400'}`}
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            />
                          </div>
                        </div>

                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'rotate-90 text-violet-500' : 'text-gray-300'}`} />
                      </button>

                      {/* Expanded client list */}
                      <AnimatePresence initial={false}>
                        {isSelected && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-violet-50/60 px-4"
                          >
                            {g.clients.map((c) => (
                              <li key={c._id} className="border-t border-violet-100 py-2">
                                <Link
                                  href={`/clients/${c._id}`}
                                  className="flex items-center justify-between text-sm hover:text-violet-700"
                                >
                                  <span className="font-medium text-gray-800">
                                    {c.lastName} {c.firstName}
                                  </span>
                                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                                </Link>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Unmapped notice */}
          {unmapped.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {unmapped.length} клієнт{unmapped.length === 1 ? '' : 'ів'} без координат міста
            </div>
          )}
        </div>

        {/* ── Map ─────────────────────────────────────────────────────────── */}
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          <ClientMap
            groups={groups}
            selectedCity={selectedCity}
            onCitySelect={setSelectedCity}
          />

          {/* Legend overlay */}
          <div className="absolute bottom-4 right-4 z-[1000] rounded-xl border border-gray-200 bg-white/90 px-4 py-3 shadow-md backdrop-blur-sm">
            <p className="mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Клієнтів у місті
            </p>
            {[
              { label: '1', color: '#6366f1' },
              { label: '2–4', color: '#2563eb' },
              { label: '5–9', color: '#d97706' },
              { label: '10+', color: '#dc2626' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 py-0.5">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Selected city dismiss */}
          {selectedCity && (
            <button
              onClick={() => setSelectedCity(null)}
              className="absolute top-4 right-4 z-[1000] flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md backdrop-blur-sm hover:bg-gray-50"
            >
              <X className="h-3.5 w-3.5" />
              {selectedCity}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
