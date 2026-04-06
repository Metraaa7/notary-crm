export type ServiceType =
  | 'DEED'
  | 'POWER_OF_ATTORNEY'
  | 'WILL'
  | 'CERTIFICATION'
  | 'CONTRACT'
  | 'AFFIDAVIT'
  | 'OTHER';

export type ServiceStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ServiceUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface PopulatedClient {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface Service {
  _id: string;
  client: string | PopulatedClient;
  type: ServiceType;
  status: ServiceStatus;
  description: string;
  feeAmount: number;
  feeCurrency: string;
  notes?: string;
  createdBy: ServiceUser;
  confirmedBy?: ServiceUser | null;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicePayload {
  clientId: string;
  type: ServiceType;
  description: string;
  feeAmount: number;
  feeCurrency?: string;
  notes?: string;
}

export interface UpdateServicePayload {
  description?: string;
  feeAmount?: number;
  feeCurrency?: string;
  notes?: string;
}

export interface ConfirmServicePayload {
  notes?: string;
}
