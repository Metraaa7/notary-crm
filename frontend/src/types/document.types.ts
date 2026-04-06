export type DocumentStatus = 'DRAFT' | 'FINAL';

export type VerificationStatus =
  | 'VERIFIED'
  | 'NOT_FOUND'
  | 'MISMATCH'
  | 'UNAVAILABLE';

export interface NotaryDocument {
  _id: string;
  documentNumber: string;
  title: string;
  client: string;
  services: string[];
  content: string;
  status: DocumentStatus;
  verificationStatus: VerificationStatus | null;
  generatedBy: { _id: string; name: string; email: string };
  finalizedBy?: { _id: string; name: string; email: string } | null;
  finalizedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateDocumentPayload {
  clientId: string;
  serviceIds: string[];
  title: string;
  notes?: string;
}
