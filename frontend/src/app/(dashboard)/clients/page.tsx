'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { clientsService } from '@/services/clients.service';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClientStatusBadge } from '@/components/clients/ClientStatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  AlertCircle,
} from 'lucide-react';
import type { Client } from '@/types/client.types';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/Pagination';

const PER_PAGE = 10;

export default function ClientsPage() {
  const { isNotary } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deactivating, setDeactivating] = useState<Client | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q?: string) => {
    setIsLoading(true);
    try {
      const data = await clientsService.getAll(q || undefined);
      setClients(data);
    } catch {
      toast.error('Помилка завантаження клієнтів');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(value), 400);
  };

  const paginated = clients.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDeactivate = async () => {
    if (!deactivating) return;
    setIsDeactivating(true);
    try {
      await clientsService.deactivate(deactivating._id);
      toast.success('Клієнта деактивовано');
      setClients((prev) => prev.filter((c) => c._id !== deactivating._id));
      setDeactivating(null);
    } catch {
      toast.error('Помилка деактивації клієнта');
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Клієнти"
        description="Управління клієнтами нотаріального офісу"
        action={
          <Link href="/clients/new">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Новий клієнт
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Пошук за іменем або прізвищем..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Клієнт</TableHead>
              <TableHead>Ідент. номер</TableHead>
              <TableHead className="hidden md:table-cell">Телефон</TableHead>
              <TableHead className="hidden lg:table-cell">Дата народження</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center gap-3 py-12">
                    <AlertCircle className="h-10 w-10 text-gray-300" />
                    <p className="text-sm text-gray-400">
                      {search
                        ? 'Клієнтів за вашим запитом не знайдено'
                        : 'Клієнти відсутні'}
                    </p>
                    {!search && (
                      <Link href="/clients/new">
                        <Button variant="outline" size="sm">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Додати першого клієнта
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence initial={false}>
                {paginated.map((client, i) => (
                  <motion.tr
                    key={client._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {client.lastName} {client.firstName}
                        </p>
                        <p className="text-xs text-gray-400 hidden sm:block">
                          {client.address.city}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {client.nationalId}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-600">
                      {client.phone}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                      {formatDate(client.dateOfBirth)}
                    </TableCell>
                    <TableCell>
                      <ClientStatusBadge isActive={client.isActive} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="rounded p-1.5 hover:bg-gray-100 outline-none">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/clients/${client._id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Переглянути
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/clients/${client._id}/edit`)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Редагувати
                          </DropdownMenuItem>
                          {isNotary && client.isActive && (
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeactivating(client)}
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
        total={clients.length}
        page={page}
        perPage={PER_PAGE}
        onChange={setPage}
      />

      <ConfirmDialog
        open={!!deactivating}
        title="Деактивувати клієнта"
        description={
          deactivating
            ? `Ви впевнені, що хочете деактивувати ${deactivating.lastName} ${deactivating.firstName}? Клієнт не буде видалений з системи.`
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
