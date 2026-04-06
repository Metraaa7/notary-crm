'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { clientsService } from '@/services/clients.service';
import { documentsService } from '@/services/documents.service';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  FilePlus,
  ScrollText,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
} from 'lucide-react';
import type { NotaryDocument } from '@/types/document.types';
import type { Client } from '@/types/client.types';

const STATUS_CONFIG = {
  DRAFT: { label: 'Чернетка', className: 'bg-amber-100 text-amber-700', icon: Clock },
  FINAL: { label: 'Завершено', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
} as const;

export default function DocumentsPage() {
  const { isNotary } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<NotaryDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const allClients = await clientsService.getAll();
        setClients(allClients);

        const docsPerClient = await Promise.allSettled(
          allClients.map((c) => documentsService.getAllByClient(c._id)),
        );

        const allDocs: NotaryDocument[] = [];
        docsPerClient.forEach((result) => {
          if (result.status === 'fulfilled') {
            allDocs.push(...result.value);
          }
        });

        allDocs.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setDocuments(allDocs);
      } catch {
        toast.error('Помилка завантаження документів');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c._id === clientId);
    return client ? `${client.lastName} ${client.firstName}` : '—';
  };

  const handleExport = async (doc: NotaryDocument) => {
    setDownloading(doc._id);
    try {
      await documentsService.exportPdf(doc._id, doc.documentNumber);
    } catch {
      toast.error('Помилка завантаження PDF');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Документи"
        description="Всі нотаріальні документи системи"
        action={
          isNotary ? (
            <Link href="/documents/generate">
              <Button>
                <FilePlus className="mr-2 h-4 w-4" />
                Генерувати документ
              </Button>
            </Link>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <ScrollText className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">Документи відсутні</p>
          {isNotary && (
            <Link href="/documents/generate">
              <Button variant="outline" size="sm">
                <FilePlus className="mr-2 h-4 w-4" />
                Генерувати перший документ
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {documents.map((doc, i) => {
              const cfg = STATUS_CONFIG[doc.status];
              const StatusIcon = cfg.icon;
              const clientId =
                typeof doc.client === 'string'
                  ? doc.client
                  : (doc.client as { _id: string })._id;

              return (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 py-4 px-5">
                      {/* Icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <ScrollText className="h-5 w-5 text-gray-500" />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/documents/${doc._id}`}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
                          >
                            {doc.title}
                          </Link>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                          <span className="font-mono">{doc.documentNumber}</span>
                          <span>·</span>
                          <Link
                            href={`/clients/${clientId}`}
                            className="hover:text-blue-500 transition-colors"
                          >
                            {getClientName(clientId)}
                          </Link>
                          <span>·</span>
                          <span>{formatDateTime(doc.createdAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        {doc.verificationStatus && (
                          <Badge variant="outline" className="hidden sm:inline-flex text-xs">
                            {doc.verificationStatus === 'VERIFIED'
                              ? '✓ Верифіковано'
                              : doc.verificationStatus}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport(doc)}
                          disabled={downloading === doc._id}
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
