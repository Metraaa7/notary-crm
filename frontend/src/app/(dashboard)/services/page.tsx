'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { servicesService } from '@/services/services.service';
import { extractErrorMessage } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ServiceStatusBadge } from '@/components/services/ServiceStatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

const PER_PAGE = 6;
import type { Service, ServiceStatus, PopulatedClient } from '@/types/service.types';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  DEED: 'Нотаріальний акт',
  POWER_OF_ATTORNEY: 'Довіреність',
  WILL: 'Заповіт',
  CERTIFICATION: 'Посвідчення',
  CONTRACT: 'Договір',
  AFFIDAVIT: 'Заява',
  OTHER: 'Інше',
};

const STATUS_FILTERS: { label: string; value: ServiceStatus | 'ALL' }[] = [
  { label: 'Всі', value: 'ALL' },
  { label: 'Очікують', value: 'PENDING' },
  { label: 'В процесі', value: 'IN_PROGRESS' },
  { label: 'Завершені', value: 'COMPLETED' },
  { label: 'Скасовані', value: 'CANCELLED' },
];

function clientName(client: Service['client']): string {
  if (typeof client === 'object' && client !== null) {
    return `${(client as PopulatedClient).lastName} ${(client as PopulatedClient).firstName}`;
  }
  return '—';
}

function clientId(client: Service['client']): string {
  if (typeof client === 'object' && client !== null) return (client as PopulatedClient)._id;
  return client as string;
}

export default function ServicesPage() {
  const { isNotary } = useAuth();
  const { formatMoney, formatDate } = useSettings();
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<Service | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Service | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const all = await servicesService.getAll();
        setServices(all);
      } catch {
        toast.error('Помилка завантаження послуг');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered =
    statusFilter === 'ALL'
      ? services
      : services.filter((s) => s.status === statusFilter);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setIsActing(true);
    try {
      const updated = await servicesService.confirm(confirmTarget._id, {});
      setServices((prev) =>
        prev.map((s) => s._id === confirmTarget._id ? { ...s, ...updated, client: s.client } : s),
      );
      toast.success('Послугу підтверджено');
      setConfirmTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsActing(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsActing(true);
    try {
      const updated = await servicesService.cancel(cancelTarget._id);
      setServices((prev) =>
        prev.map((s) => s._id === cancelTarget._id ? { ...s, ...updated, client: s.client } : s),
      );
      toast.success('Послугу скасовано');
      setCancelTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsActing(false);
    }
  };

  const pendingCount = services.filter(
    (s) => s.status === 'PENDING' || s.status === 'IN_PROGRESS',
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Послуги"
        description={
          pendingCount > 0
            ? `${pendingCount} послуг очікують на підтвердження`
            : 'Всі нотаріальні послуги системи'
        }
      />

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ label, value }) => {
          const count =
            value === 'ALL'
              ? services.length
              : services.filter((s) => s.status === value).length;
          return (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); setPage(1); }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    statusFilter === value
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <AlertCircle className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">
            {statusFilter === 'ALL'
              ? 'Послуги відсутні'
              : 'Послуг з цим статусом не знайдено'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {paginated.map((svc, i) => {
              const isExpanded = expandedClients[svc._id];
              return (
                <motion.div
                  key={svc._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      {/* Main row */}
                      <div className="flex items-center gap-4 px-5 py-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                          <FileText className="h-4 w-4 text-gray-500" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {svc.description}
                            </p>
                            <ServiceStatusBadge status={svc.status} />
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                            <Link
                              href={`/clients/${clientId(svc.client)}`}
                              className="hover:text-blue-500 transition-colors"
                            >
                              {clientName(svc.client)}
                            </Link>
                            <span>·</span>
                            <span>{SERVICE_TYPE_LABELS[svc.type] ?? svc.type}</span>
                            <span>·</span>
                            <span>{formatMoney(svc.feeAmount, svc.feeCurrency)}</span>
                            <span>·</span>
                            <span>{formatDate(svc.createdAt)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/services/${svc._id}`)}
                            className="h-8 px-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {isNotary && svc.status !== 'COMPLETED' && svc.status !== 'CANCELLED' && (
                            <button
                              onClick={() =>
                                setExpandedClients((prev) => ({
                                  ...prev,
                                  [svc._id]: !prev[svc._id],
                                }))
                              }
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded notary actions */}
                      <AnimatePresence>
                        {isExpanded && isNotary && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-gray-100 bg-gray-50"
                          >
                            <div className="flex items-center gap-3 px-5 py-3">
                              {(svc.status === 'PENDING' || svc.status === 'IN_PROGRESS') && (
                                <Button
                                  size="sm"
                                  onClick={() => setConfirmTarget(svc)}
                                >
                                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                  Підтвердити
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setCancelTarget(svc)}
                              >
                                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                Скасувати
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Pagination
        total={filtered.length}
        page={page}
        perPage={PER_PAGE}
        onChange={setPage}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Підтвердити послугу"
        description={
          confirmTarget
            ? `Підтвердити послугу «${confirmTarget.description}» для клієнта ${clientName(confirmTarget.client)}?`
            : ''
        }
        confirmLabel="Підтвердити"
        variant="default"
        isLoading={isActing}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        title="Скасувати послугу"
        description={
          cancelTarget
            ? `Скасувати послугу «${cancelTarget.description}»? Цю дію неможливо скасувати.`
            : ''
        }
        confirmLabel="Скасувати послугу"
        isLoading={isActing}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
