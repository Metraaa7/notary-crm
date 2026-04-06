export enum VerificationStatus {
  VERIFIED = 'VERIFIED',       // Identity confirmed by registry
  NOT_FOUND = 'NOT_FOUND',     // No record found for this nationalId
  MISMATCH = 'MISMATCH',       // Record found but data does not match
  UNAVAILABLE = 'UNAVAILABLE', // Registry service is temporarily down
}

export interface RegistryPersonData {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO 8601
  address: string;
}

export interface RegistryVerificationResult {
  status: VerificationStatus;
  nationalId: string;
  checkedAt: string; // ISO 8601
  data?: RegistryPersonData; // Present only when status === VERIFIED
  message?: string;
}

// The interface every registry provider must implement
export interface IRegistryService {
  verifyIdentity(
    nationalId: string,
    firstName: string,
    lastName: string,
  ): Promise<RegistryVerificationResult>;
}
