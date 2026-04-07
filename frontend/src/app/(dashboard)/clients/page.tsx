'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { clientsService } from '@/services/clients.service';
import { servicesService } from '@/services/services.service';
import { documentsService } from '@/services/documents.service';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClientStatusBadge } from '@/components/clients/ClientStatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Hash,
  MapPin,
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  AlertCircle,
  FileText,
  ScrollText,
  X,
} from 'lucide-react';
import type { Client } from '@/types/client.types';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/Pagination';

const PER_PAGE = 10;

interface Filters {
  search: string;
  nationalId: string;
  city: string;
}

const EMPTY_FILTERS: Filters = { search: '', nationalId: '', city: '' };

export default function ClientsPage() {
  const { isNotary } = useAuth();
  const { formatDate } = useSettings();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [deactivating, setDeactivating] = useState<Client | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (f: Filters) => {
    setIsLoading(true);
    try {
      const [clientsData, allServices, allDocuments] = await Promise.all([
        clientsService.getAll({
          search: f.search || undefined,
          nationalId: f.nationalId || undefined,
          city: f.city || undefined,
        }),
        servicesService.getAll(),
        documentsService.getAll(),
      ]);

      setClients(clientsData);

      const svcMap: Record<string, number> = {};
      for (const svc of allServices) {
        const cid = typeof svc.client === 'object' ? svc.client._id : svc.client;
        svcMap[cid] = (svcMap[cid] ?? 0) + 1;
      }
      setServiceCounts(svcMap);

      const docMap: Record<string, number> = {};
      for (const doc of allDocuments) {
        const cid = typeof doc.client === 'object' ? doc.client._id : doc.client;
        docMap[cid] = (docMap[cid] ?? 0) + 1;
      }
      setDocumentCounts(docMap);
    } catch {
      toast.error('Помилка завантаження клієнтів');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(EMPTY_FILTERS);
  }, [load]);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    const next = { ...filters, [field]: value };
    setFilters(next);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(next), 400);
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    load(EMPTY_FILTERS);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Name search */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Ім'я або прізвище..."
            className="pl-9"
          />
        </div>

        {/* National ID / INN */}
        <div className="relative w-52">
          <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={filters.nationalId}
            onChange={(e) => handleFilterChange('nationalId', e.target.value)}
            placeholder="РНОКПП (ІПН)..."
            className="pl-9 font-mono"
          />
        </div>

        {/* City */}
        <div className="relative w-44">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            placeholder="Місто..."
            className="pl-9"
          />
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-gray-500">
            <X className="h-3.5 w-3.5" />
            Скинути
          </Button>
        )}

        {/* Results count */}
        {!isLoading && (
          <span className="ml-auto text-sm text-gray-400 self-center">
            {clients.length.toLocaleString('uk-UA')} клієнт{
              clients.length % 10 === 1 && clients.length % 100 !== 11 ? '' :
              [2,3,4].includes(clients.length % 10) && ![12,13,14].includes(clients.length % 100) ? 'и' : 'ів'
            }
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Клієнт</TableHead>
              <TableHead>РНОКПП</TableHead>
              <TableHead className="hidden md:table-cell">Телефон</TableHead>
              <TableHead className="hidden lg:table-cell">Дата народження</TableHead>
              <TableHead className="hidden sm:table-cell text-center">Послуги</TableHead>
              <TableHead className="hidden sm:table-cell text-center">Договори</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center gap-3 py-12">
                    <AlertCircle className="h-10 w-10 text-gray-300" />
                    <p className="text-sm text-gray-400">
                      {hasActiveFilters
                        ? 'Клієнтів за вашим запитом не знайдено'
                        : 'Клієнти відсутні'}
                    </p>
                    {hasActiveFilters ? (
                      <Button variant="outline" size="sm" onClick={handleReset}>
                        <X className="mr-2 h-3.5 w-3.5" />
                        Скинути фільтри
                      </Button>
                    ) : (
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
                    <TableCell className="hidden sm:table-cell text-center">
                      <Link href={`/clients/${client._id}#services`}>
                        <Badge
                          variant={serviceCounts[client._id] ? 'default' : 'secondary'}
                          className="gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <FileText className="h-3 w-3" />
                          {serviceCounts[client._id] ?? 0}
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <Link href={`/clients/${client._id}#documents`}>
                        <Badge
                          variant={documentCounts[client._id] ? 'default' : 'secondary'}
                          className="gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <ScrollText className="h-3 w-3" />
                          {documentCounts[client._id] ?? 0}
                        </Badge>
                      </Link>
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
