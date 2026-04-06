import { Injectable } from '@nestjs/common';
import {
  DocumentData,
  IDocumentGenerator,
} from '../interfaces/document-generator.interface';

@Injectable()
export class TextGenerator implements IDocumentGenerator {
  generate(data: DocumentData): string {
    const separator = '='.repeat(60);
    const thin = '-'.repeat(60);

    const serviceLines = data.services
      .map((s, i) => {
        const fee = (s.feeAmount / 100).toFixed(2);
        const confirmed = s.confirmedAt
          ? `  Confirmed: ${this.formatDate(s.confirmedAt)}`
          : '  Status: Pending confirmation';

        return [
          `  ${i + 1}. [${s.type}]`,
          `     ${s.description}`,
          `     Fee: ${fee} ${s.feeCurrency}`,
          confirmed,
        ].join('\n');
      })
      .join('\n\n');

    const totalFee = data.services.reduce((sum, s) => sum + s.feeAmount, 0);
    const currency = data.services[0]?.feeCurrency ?? 'UAH';

    const verificationLine = data.verificationStatus
      ? `Identity Verification : ${data.verificationStatus}`
      : `Identity Verification : NOT PERFORMED`;

    return [
      separator,
      `NOTARIAL DOCUMENT`,
      separator,
      ``,
      `Document No : ${data.documentNumber}`,
      `Title       : ${data.title}`,
      `Generated   : ${this.formatDate(data.generatedAt)}`,
      `Notary      : ${data.generatedBy}`,
      ``,
      thin,
      `CLIENT`,
      thin,
      `Full Name   : ${data.client.fullName}`,
      `National ID : ${data.client.nationalId}`,
      `Date of Birth: ${this.formatDate(data.client.dateOfBirth)}`,
      `Address     : ${data.client.address}`,
      `Phone       : ${data.client.phone}`,
      data.client.email ? `Email       : ${data.client.email}` : null,
      verificationLine,
      ``,
      thin,
      `SERVICES`,
      thin,
      serviceLines,
      ``,
      thin,
      `TOTAL FEE   : ${(totalFee / 100).toFixed(2)} ${currency}`,
      thin,
      data.notes ? `\nNOTES\n${data.notes}\n` : null,
      ``,
      separator,
      `Notary signature: ____________________________`,
      ``,
      `Date: ________________`,
      separator,
    ]
      .filter((line) => line !== null)
      .join('\n');
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      locale: 'uk-UA',
    } as Intl.DateTimeFormatOptions);
  }
}
