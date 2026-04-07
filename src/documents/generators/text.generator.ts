import { Injectable } from '@nestjs/common';
import {
  DocumentData,
  IDocumentGenerator,
} from '../interfaces/document-generator.interface';

const TYPE_LABELS: Record<string, string> = {
  DEED:              'Нотаріальний акт',
  POWER_OF_ATTORNEY: 'Довіреність',
  WILL:              'Заповіт',
  CERTIFICATION:     'Засвідчення',
  CONTRACT:          'Договір',
  AFFIDAVIT:         'Заява',
  OTHER:             'Інше нотаріальне провадження',
};

const VERIFICATION_LABELS: Record<string, string> = {
  VERIFIED:    'Особу верифіковано',
  NOT_FOUND:   'Запис у реєстрі не знайдено',
  MISMATCH:    'Дані не збігаються з реєстром',
  UNAVAILABLE: 'Реєстр тимчасово недоступний',
};

@Injectable()
export class TextGenerator implements IDocumentGenerator {
  generate(data: DocumentData): string {
    const separator = '='.repeat(60);
    const thin = '-'.repeat(60);

    const serviceLines = data.services
      .map((s, i) => {
        const fee = (s.feeAmount / 100).toFixed(2);
        const typeLabel = TYPE_LABELS[s.type] ?? s.type;
        const confirmed = s.confirmedAt
          ? `  Підтверджено: ${this.formatDate(s.confirmedAt)}`
          : '  Статус: очікує підтвердження';

        return [
          `  ${i + 1}. [${typeLabel}]`,
          `     ${s.description}`,
          `     Збір: ${fee} ${s.feeCurrency}`,
          confirmed,
        ].join('\n');
      })
      .join('\n\n');

    const totalFee = data.services.reduce((sum, s) => sum + s.feeAmount, 0);
    const currency = data.services[0]?.feeCurrency ?? 'UAH';

    const verificationLine = data.verificationStatus
      ? `Верифікація особи    : ${VERIFICATION_LABELS[data.verificationStatus] ?? data.verificationStatus}`
      : `Верифікація особи    : НЕ ВИКОНАНА`;

    return [
      separator,
      `НОТАРІАЛЬНИЙ ДОКУМЕНТ`,
      separator,
      ``,
      `Реєстр №     : ${data.documentNumber}`,
      `Назва        : ${data.title}`,
      `Сформовано   : ${this.formatDate(data.generatedAt)}`,
      `Нотаріус     : ${data.generatedBy}`,
      ``,
      thin,
      `КЛІЄНТ`,
      thin,
      `ПІБ                  : ${data.client.fullName}`,
      `РНОКПП               : ${data.client.nationalId}`,
      `Дата народження      : ${this.formatDate(data.client.dateOfBirth)}`,
      `Місце проживання     : ${data.client.address}`,
      `Телефон              : ${data.client.phone}`,
      data.client.email ? `Електронна пошта     : ${data.client.email}` : null,
      verificationLine,
      ``,
      thin,
      `НОТАРІАЛЬНІ ДІЇ`,
      thin,
      serviceLines,
      ``,
      thin,
      `ЗАГАЛЬНА СУМА        : ${(totalFee / 100).toFixed(2)} ${currency}`,
      thin,
      data.notes ? `\nПРИМІТКИ\n${data.notes}\n` : null,
      ``,
      separator,
      `Підпис нотаріуса: ____________________________`,
      ``,
      `Дата: ________________`,
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
    });
  }
}
