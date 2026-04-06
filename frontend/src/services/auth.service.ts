import { api } from './api';
import { AuthResponse, LoginPayload } from '@/types/auth.types';
import { ApiResponse } from '@/types/api.types';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<unknown, ApiResponse<AuthResponse>>(
      '/auth/login',
      payload,
    );
    return response.data;
  },
};
