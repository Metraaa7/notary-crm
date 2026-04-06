import { api } from './api';
import {
  Service,
  CreateServicePayload,
  UpdateServicePayload,
  ConfirmServicePayload,
} from '@/types/service.types';
import { ApiResponse } from '@/types/api.types';

export const servicesService = {
  async getAll(): Promise<Service[]> {
    const response = await api.get<unknown, ApiResponse<Service[]>>('/services');
    return response.data;
  },

  async getAllByClient(clientId: string): Promise<Service[]> {
    const response = await api.get<unknown, ApiResponse<Service[]>>(
      `/clients/${clientId}/services`,
    );
    return response.data;
  },

  async getById(id: string): Promise<Service> {
    const response = await api.get<unknown, ApiResponse<Service>>(
      `/services/${id}`,
    );
    return response.data;
  },

  async create(clientId: string, payload: CreateServicePayload): Promise<Service> {
    const response = await api.post<unknown, ApiResponse<Service>>(
      `/clients/${clientId}/services`,
      payload,
    );
    return response.data;
  },

  async update(id: string, payload: UpdateServicePayload): Promise<Service> {
    const response = await api.patch<unknown, ApiResponse<Service>>(
      `/services/${id}`,
      payload,
    );
    return response.data;
  },

  async confirm(id: string, payload: ConfirmServicePayload): Promise<Service> {
    const response = await api.patch<unknown, ApiResponse<Service>>(
      `/services/${id}/confirm`,
      payload,
    );
    return response.data;
  },

  async cancel(id: string): Promise<Service> {
    const response = await api.patch<unknown, ApiResponse<Service>>(
      `/services/${id}/cancel`,
      {},
    );
    return response.data;
  },
};
