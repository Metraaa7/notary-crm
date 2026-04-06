'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { documentsService } from '@/services/documents.service';
import { extractErrorMessage } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/Spinner';
import {
  ArrowLeft,
  Download,
  Lock,
  CheckCircle,
  User,
  Calendar,
  Hash,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import type { NotaryDocument } from '@/types/document.types';

const DOC_STATUS_CONFIG = {
  DRAFT: { label: 'Чернетка', className: 'bg-amber-100 text-amber-700' },
  FINAL: { label: 'Завершено', className: 'bg-emerald-100 text-emerald-700' },
} as const;

const VERIFICATION_CONFIG = {
  VERIFIED: { label: 'Верифіковано', className: 'bg-emerald-100 text-emerald-700' },
  NOT_FOUND: { label: 'Не знайдено', className: 'bg-red-100 text-red-600' },
  MISMATCH: { label: 'Дані не збігаються', className: 'bg-orange-100 text-orange-700' },
  UNAVAILABLE: { label: 'Сервіс недоступний', className: 'bg-gray-100 text-gray-500' },
} as const;

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isNotary } = useAuth();
  const [doc, setDoc] = useState<NotaryDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFinalize, setShowFinalize] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    documentsService
      .getById(id)
      .then(setDoc)
      .catch(() => toast.error('Документ не знайдено'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      const updated = await documentsService.finalize(id);
      setDoc(updated);
      toast.success('Документ завершено і заблоковано');
      setShowFinalize(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleExport = async () => {
    if (!doc) return;
    setIsDownloading(true);
    try {
      await documentsService.exportPdf(doc._id, doc.documentNumber);
    } catch {
      toast.error('Помилка завантаження PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <div className="lg:col-span-2">
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  const statusCfg = DOC_STATUS_CONFIG[doc.status];
  const clientId =
    typeof doc.client === 'string'
      ? doc.client
      : (doc.client as { _id: string })._id;

  const generatedByName =
    typeof doc.generatedBy === 'object' && doc.generatedBy
      ? doc.generatedBy.name
      : String(doc.generatedBy);

  const finalizedByName =
    doc.finalizedBy && typeof doc.finalizedBy === 'object'
      ? doc.finalizedBy.name
      : null;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={doc.title}
        description={`№ ${doc.documentNumber}`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/clients/${clientId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                До клієнта
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              PDF
            </Button>
            {isNotary && doc.status === 'DRAFT' && (
              <Button size="sm" onClick={() => setShowFinalize(true)}>
                <Lock className="mr-2 h-4 w-4" />
                Завершити
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
        {/* Metadata sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Метадані</CardTitle>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}
              >
                {statusCfg.label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetaRow
              icon={Hash}
              label="Номер документа"
              value={doc.documentNumber}
            />
            <MetaRow icon={ScrollText} label="Назва" value={doc.title} />
            <Separator />
            <MetaRow
              icon={User}
              label="Створено"
              value={generatedByName}
            />
            <MetaRow
              icon={Calendar}
              label="Дата створення"
              value={formatDateTime(doc.createdAt)}
            />
            {finalizedByName && (
              <>
                <Separator />
                <MetaRow
                  icon={CheckCircle}
                  label="Завершено"
                  value={finalizedByName}
                />
                <MetaRow
                  icon={Calendar}
                  label="Дата завершення"
                  value={doc.finalizedAt ? formatDateTime(doc.finalizedAt) : null}
                />
              </>
            )}
            {doc.verificationStatus && (
              <>
                <Separator />
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      Верифікація особи
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        VERIFICATION_CONFIG[doc.verificationStatus]?.className
                      }`}
                    >
                      {VERIFICATION_CONFIG[doc.verificationStatus]?.label}
                    </span>
                  </div>
                </div>
              </>
            )}
            {doc.status === 'FINAL' && (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Документ заблоковано та незмінний</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Document content preview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Зміст документа</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 border border-gray-100 p-4 text-xs text-gray-700 font-mono leading-relaxed overflow-auto max-h-[600px]">
              {doc.content}
            </pre>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export hint for DRAFT */}
      {doc.status === 'DRAFT' && isNotary && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">Документ у статусі «Чернетка»</p>
            <p className="text-amber-700 mt-0.5">
              Після перевірки натисніть «Завершити», щоб заблокувати документ.
              Завершений документ неможливо змінити.
            </p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showFinalize}
        title="Завершити документ"
        description="Ви впевнені, що хочете завершити цей документ? Після цього він стане незмінним і отримає офіційний статус."
        confirmLabel="Завершити документ"
        variant="default"
        isLoading={isFinalizing}
        onConfirm={handleFinalize}
        onCancel={() => setShowFinalize(false)}
      />
    </div>
  );
}
