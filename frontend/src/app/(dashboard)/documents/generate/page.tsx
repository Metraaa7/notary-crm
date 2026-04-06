'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { clientsService } from '@/services/clients.service';
import { servicesService } from '@/services/services.service';
import { documentsService } from '@/services/documents.service';
import { extractErrorMessage } from '@/services/api';
import { generateDocumentSchema, GenerateDocumentFormValues } from '@/lib/validators';
import { formatFee } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckSquare, Square, ScrollText } from 'lucide-react';
import Link from 'next/link';
import type { Client } from '@/types/client.types';
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

export default function GenerateDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = use(searchParams);
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<GenerateDocumentFormValues, any, GenerateDocumentFormValues>({
    resolver: zodResolver(generateDocumentSchema) as any,
    defaultValues: { serviceIds: [] },
  });

  useEffect(() => {
    if (!clientId) {
      setIsFetching(false);
      return;
    }
    async function load() {
      try {
        const [clientData, servicesData] = await Promise.all([
          clientsService.getById(clientId!),
          servicesService.getAllByClient(clientId!),
        ]);
        setClient(clientData);
        // Only completed services can be included
        setServices(servicesData.filter((s) => s.status === 'COMPLETED'));
      } catch {
        toast.error('Помилка завантаження даних');
        router.push('/documents');
      } finally {
        setIsFetching(false);
      }
    }
    load();
  }, [clientId, router]);

  const toggleService = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    setSelectedIds(next);
    setValue('serviceIds', next, { shouldValidate: true });
  };

  const onSubmit = async (values: GenerateDocumentFormValues) => {
    if (!clientId) {
      toast.error('Оберіть клієнта');
      return;
    }
    setIsSubmitting(true);
    try {
      const doc = await documentsService.generate({
        clientId,
        serviceIds: values.serviceIds,
        title: values.title,
        notes: values.notes,
      });
      toast.success('Документ успішно створено');
      router.push(`/documents/${doc._id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!clientId) {
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader
          title="Генерувати документ"
          description="Спочатку оберіть клієнта"
        />
        <Card>
          <CardContent className="py-8 text-center">
            <ScrollText className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              Перейдіть до картки клієнта та натисніть «Генерувати»
            </p>
            <Link href="/clients">
              <Button variant="outline">До списку клієнтів</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Генерувати документ"
        description={
          client
            ? `Клієнт: ${client.lastName} ${client.firstName}`
            : 'Завантаження...'
        }
        action={
          clientId ? (
            <Link href={`/clients/${clientId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                До клієнта
              </Button>
            </Link>
          ) : undefined
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Document title */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Назва документа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Назва <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('title')}
                placeholder="Договір купівлі-продажу"
                className={errors.title ? 'border-red-400' : ''}
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Нотатки</Label>
              <Textarea
                {...register('notes')}
                placeholder="Додаткові нотатки до документа..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Service selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Оберіть послуги{' '}
              <span className="text-sm font-normal text-gray-400">
                (тільки завершені)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
                <p className="text-sm text-gray-400">
                  Немає завершених послуг для цього клієнта
                </p>
                <Link href={`/clients/${clientId}`}>
                  <Button variant="link" size="sm" className="mt-1">
                    Додати послугу →
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {services.map((svc) => {
                  const selected = selectedIds.includes(svc._id);
                  return (
                    <button
                      key={svc._id}
                      type="button"
                      onClick={() => toggleService(svc._id)}
                      className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                        selected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {selected ? (
                        <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      ) : (
                        <Square className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {svc.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {SERVICE_TYPE_LABELS[svc.type] ?? svc.type} ·{' '}
                          {formatFee(svc.feeAmount, svc.feeCurrency)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {errors.serviceIds && (
              <p className="mt-2 text-xs text-red-500">
                {errors.serviceIds.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Total fee */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">
              Загальна вартість ({selectedIds.length} послуг):
            </span>
            <span className="font-semibold text-gray-900">
              {formatFee(
                services
                  .filter((s) => selectedIds.includes(s._id))
                  .reduce((sum, s) => sum + s.feeAmount, 0),
              )}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href={clientId ? `/clients/${clientId}` : '/documents'}>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Скасувати
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || selectedIds.length === 0}>
            {isSubmitting && <Spinner size="sm" className="mr-2" />}
            Генерувати документ
          </Button>
        </div>
      </form>
    </div>
  );
}
