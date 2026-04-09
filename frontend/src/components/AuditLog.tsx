'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { auditService, AuditLogEntry } from '@/services/audit.service';
import { useSettings } from '@/context/SettingsContext';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Створення',
  UPDATE: 'Редагування',
  DEACTIVATE: 'Деактивація',
  CONFIRM: 'Підтвердження',
  CANCEL: 'Скасування',
  FINALIZE: 'Фіналізація',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DEACTIVATE: 'bg-red-100 text-red-700',
  CONFIRM: 'bg-emerald-100 text-emerald-700',
  CANCEL: 'bg-gray-100 text-gray-500',
  FINALIZE: 'bg-purple-100 text-purple-700',
};

interface AuditLogProps {
  entity: string;
  entityId: string;
}

export function AuditLog({ entity, entityId }: AuditLogProps) {
  const { formatDateTime } = useSettings();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    auditService
      .getByEntity(entity, entityId)
      .then(setEntries)
      .finally(() => setIsLoading(false));
  }, [entity, entityId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-gray-400" />
          Журнал змін
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            Записи відсутні
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <div key={entry._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      ACTION_COLORS[entry.action] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </span>
                  <span className="text-sm text-gray-600">{entry.userName}</span>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatDateTime(entry.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
