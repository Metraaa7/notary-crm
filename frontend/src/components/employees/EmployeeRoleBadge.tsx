import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/types/user.types';

const ROLE_LABELS: Record<UserRole, string> = {
  NOTARY: 'Нотаріус',
  ASSISTANT: 'Асистент',
};

export function EmployeeRoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge variant={role === 'NOTARY' ? 'default' : 'secondary'}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}
