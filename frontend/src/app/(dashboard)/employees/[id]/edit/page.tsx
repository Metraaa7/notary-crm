'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { employeesService } from '@/services/employees.service';
import { extractErrorMessage } from '@/services/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Employee } from '@/types/user.types';
import type { UpdateEmployeeFormValues } from '@/lib/validators';

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    employeesService
      .getById(id)
      .then(setEmployee)
      .catch(() => {
        toast.error('Працівника не знайдено');
        router.push('/employees');
      })
      .finally(() => setIsFetching(false));
  }, [id, router]);

  const handleSubmit = async (values: UpdateEmployeeFormValues) => {
    setIsLoading(true);
    try {
      await employeesService.update(id, values);
      toast.success('Дані працівника оновлено');
      router.push(`/employees/${id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-6 max-w-xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Редагувати працівника"
        description={employee.name}
        action={
          <Link href={`/employees/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <EmployeeForm
            isEdit
            defaultValues={{
              name: employee.name,
              email: employee.email,
              role: employee.role,
            }}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onCancel={() => router.push(`/employees/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
