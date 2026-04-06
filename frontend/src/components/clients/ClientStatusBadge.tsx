import { Badge } from '@/components/ui/badge';

export function ClientStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>
      {isActive ? 'Активний' : 'Деактивований'}
    </Badge>
  );
}
