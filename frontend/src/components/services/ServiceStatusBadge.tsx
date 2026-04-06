import { cn } from '@/lib/utils';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { ServiceStatus } from '@/types/service.types';

const CONFIG: Record<
  ServiceStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  PENDING: {
    label: 'Очікує',
    className: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  IN_PROGRESS: {
    label: 'В процесі',
    className: 'bg-blue-100 text-blue-700',
    icon: Loader2,
  },
  COMPLETED: {
    label: 'Завершено',
    className: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Скасовано',
    className: 'bg-gray-100 text-gray-500',
    icon: XCircle,
  },
};

interface ServiceStatusBadgeProps {
  status: ServiceStatus;
  showIcon?: boolean;
}

export function ServiceStatusBadge({
  status,
  showIcon = true,
}: ServiceStatusBadgeProps) {
  const { label, className, icon: Icon } = CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        className,
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}
