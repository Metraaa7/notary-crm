import { api } from './api';
import { Client, CreateClientPayload, UpdateClientPayload } from '@/types/client.types';
import { ApiResponse } from '@/types/api.types';

export const clientsService = {
  async getAll(search?: string, includeInactive?: boolean): Promise<Client[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (includeInactive) params.includeInactive = 'true';

    const response = await api.get<unknown, ApiResponse<Client[]>>('/clients', { params });
    return response.data;
  },

  async getById(id: string): Promise<Client> {
    const response = await api.get<unknown, ApiResponse<Client>>(`/clients/${id}`);
    return response.data;
  },

  async create(payload: CreateClientPayload): Promise<Client> {
    const response = await api.post<unknown, ApiResponse<Client>>('/clients', payload);
    return response.data;
  },

  async update(id: string, payload: UpdateClientPayload): Promise<Client> {
    const response = await api.patch<unknown, ApiResponse<Client>>(
      `/clients/${id}`,
      payload,
    );
    return response.data;
  },

  async deactivate(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
