'use client';

import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Monitor, Coins, LayoutList, Calendar } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
      {children}
    </p>
  );
}

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ icon, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-gray-400 dark:text-gray-500">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      {/* Toggle switch */}
      <div
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
    </label>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme();
  const { showKopecks, compactTables, dateFormat, set } = useSettings();

  const THEMES = [
    { value: 'light', label: 'Світла', icon: Sun },
    { value: 'dark', label: 'Темна', icon: Moon },
    { value: 'system', label: 'Системна', icon: Monitor },
  ] as const;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 left-0 z-[70] flex w-80 flex-col bg-white shadow-2xl dark:bg-gray-900"
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5 dark:border-gray-800">
              <p className="font-semibold text-gray-900 dark:text-white">Налаштування</p>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-7">

              {/* Theme */}
              <section>
                <SectionTitle>Тема оформлення</SectionTitle>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map(({ value, label, icon: Icon }) => {
                    const active = theme === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-xs font-medium transition-all ${
                          active
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-gray-800" />

              {/* Money & numbers */}
              <section>
                <SectionTitle>Відображення</SectionTitle>
                <div className="space-y-1">
                  <ToggleRow
                    icon={<Coins className="h-4 w-4" />}
                    label="Показувати копійки"
                    description="1 500,00 грн замість 1 500 грн"
                    checked={showKopecks}
                    onChange={(v) => set('showKopecks', v)}
                  />
                  <ToggleRow
                    icon={<LayoutList className="h-4 w-4" />}
                    label="Компактні таблиці"
                    description="Менші відступи у списках"
                    checked={compactTables}
                    onChange={(v) => set('compactTables', v)}
                  />
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-gray-800" />

              {/* Date format */}
              <section>
                <SectionTitle>Формат дати</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: 'short', label: 'Короткий', example: '01.01.2024' },
                      { value: 'long', label: 'Повний', example: '1 січня 2024' },
                    ] as const
                  ).map(({ value, label, example }) => {
                    const active = dateFormat === value;
                    return (
                      <button
                        key={value}
                        onClick={() => set('dateFormat', value)}
                        className={`flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                          active
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                        }`}
                      >
                        <p className={`flex items-center gap-1.5 text-sm font-medium ${active ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          {label}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{example}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Налаштування зберігаються у браузері
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
