import { api } from './api';
import { ApiResponse } from '@/types/api.types';

export interface AuditLogEntry {
  _id: string;
  entity: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  changes: Record<string, unknown>;
}

export const auditService = {
  async getByEntity(entity: string, entityId: string): Promise<AuditLogEntry[]> {
    const response = await api.get<unknown, ApiResponse<AuditLogEntry[]>>(
      '/audit',
      { params: { entity, entityId } },
    );
    return response.data;
  },
};
