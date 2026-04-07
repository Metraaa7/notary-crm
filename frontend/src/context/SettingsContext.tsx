'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DateFormat = 'short' | 'long';

interface Settings {
  showKopecks: boolean;
  compactTables: boolean;
  dateFormat: DateFormat;
}

interface SettingsCtx extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  formatMoney: (amountKopecks: number, currency?: string) => string;
  formatDate: (iso: string) => string;
  formatDateTime: (iso: string) => string;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULTS: Settings = {
  showKopecks: true,
  compactTables: false,
  dateFormat: 'short',
};

const STORAGE_KEY = 'notary_settings';

// ── Context ───────────────────────────────────────────────────────────────────

const SettingsContext = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const formatMoney = useCallback(
    (amountKopecks: number, currency = 'UAH') => {
      const hrn = amountKopecks / 100;
      const suffix = currency === 'UAH' ? ' грн' : ` ${currency}`;
      return hrn.toLocaleString('uk-UA', {
        minimumFractionDigits: settings.showKopecks ? 2 : 0,
        maximumFractionDigits: settings.showKopecks ? 2 : 0,
      }) + suffix;
    },
    [settings.showKopecks],
  );

  const formatDate = useCallback(
    (iso: string) => {
      if (!iso) return '—';
      const d = parseISO(iso);
      return settings.dateFormat === 'short'
        ? format(d, 'dd.MM.yyyy')
        : format(d, 'd MMMM yyyy', { locale: uk });
    },
    [settings.dateFormat],
  );

  const formatDateTime = useCallback(
    (iso: string) => {
      if (!iso) return '—';
      const d = parseISO(iso);
      return settings.dateFormat === 'short'
        ? format(d, 'dd.MM.yyyy, HH:mm')
        : format(d, 'd MMMM yyyy, HH:mm', { locale: uk });
    },
    [settings.dateFormat],
  );

  return (
    <SettingsContext.Provider value={{ ...settings, set, formatMoney, formatDate, formatDateTime }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
