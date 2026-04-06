import { api } from './api';
import { NotaryDocument, GenerateDocumentPayload } from '@/types/document.types';
import { ApiResponse } from '@/types/api.types';

export const documentsService = {
  async getAll(): Promise<NotaryDocument[]> {
    const response = await api.get<unknown, ApiResponse<NotaryDocument[]>>('/documents');
    return response.data;
  },

  async getAllByClient(clientId: string): Promise<NotaryDocument[]> {
    const response = await api.get<unknown, ApiResponse<NotaryDocument[]>>(
      `/documents/client/${clientId}`,
    );
    return response.data;
  },

  async getById(id: string): Promise<NotaryDocument> {
    const response = await api.get<unknown, ApiResponse<NotaryDocument>>(
      `/documents/${id}`,
    );
    return response.data;
  },

  async generate(payload: GenerateDocumentPayload): Promise<NotaryDocument> {
    const response = await api.post<unknown, ApiResponse<NotaryDocument>>(
      '/documents',
      payload,
    );
    return response.data;
  },

  async finalize(id: string): Promise<NotaryDocument> {
    const response = await api.patch<unknown, ApiResponse<NotaryDocument>>(
      `/documents/${id}/finalize`,
      {},
    );
    return response.data;
  },

  async exportPdf(id: string, documentNumber: string): Promise<void> {
    const response = await api.get(`/documents/${id}/export/pdf`, {
      responseType: 'blob',
    });

    const blob = response.data as Blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentNumber.replace(/\//g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Delay revocation so the browser has time to initiate the download
    setTimeout(() => URL.revokeObjectURL(url), 500);
  },
};
