import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import { VerificationStatus } from '@/types/document.types';

export interface RegistryResult {
  status: VerificationStatus;
  nationalId: string;
  checkedAt: string;
  data?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    address: string;
  };
  message?: string;
}

export const registryService = {
  async verify(
    nationalId: string,
    firstName: string,
    lastName: string,
  ): Promise<RegistryResult> {
    const response = await api.post<unknown, ApiResponse<RegistryResult>>(
      '/registry/verify',
      { nationalId, firstName, lastName },
    );
    return response.data;
  },
};
