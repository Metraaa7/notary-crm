'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { employeesService } from '@/services/employees.service';
import { extractErrorMessage } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { CreateEmployeeFormValues } from '@/lib/validators';

export default function NewEmployeePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: CreateEmployeeFormValues) => {
    setIsLoading(true);
    try {
      const employee = await employeesService.create(values);
      toast.success('Працівника успішно створено');
      router.push(`/employees/${employee._id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Новий працівник"
        description="Заповніть дані для реєстрації нового працівника"
        action={
          <Link href="/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              До списку
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <EmployeeForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onCancel={() => router.push('/employees')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
