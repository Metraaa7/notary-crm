'use client';

import { use, useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Banknote,
  FileText,
  Tag,
} from 'lucide-react';
import type { Service } from '@/types/service.types';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  DEED: 'Нотаріальний акт',
  POWER_OF_ATTORNEY: 'Довіреність',
  WILL: 'Заповіт',
  CERTIFICATION: 'Посвідчення',
  CONTRACT: 'Договір',
  AFFIDAVIT: 'Заява',
  OTHER: 'Інше',
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isNotary } = useAuth();
  const { formatMoney, formatDateTime } = useSettings();
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    servicesService
      .getById(id)
      .then(setService)
      .catch(() => {
        toast.error('Послугу не знайдено');
        router.back();
      })
      .finally(() => setIsLoading(false));
  }, [id, router]);

  const handleConfirm = async () => {
    setIsActing(true);
    try {
      const updated = await servicesService.confirm(id, {
        notes: confirmNotes || undefined,
      });
      setService(updated);
      toast.success('Послугу підтверджено');
      setShowConfirm(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsActing(false);
    }
  };

  const handleCancel = async () => {
    setIsActing(true);
    try {
      const updated = await servicesService.cancel(id);
      setService(updated);
      toast.success('Послугу скасовано');
      setShowCancel(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (!service) return null;

  const clientId =
    typeof service.client === 'string' ? service.client : (service.client as { _id: string })._id;

  const canConfirm =
    isNotary &&
    (service.status === 'PENDING' || service.status === 'IN_PROGRESS');
  const canCancel =
    isNotary &&
    service.status !== 'COMPLETED' &&
    service.status !== 'CANCELLED';

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Деталі послуги"
        description={SERVICE_TYPE_LABELS[service.type] ?? service.type}
        action={
          <Link href={`/clients/${clientId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              До клієнта
            </Button>
          </Link>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Інформація про послугу</CardTitle>
            <ServiceStatusBadge status={service.status} />
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={Tag}
              label="Тип послуги"
              value={SERVICE_TYPE_LABELS[service.type] ?? service.type}
            />
            <InfoRow
              icon={FileText}
              label="Опис"
              value={service.description}
            />
            <InfoRow
              icon={Banknote}
              label="Вартість"
              value={formatMoney(service.feeAmount, service.feeCurrency)}
            />

            <Separator />

            <InfoRow
              icon={User}
              label="Створено"
              value={service.createdBy?.name}
            />
            <InfoRow
              icon={Calendar}
              label="Дата створення"
              value={formatDateTime(service.createdAt)}
            />

            {service.confirmedBy && (
              <>
                <Separator />
                <InfoRow
                  icon={CheckCircle}
                  label="Підтверджено"
                  value={service.confirmedBy.name}
                />
                <InfoRow
                  icon={Calendar}
                  label="Дата підтвердження"
                  value={
                    service.confirmedAt
                      ? formatDateTime(service.confirmedAt)
                      : null
                  }
                />
              </>
            )}

            {service.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-gray-400 mb-1">Нотатки</p>
                  <p className="text-sm text-gray-700">{service.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* NOTARY action buttons */}
      <AnimatePresence>
        {(canConfirm || canCancel) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3"
          >
            {canConfirm && (
              <Button onClick={() => setShowConfirm(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Підтвердити послугу
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowCancel(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Скасувати
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm dialog — with notes input */}
      <ConfirmDialog
        open={showConfirm}
        title="Підтвердити послугу"
        description="Підтвердити виконання цієї нотаріальної послуги? Після підтвердження її можна буде включити до документа."
        confirmLabel="Підтвердити"
        variant="default"
        isLoading={isActing}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      >
        <div className="mt-3 space-y-1.5">
          <Label className="text-sm">Нотатка нотаріуса (необов'язково)</Label>
          <Textarea
            value={confirmNotes}
            onChange={(e) => setConfirmNotes(e.target.value)}
            placeholder="Додайте нотатку до підтвердження..."
            rows={2}
          />
        </div>
      </ConfirmDialog>

      {/* Cancel dialog */}
      <ConfirmDialog
        open={showCancel}
        title="Скасувати послугу"
        description="Ви впевнені, що хочете скасувати цю послугу? Цю дію неможливо скасувати."
        confirmLabel="Скасувати послугу"
        isLoading={isActing}
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
      />
    </div>
  );
}
