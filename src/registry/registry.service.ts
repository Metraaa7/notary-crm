import { Injectable, Logger } from '@nestjs/common';
import {
  IRegistryService,
  RegistryVerificationResult,
  VerificationStatus,
} from './interfaces/registry-response.interface';

interface MockRegistryRecord {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
}

const MOCK_REGISTRY: Record<string, MockRegistryRecord> = {
  '9001011234': {
    firstName: 'Іван',
    lastName: 'Коваленко',
    dateOfBirth: '1990-01-01',
    address: 'вул. Хрещатик, 1, м. Київ, 01001',
  },
  '8505156789': {
    firstName: 'Анна',
    lastName: 'Петренко',
    dateOfBirth: '1985-05-15',
    address: 'вул. Сумська, 22, м. Харків, 61002',
  },
  '0000000000': null as unknown as MockRegistryRecord, // Simulates registry outage
};

const SIMULATED_DELAY_MS = 120;

@Injectable()
export class RegistryService implements IRegistryService {
  private readonly logger = new Logger(RegistryService.name);

  async verifyIdentity(
    nationalId: string,
    firstName: string,
    lastName: string,
  ): Promise<RegistryVerificationResult> {
    await this.delay(SIMULATED_DELAY_MS);

    this.logger.log(`Registry lookup for nationalId: ${nationalId}`);

    const checkedAt = new Date().toISOString();

    // Simulate service unavailable
    if (nationalId === '0000000000') {
      return {
        status: VerificationStatus.UNAVAILABLE,
        nationalId,
        checkedAt,
        message: 'External registry is temporarily unavailable',
      };
    }

    const record = MOCK_REGISTRY[nationalId];

    if (!record) {
      return {
        status: VerificationStatus.NOT_FOUND,
        nationalId,
        checkedAt,
        message: 'No record found in registry for this national ID',
      };
    }

    const firstNameMatch =
      record.firstName.toLowerCase() === firstName.toLowerCase();
    const lastNameMatch =
      record.lastName.toLowerCase() === lastName.toLowerCase();

    if (!firstNameMatch || !lastNameMatch) {
      return {
        status: VerificationStatus.MISMATCH,
        nationalId,
        checkedAt,
        message: 'Registry record found but personal data does not match',
      };
    }

    return {
      status: VerificationStatus.VERIFIED,
      nationalId,
      checkedAt,
      data: {
        firstName: record.firstName,
        lastName: record.lastName,
        dateOfBirth: record.dateOfBirth,
        address: record.address,
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
