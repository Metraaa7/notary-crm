'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { servicesService } from '@/services/services.service';
import { clientsService } from '@/services/clients.service';
import { extractErrorMessage } from '@/services/api';
import { serviceSchema, ServiceFormValues } from '@/lib/validators';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import type { Client } from '@/types/client.types';
import type { ServiceType } from '@/types/service.types';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  DEED: 'Нотаріальний акт',
  POWER_OF_ATTORNEY: 'Довіреність',
  WILL: 'Заповіт',
  CERTIFICATION: 'Посвідчення',
  CONTRACT: 'Договір',
  AFFIDAVIT: 'Заява',
  OTHER: 'Інше',
};

export default function NewServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Track selected type label separately — Base UI SelectValue shows value not children
  const [selectedTypeKey, setSelectedTypeKey] = useState<string>('');
  const [typeOpen, setTypeOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ServiceFormValues, any, ServiceFormValues>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: { feeCurrency: 'UAH' },
  });

  useEffect(() => {
    clientsService.getById(clientId).then(setClient).catch(() => {
      toast.error('Клієнта не знайдено');
      router.push('/clients');
    });
  }, [clientId, router]);

  const handleSelectType = (key: string) => {
    setSelectedTypeKey(key);
    setValue('type', key as ServiceType, { shouldValidate: true });
    setTypeOpen(false);
  };

  const onSubmit = async (values: ServiceFormValues) => {
    setIsLoading(true);
    try {
      // feeAmount entered as UAH — convert to копійки (×100) for storage
      await servicesService.create(clientId, {
        clientId,
        type: values.type,
        description: values.description,
        feeAmount: Math.round(values.feeAmount * 100),
        feeCurrency: values.feeCurrency ?? 'UAH',
        notes: values.notes,
        scheduledAt: values.scheduledAt || undefined,
      });
      toast.success('Послугу успішно створено');
      router.push(`/clients/${clientId}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Нова послуга"
        description={client ? `Клієнт: ${client.lastName} ${client.firstName}` : ''}
        action={
          <Link href={`/clients/${clientId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              До клієнта
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Service type — custom dropdown to avoid Base UI SelectValue bug */}
            <div className="space-y-1.5">
              <Label>
                Тип послуги <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTypeOpen((o) => !o)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    errors.type ? 'border-red-400' : 'border-input'
                  } ${!selectedTypeKey ? 'text-muted-foreground' : 'text-gray-900'}`}
                >
                  <span>
                    {selectedTypeKey
                      ? SERVICE_TYPE_LABELS[selectedTypeKey]
                      : 'Оберіть тип послуги'}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${typeOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {typeOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                    {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectType(key)}
                        className={`flex w-full items-center px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedTypeKey === key
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.type && (
                <p className="text-xs text-red-500">
                  {errors.type.message ?? "Тип послуги обов'язковий"}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>
                Опис <span className="text-red-500">*</span>
              </Label>
              <Textarea
                {...register('description')}
                placeholder="Опишіть нотаріальну послугу..."
                rows={3}
                className={errors.description ? 'border-red-400' : ''}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Fee */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Вартість (грн) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="500.00"
                  {...register('feeAmount', { valueAsNumber: true })}
                  className={errors.feeAmount ? 'border-red-400' : ''}
                />
                {errors.feeAmount && (
                  <p className="text-xs text-red-500">{errors.feeAmount.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Валюта</Label>
                <Input {...register('feeCurrency')} defaultValue="UAH" />
              </div>
            </div>

            {/* Scheduled date */}
            <div className="space-y-1.5">
              <Label>Дата і час зустрічі</Label>
              <Input
                type="datetime-local"
                {...register('scheduledAt')}
              />
              <p className="text-xs text-gray-400">
                Необов&apos;язково — відображається в календарі
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Нотатки</Label>
              <Textarea
                {...register('notes')}
                placeholder="Додаткові нотатки..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/clients/${clientId}`)}
                disabled={isLoading}
              >
                Скасувати
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner size="sm" className="mr-2" />}
                Створити послугу
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
