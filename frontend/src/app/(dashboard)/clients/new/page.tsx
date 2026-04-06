'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { clientsService } from '@/services/clients.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClientForm } from '@/components/clients/ClientForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import type { ClientFormValues } from '@/lib/validators';
import Link from 'next/link';

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: ClientFormValues) => {
    setIsLoading(true);
    try {
      const client = await clientsService.create({
        ...values,
        email: values.email || undefined,
      });
      toast.success('Клієнта успішно створено');
      router.push(`/clients/${client._id}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Помилка створення клієнта';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Новий клієнт"
        description="Заповніть дані для реєстрації нового клієнта"
        action={
          <Link href="/clients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              До списку
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <ClientForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onCancel={() => router.push('/clients')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
