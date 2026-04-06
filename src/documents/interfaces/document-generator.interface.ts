import { ServiceType } from '../../services/enums/service-type.enum';
import { VerificationStatus } from '../../registry/interfaces/registry-response.interface';

export interface DocumentClientData {
  fullName: string;
  nationalId: string;
  dateOfBirth: string;
  address: string;
  phone: string;
  email?: string;
}

export interface DocumentServiceData {
  type: ServiceType;
  description: string;
  feeAmount: number;
  feeCurrency: string;
  confirmedAt?: string;
}

export interface DocumentData {
  documentNumber: string;
  title: string;
  client: DocumentClientData;
  services: DocumentServiceData[];
  generatedBy: string;       // Notary name
  generatedAt: string;       // ISO 8601
  verificationStatus?: VerificationStatus;
  notes?: string;
}

export interface IDocumentGenerator {
  generate(data: DocumentData): string;
}
