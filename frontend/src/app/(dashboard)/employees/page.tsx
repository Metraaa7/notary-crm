'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { employeesService } from '@/services/employees.service';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmployeeRoleBadge } from '@/components/employees/EmployeeRoleBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserPlus, MoreHorizontal, Eye, Pencil, UserX, AlertCircle } from 'lucide-react';
import type { Employee } from '@/types/user.types';
import { Pagination } from '@/components/ui/Pagination';

const PER_PAGE = 10;

export default function EmployeesPage() {
  const { isNotary } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deactivating, setDeactivating] = useState<Employee | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await employeesService.getAll();
      setEmployees(data);
    } catch {
      toast.error('Помилка завантаження працівників');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const paginated = employees.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDeactivate = async () => {
    if (!deactivating) return;
    setIsDeactivating(true);
    try {
      await employeesService.deactivate(deactivating._id);
      toast.success('Працівника деактивовано');
      setEmployees((prev) => prev.filter((e) => e._id !== deactivating._id));
      setDeactivating(null);
    } catch {
      toast.error('Помилка деактивації працівника');
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Працівники"
        description="Управління працівниками нотаріального офісу"
        action={
          isNotary ? (
            <Link href="/employees/new">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Новий працівник
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Ім'я</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex flex-col items-center gap-3 py-12">
                    <AlertCircle className="h-10 w-10 text-gray-300" />
                    <p className="text-sm text-gray-400">Працівники відсутні</p>
                    {isNotary && (
                      <Link href="/employees/new">
                        <Button variant="outline" size="sm">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Додати першого працівника
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence initial={false}>
                {paginated.map((employee, i) => (
                  <motion.tr
                    key={employee._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <p className="font-medium text-gray-900">{employee.name}</p>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{employee.email}</TableCell>
                    <TableCell>
                      <EmployeeRoleBadge role={employee.role} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="rounded p-1.5 hover:bg-gray-100 outline-none">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/employees/${employee._id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Переглянути
                          </DropdownMenuItem>
                          {isNotary && (
                            <DropdownMenuItem
                              onClick={() => router.push(`/employees/${employee._id}/edit`)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Редагувати
                            </DropdownMenuItem>
                          )}
                          {isNotary && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeactivating(employee)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Деактивувати
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        total={employees.length}
        page={page}
        perPage={PER_PAGE}
        onChange={setPage}
      />

      <ConfirmDialog
        open={!!deactivating}
        title="Деактивувати працівника"
        description={
          deactivating
            ? `Ви впевнені, що хочете деактивувати ${deactivating.name}? Працівник не буде видалений з системи.`
            : ''
        }
        confirmLabel="Деактивувати"
        isLoading={isDeactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivating(null)}
      />
    </div>
  );
}
