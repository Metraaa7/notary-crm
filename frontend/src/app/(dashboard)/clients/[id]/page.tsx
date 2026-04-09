'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Pencil, UserX, Plus, ArrowLeft,
  Phone, Mail, MapPin, CreditCard, Calendar,
  FileText, ScrollText, CheckCircle, Clock, XCircle,
} from 'lucide-react';
import { AuditLog } from '@/components/AuditLog';
import type { Client } from '@/types/client.types';
import type { Service } from '@/types/service.types';
import type { NotaryDocument } from '@/types/document.types';

const SERVICE_STATUS_CONFIG = {
  PENDING:     { label: 'Очікує',    color: 'bg-amber-100 text-amber-700',  icon: Clock },
  IN_PROGRESS: { label: 'В процесі', color: 'bg-blue-100 text-blue-700',    icon: Clock },
  COMPLETED:   { label: 'Завершено', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  CANCELLED:   { label: 'Скасовано', color: 'bg-gray-100 text-gray-500',    icon: XCircle },
} as const;

const DOC_STATUS_CONFIG = {
  DRAFT: { label: 'Чернетка', color: 'bg-amber-100 text-amber-700' },
  FINAL: { label: 'Завершено', color: 'bg-emerald-100 text-emerald-700' },
} as const;

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

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isNotary } = useAuth();
  const { formatMoney, formatDate, formatDateTime } = useSettings();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [documents, setDocuments] = useState<NotaryDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [clientData, servicesData, documentsData] = await Promise.all([
          clientsService.getById(id),
          servicesService.getAllByClient(id),
          documentsService.getAllByClient(id),
        ]);
        setClient(clientData);
        setServices(servicesData);
        setDocuments(documentsData);
      } catch {
        toast.error('Помилка завантаження даних клієнта');
        router.push('/clients');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await clientsService.deactivate(id);
      toast.success('Клієнта деактивовано');
      router.push('/clients');
    } catch {
      toast.error('Помилка деактивації');
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={`${client.lastName} ${client.firstName}`}
        description={`Ідент. номер: ${client.nationalId}`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/clients">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Button>
            </Link>
            <Link href={`/clients/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Редагувати
              </Button>
            </Link>
            {isNotary && client.isActive && (
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
        className="grid gap-6 lg:grid-cols-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Client info card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Дані клієнта</CardTitle>
              <ClientStatusBadge isActive={client.isActive} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={CreditCard}
              label="РНОКПП"
              value={client.nationalId}
            />
            <InfoRow
              icon={Calendar}
              label="Дата народження"
              value={formatDate(client.dateOfBirth)}
            />
            <Separator />
            <InfoRow icon={Phone} label="Телефон" value={client.phone} />
            <InfoRow icon={Mail} label="Email" value={client.email} />
            <Separator />
            <InfoRow
              icon={MapPin}
              label="Адреса"
              value={`${client.address.street}, ${client.address.postalCode} ${client.address.city}, ${client.address.country}`}
            />
            {client.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-gray-400 mb-1">Нотатки</p>
                  <p className="text-sm text-gray-700">{client.notes}</p>
                </div>
              </>
            )}
            <Separator />
            <div className="text-xs text-gray-400">
              <p>Створено: {formatDateTime(client.createdAt)}</p>
              {typeof client.createdBy === 'object' && client.createdBy && (
                <p>Автор: {client.createdBy.name}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right column: services + documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                Послуги
                <Badge variant="secondary">{services.length}</Badge>
              </CardTitle>
              <Link href={`/clients/${id}/services/new`}>
                <Button size="sm" variant="outline">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Нова послуга
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Послуги відсутні
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {services.map((svc) => {
                    const cfg = SERVICE_STATUS_CONFIG[svc.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <Link
                        key={svc._id}
                        href={`/services/${svc._id}`}
                        className="flex items-center justify-between py-3 hover:bg-gray-50 px-1 rounded transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-4 w-4 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {svc.description}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(svc.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm text-gray-600 hidden sm:block">
                            {formatMoney(svc.feeAmount, svc.feeCurrency)}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit log */}
          <AuditLog entity="client" entityId={id} />

          {/* Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-gray-400" />
                Документи
                <Badge variant="secondary">{documents.length}</Badge>
              </CardTitle>
              {isNotary && services.some((s) => s.status === 'COMPLETED') && (
                <Link href={`/documents/generate?clientId=${id}`}>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Генерувати
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Документи відсутні
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {documents.map((doc) => {
                    const cfg = DOC_STATUS_CONFIG[doc.status];
                    return (
                      <Link
                        key={doc._id}
                        href={`/documents/${doc._id}`}
                        className="flex items-center justify-between py-3 hover:bg-gray-50 px-1 rounded transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {doc.title}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {doc.documentNumber}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <ConfirmDialog
        open={showDeactivate}
        title="Деактивувати клієнта"
        description={`Ви впевнені, що хочете деактивувати ${client.lastName} ${client.firstName}?`}
        confirmLabel="Деактивувати"
        isLoading={isDeactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivate(false)}
      />
    </div>
  );
}
