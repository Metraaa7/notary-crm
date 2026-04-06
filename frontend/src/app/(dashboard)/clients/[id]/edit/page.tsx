'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { clientsService } from '@/services/clients.service';
import { extractErrorMessage } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClientForm } from '@/components/clients/ClientForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Client } from '@/types/client.types';
import type { ClientFormValues } from '@/lib/validators';

export default function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    clientsService
      .getById(id)
      .then(setClient)
      .catch(() => {
        toast.error('Клієнта не знайдено');
        router.push('/clients');
      })
      .finally(() => setIsFetching(false));
  }, [id, router]);

  const handleSubmit = async (values: ClientFormValues) => {
    setIsLoading(true);
    try {
      await clientsService.update(id, {
        firstName: values.firstName,
        lastName: values.lastName,
        dateOfBirth: values.dateOfBirth,
        address: values.address,
        phone: values.phone,
        email: values.email || undefined,
        notes: values.notes,
      });
      toast.success('Дані клієнта оновлено');
      router.push(`/clients/${id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Редагувати клієнта"
        description={`${client.lastName} ${client.firstName} · ${client.nationalId}`}
        action={
          <Link href={`/clients/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <ClientForm
            isEdit
            defaultValues={{
              firstName: client.firstName,
              lastName: client.lastName,
              nationalId: client.nationalId,
              dateOfBirth: client.dateOfBirth.split('T')[0],
              address: client.address,
              phone: client.phone,
              email: client.email ?? '',
              notes: client.notes ?? '',
            }}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onCancel={() => router.push(`/clients/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
