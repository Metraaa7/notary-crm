'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { clientsService } from '@/services/clients.service';
import { servicesService } from '@/services/services.service';
import { documentsService } from '@/services/documents.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { Service } from '@/types/service.types';
import type { Client } from '@/types/client.types';
import type { NotaryDocument } from '@/types/document.types';

// ── Labels ────────────────────────────────────────────────────────────────────

const SERVICE_TYPE_LABELS: Record<string, string> = {
  DEED: 'Акт',
  POWER_OF_ATTORNEY: 'Довіреність',
  WILL: 'Заповіт',
  CERTIFICATION: 'Посвідчення',
  CONTRACT: 'Договір',
  AFFIDAVIT: 'Заява',
  OTHER: 'Інше',
};

const SERVICE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Очікує',
  IN_PROGRESS: 'В процесі',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
};

const VERIFICATION_LABELS: Record<string, string> = {
  VERIFIED: 'Підтверджено',
  NOT_FOUND: 'Не знайдено',
  MISMATCH: 'Розбіжність',
  UNAVAILABLE: 'Недоступно',
  null: 'Без перевірки',
};

// ── Palettes ──────────────────────────────────────────────────────────────────

const TYPE_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1',
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

const VERIFICATION_COLORS = [
  '#10b981', '#ef4444', '#f59e0b', '#6b7280', '#94a3b8',
];

// ── Custom Tooltip ────────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload?: { currency?: string } }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg text-sm">
      {label && <p className="mb-1 font-semibold text-gray-700">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600">
          <span className="font-medium">{p.name}:</span>{' '}
          {typeof p.value === 'number' && p.name?.toLowerCase().includes('грн')
            ? `${p.value.toLocaleString('uk-UA')} грн`
            : p.value}
        </p>
      ))}
    </div>
  );
}

function RevenueTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg text-sm">
      {label && <p className="mb-1 font-semibold text-gray-700">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600">
          <span className="font-medium">{p.name}:</span>{' '}
          {(p.value / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн
        </p>
      ))}
    </div>
  );
}

// ── Accordion ─────────────────────────────────────────────────────────────────

interface AccordionItemProps {
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accent: string;
}

function AccordionItem({ title, subtitle, isOpen, onToggle, children, accent }: AccordionItemProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${accent}`} />
          <div>
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="border-t border-gray-100 px-6 py-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Data processing ───────────────────────────────────────────────────────────

function groupByMonth(items: { createdAt: string }[]) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = format(parseISO(item.createdAt), 'MMM yyyy', { locale: uk });
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .slice(-8)
    .map(([month, count]) => ({ month, count }));
}

function revenueByMonth(services: Service[]) {
  const map = new Map<string, number>();
  for (const svc of services) {
    if (svc.status !== 'COMPLETED') continue;
    const key = format(parseISO(svc.createdAt), 'MMM yyyy', { locale: uk });
    map.set(key, (map.get(key) ?? 0) + svc.feeAmount);
  }
  return Array.from(map.entries())
    .slice(-8)
    .map(([month, revenue]) => ({ month, 'Виручка (грн)': revenue }));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<NotaryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => {
    Promise.all([
      servicesService.getAll(),
      clientsService.getAll({ includeInactive: true }),
      documentsService.getAll(),
    ])
      .then(([svcs, clts, docs]) => {
        setServices(svcs);
        setClients(clts);
        setDocuments(docs);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback((idx: number) => {
    setOpenIdx((prev) => (prev === idx ? null : idx));
  }, []);

  // ── Chart data ─────────────────────────────────────────────────────────────

  // 1. Service types pie
  const serviceTypeData = (() => {
    const map = new Map<string, number>();
    for (const svc of services) {
      map.set(svc.type, (map.get(svc.type) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([type, value]) => ({
      name: SERVICE_TYPE_LABELS[type] ?? type,
      value,
    }));
  })();

  // 2. Service status bar
  const serviceStatusData = Object.keys(SERVICE_STATUS_LABELS).map((status) => ({
    name: SERVICE_STATUS_LABELS[status],
    Кількість: services.filter((s) => s.status === status).length,
    status,
  }));

  // 3. Clients over time area chart
  const clientsOverTime = groupByMonth(clients);

  // 4. Revenue by month bar chart (kopecks)
  const revenueData = revenueByMonth(services);

  // 5. Document verification pie
  const verificationData = (() => {
    const map = new Map<string, number>();
    for (const doc of documents) {
      const key = doc.verificationStatus ?? 'null';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([key, value]) => ({
      name: VERIFICATION_LABELS[key] ?? key,
      value,
    }));
  })();

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Статистика" description="Аналіз даних системи" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const CHARTS = [
    {
      title: 'Розподіл послуг за типами',
      subtitle: `Всього ${services.length} послуг`,
      accent: 'bg-blue-500',
      content: (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={serviceTypeData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={120}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {serviceTypeData.map((_, i) => (
                <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Статус послуг',
      subtitle: 'Розподіл за поточним статусом',
      accent: 'bg-amber-500',
      content: (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={serviceStatusData} barSize={48}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="Кількість" radius={[6, 6, 0, 0]}>
              {serviceStatusData.map((entry, i) => (
                <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Динаміка реєстрації клієнтів',
      subtitle: 'Нові клієнти по місяцях',
      accent: 'bg-purple-500',
      content: (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={clientsOverTime}>
            <defs>
              <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              name="Клієнти"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fill="url(#clientGrad)"
              dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Виручка по місяцях',
      subtitle: 'Сума завершених послуг у гривнях',
      accent: 'bg-emerald-500',
      content: revenueData.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Немає завершених послуг</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData} barSize={40}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `${(v / 100).toLocaleString('uk-UA')}`}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#f0fdf4' }} />
            <Bar dataKey="Виручка (грн)" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Верифікація документів',
      subtitle: `${documents.length} документів — розподіл за результатом перевірки`,
      accent: 'bg-rose-500',
      content: verificationData.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Документів ще немає</p>
      ) : (
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={verificationData}
                cx="50%"
                cy="50%"
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) =>
                  (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''
                }
                labelLine={false}
              >
                {verificationData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={VERIFICATION_COLORS[i % VERIFICATION_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* Summary table */}
          <div className="w-full shrink-0 md:w-56">
            <div className="space-y-2 rounded-xl bg-gray-50 p-4">
              {verificationData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: VERIFICATION_COLORS[i % VERIFICATION_COLORS.length] }}
                    />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Статистика"
        description="Аналітика та діаграми по даних системи"
      />

      {/* Summary cards */}
      <motion.div
        className="grid gap-4 sm:grid-cols-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {[
          { label: 'Клієнтів', value: clients.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Послуг', value: services.length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Документів', value: documents.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl ${card.bg} px-6 py-5`}>
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className={`mt-1 text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Accordion charts */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {CHARTS.map((chart, idx) => (
          <AccordionItem
            key={idx}
            title={chart.title}
            subtitle={chart.subtitle}
            accent={chart.accent}
            isOpen={openIdx === idx}
            onToggle={() => toggle(idx)}
          >
            {chart.content}
          </AccordionItem>
        ))}
      </motion.div>
    </div>
  );
}
