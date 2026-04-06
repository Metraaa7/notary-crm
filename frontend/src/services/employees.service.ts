import { api } from './api';
import { Employee, CreateEmployeePayload, UpdateEmployeePayload } from '@/types/user.types';
import { ApiResponse } from '@/types/api.types';

export const employeesService = {
  async getAll(): Promise<Employee[]> {
    const response = await api.get<unknown, ApiResponse<Employee[]>>('/users');
    return response.data;
  },

  async getById(id: string): Promise<Employee> {
    const response = await api.get<unknown, ApiResponse<Employee>>(`/users/${id}`);
    return response.data;
  },

  async create(payload: CreateEmployeePayload): Promise<Employee> {
    const response = await api.post<unknown, ApiResponse<Employee>>('/users', payload);
    return response.data;
  },

  async update(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
    const response = await api.patch<unknown, ApiResponse<Employee>>(`/users/${id}`, payload);
    return response.data;
  },

  async deactivate(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
