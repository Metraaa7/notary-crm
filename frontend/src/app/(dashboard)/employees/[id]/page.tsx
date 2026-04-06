'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { employeesService } from '@/services/employees.service';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmployeeRoleBadge } from '@/components/employees/EmployeeRoleBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Pencil, UserX, Mail, ShieldCheck } from 'lucide-react';
import type { Employee } from '@/types/user.types';

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}

const ROLE_LABELS = { NOTARY: 'Нотаріус', ASSISTANT: 'Асистент' } as const;

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isNotary } = useAuth();
  const router = useRouter();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    employeesService
      .getById(id)
      .then(setEmployee)
      .catch(() => {
        toast.error('Працівника не знайдено');
        router.push('/employees');
      })
      .finally(() => setIsLoading(false));
  }, [id, router]);

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await employeesService.deactivate(id);
      toast.success('Працівника деактивовано');
      router.push('/employees');
    } catch {
      toast.error('Помилка деактивації');
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title={employee.name}
        description={ROLE_LABELS[employee.role]}
        action={
          <div className="flex items-center gap-2">
            <Link href="/employees">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Button>
            </Link>
            {isNotary && (
              <Link href={`/employees/${id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Редагувати
                </Button>
              </Link>
            )}
            {isNotary && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeactivate(true)}
              >
                <UserX className="mr-2 h-4 w-4" />
                Деактивувати
              </Button>
            )}
          </div>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Дані працівника</CardTitle>
              <EmployeeRoleBadge role={employee.role} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Mail} label="Email" value={employee.email} />
            <Separator />
            <InfoRow
              icon={ShieldCheck}
              label="Роль"
              value={ROLE_LABELS[employee.role]}
            />
          </CardContent>
        </Card>
      </motion.div>

      <ConfirmDialog
        open={showDeactivate}
        title="Деактивувати працівника"
        description={`Ви впевнені, що хочете деактивувати ${employee.name}? Працівник не буде видалений з системи.`}
        confirmLabel="Деактивувати"
        isLoading={isDeactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivate(false)}
      />
    </div>
  );
}
