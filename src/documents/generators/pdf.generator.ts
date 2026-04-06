import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import { DocumentData } from '../interfaces/document-generator.interface';

// ── Font paths (DejaVu Serif — full Cyrillic support) ──────────────────────
const FONT_REGULAR = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf';
const FONT_BOLD    = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf';
const FONT_ITALIC  = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf';

// ── Design tokens ──────────────────────────────────────────────────────────
const NAVY   = '#1B3A6B';
const GOLD   = '#A07830';
const DARK   = '#1A1A1A';
const MUTED  = '#555555';
const LIGHT  = '#888888';
const PAGE_W = 595.28;          // A4 width in points
const ML     = 55;              // left margin
const MR     = 55;              // right margin
const BODY_W = PAGE_W - ML - MR;

// ── Ukrainian service type labels ──────────────────────────────────────────
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
export class PdfGenerator {
  generate(data: DocumentData, _textContent: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: ML, right: MR },
        info: {
          Title: data.title,
          Author: data.generatedBy,
          Subject: `Нотаріальний документ ${data.documentNumber}`,
          Creator: 'Нотаріальна CRM',
          CreationDate: new Date(data.generatedAt),
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Register fonts
      doc.registerFont('Serif',       FONT_REGULAR);
      doc.registerFont('Serif-Bold',  FONT_BOLD);
      doc.registerFont('Serif-Italic',FONT_ITALIC);

      this.renderTopBar(doc);
      this.renderHeader(doc, data);
      this.renderTitle(doc, data);
      this.renderPreamble(doc, data);
      this.renderClientBlock(doc, data);
      this.renderServicesBlock(doc, data);
      this.renderCertification(doc, data);
      this.renderSignatureBlock(doc, data);
      this.renderFooter(doc, data);

      doc.end();
    });
  }

  // ── Top decorative bar ──────────────────────────────────────────────────
  private renderTopBar(doc: PDFKit.PDFDocument): void {
    doc.rect(0, 0, PAGE_W, 7).fill(NAVY);
    doc.rect(0, 7, PAGE_W, 2).fill(GOLD);
    doc.y = 60;
  }

  // ── Office header ────────────────────────────────────────────────────────
  private renderHeader(doc: PDFKit.PDFDocument, data: DocumentData): void {
    const y0 = doc.y;

    // Left column — office info
    doc
      .font('Serif-Bold').fontSize(8).fillColor(NAVY)
      .text('НОТАРІАЛЬНИЙ ОФІС', ML, y0, { width: BODY_W / 2 });

    doc
      .font('Serif').fontSize(7.5).fillColor(MUTED)
      .text('Приватна нотаріальна практика', ML, doc.y, { width: BODY_W / 2 });

    // Right column — document registration
    const rightX = ML + BODY_W / 2;
    doc
      .font('Serif').fontSize(7.5).fillColor(MUTED)
      .text(`Реєстр №: ${data.documentNumber}`, rightX, y0, {
        width: BODY_W / 2,
        align: 'right',
      })
      .text(
        `Дата: ${this.fmtDate(data.generatedAt)}`,
        rightX,
        doc.y,
        { width: BODY_W / 2, align: 'right' },
      );

    doc.y = Math.max(doc.y, y0 + 28);
    doc.moveDown(0.6);
    this.hLine(doc, GOLD, 1);
    doc.moveDown(0.8);
  }

  // ── Document title ───────────────────────────────────────────────────────
  private renderTitle(doc: PDFKit.PDFDocument, data: DocumentData): void {
    doc
      .font('Serif-Bold').fontSize(15).fillColor(NAVY)
      .text(data.title.toUpperCase(), ML, doc.y, {
        width: BODY_W,
        align: 'center',
      });

    doc.moveDown(0.5);
    this.hLine(doc, NAVY, 0.5);
    doc.moveDown(1);
  }

  // ── Opening legal preamble ───────────────────────────────────────────────
  private renderPreamble(doc: PDFKit.PDFDocument, data: DocumentData): void {
    const date = this.fmtDateLong(data.generatedAt);
    const text =
      `Я, ${data.generatedBy}, нотаріус, діючи відповідно до ` +
      `Закону України «Про нотаріат», посвідчую справжність цього документа, ` +
      `складеного ${date} р., та підтверджую нотаріальне провадження, ` +
      `описане нижче.`;

    doc
      .font('Serif-Italic').fontSize(9.5).fillColor(DARK)
      .text(text, ML, doc.y, { width: BODY_W, align: 'justify', lineGap: 2 });

    doc.moveDown(1.2);
  }

  // ── Client information block ─────────────────────────────────────────────
  private renderClientBlock(doc: PDFKit.PDFDocument, data: DocumentData): void {
    this.sectionTitle(doc, 'ВІДОМОСТІ ПРО ОСОБУ, ЯКА ЗВЕРНУЛАСЬ');

    const rows: [string, string][] = [
      ['Прізвище та ім\'я',   data.client.fullName],
      ['РНОКПП',              data.client.nationalId],
      ['Дата народження',     this.fmtDate(data.client.dateOfBirth)],
      ['Місце проживання',    data.client.address],
      ['Телефон',             data.client.phone],
    ];
    if (data.client.email) rows.push(['Електронна пошта', data.client.email]);
    if (data.verificationStatus) {
      rows.push([
        'Верифікація особи',
        VERIFICATION_LABELS[data.verificationStatus] ?? data.verificationStatus,
      ]);
    }

    this.renderInfoTable(doc, rows);
    doc.moveDown(1);
  }

  // ── Services block ───────────────────────────────────────────────────────
  private renderServicesBlock(doc: PDFKit.PDFDocument, data: DocumentData): void {
    this.sectionTitle(doc, 'НОТАРІАЛЬНІ ДІЇ');

    let totalKop = 0;

    data.services.forEach((svc, i) => {
      totalKop += svc.feeAmount;
      const typeLabel = TYPE_LABELS[svc.type] ?? svc.type;
      const feeUah = (svc.feeAmount / 100).toFixed(2);
      const confirmedText = svc.confirmedAt
        ? `Підтверджено нотаріусом ${this.fmtDate(svc.confirmedAt)} р.`
        : 'Очікує підтвердження нотаріуса.';

      // Number badge
      const bx = ML;
      const by = doc.y;
      doc.circle(bx + 8, by + 7, 8).fill(NAVY);
      doc
        .font('Serif-Bold').fontSize(8).fillColor('#FFFFFF')
        .text(`${i + 1}`, bx + 1, by + 3, { width: 16, align: 'center' });

      // Service body (offset from number)
      const tx = bx + 22;
      const tw = BODY_W - 22;
      doc
        .font('Serif-Bold').fontSize(10).fillColor(DARK)
        .text(svc.description, tx, by, { width: tw });

      doc
        .font('Serif').fontSize(9).fillColor(MUTED)
        .text(`Вид провадження: ${typeLabel}`, tx, doc.y, { width: tw });

      doc
        .font('Serif').fontSize(9).fillColor(DARK)
        .text(confirmedText, tx, doc.y, { width: tw });

      // Fee aligned right
      const feeY = by;
      doc
        .font('Serif-Bold').fontSize(10).fillColor(NAVY)
        .text(`${feeUah} ${svc.feeCurrency}`, ML, feeY, {
          width: BODY_W,
          align: 'right',
        });

      doc.moveDown(0.3);
      // Thin separator between services
      if (i < data.services.length - 1) {
        doc
          .moveTo(tx, doc.y)
          .lineTo(PAGE_W - MR, doc.y)
          .strokeColor('#DDDDDD')
          .lineWidth(0.5)
          .stroke();
        doc.moveDown(0.5);
      }
    });

    doc.moveDown(0.8);

    // Total fee box
    const totalUah = totalKop / 100;
    const totalStr = totalUah.toFixed(2);
    const currency  = data.services[0]?.feeCurrency ?? 'UAH';
    const boxH = 28;
    const boxY = doc.y;

    doc.rect(ML, boxY, BODY_W, boxH).fill('#EEF2F8');
    doc
      .font('Serif-Bold').fontSize(10).fillColor(NAVY)
      .text('ЗАГАЛЬНА СУМА НОТАРІАЛЬНОГО ЗБОРУ:', ML + 10, boxY + 8, {
        width: BODY_W - 20,
        continued: true,
      })
      .font('Serif-Bold').fontSize(11).fillColor(NAVY)
      .text(`  ${totalStr} ${currency}`, { align: 'right' });

    doc.y = boxY + boxH + 10;

    if (data.notes) {
      doc.moveDown(0.5);
      doc
        .font('Serif-Bold').fontSize(9).fillColor(DARK)
        .text('Примітки:', ML, doc.y);
      doc
        .font('Serif-Italic').fontSize(9).fillColor(MUTED)
        .text(data.notes, ML, doc.y, { width: BODY_W, lineGap: 2 });
    }

    doc.moveDown(1.2);
  }

  // ── Notary certification clause ──────────────────────────────────────────
  private renderCertification(doc: PDFKit.PDFDocument, data: DocumentData): void {
    this.hLine(doc, NAVY, 0.5);
    doc.moveDown(0.8);

    const text =
      `Цей документ складено та посвідчено відповідно до вимог чинного законодавства України. ` +
      `Нотаріальне провадження зареєстровано в реєстрі нотаріальних дій за № ${data.documentNumber}. ` +
      `Справжність документа підтверджується підписом та печаткою нотаріуса.`;

    doc
      .font('Serif').fontSize(9).fillColor(DARK)
      .text(text, ML, doc.y, { width: BODY_W, align: 'justify', lineGap: 2 });

    doc.moveDown(1.5);
  }

  // ── Signature block ──────────────────────────────────────────────────────
  private renderSignatureBlock(doc: PDFKit.PDFDocument, data: DocumentData): void {
    const y0 = doc.y;
    const col = BODY_W / 2;

    // Left — notary
    doc
      .font('Serif-Bold').fontSize(9).fillColor(DARK)
      .text('Нотаріус:', ML, y0);
    doc
      .font('Serif').fontSize(9).fillColor(MUTED)
      .text(data.generatedBy, ML, doc.y, { width: col - 10 });

    doc.moveDown(0.3);
    doc
      .moveTo(ML, doc.y)
      .lineTo(ML + 180, doc.y)
      .strokeColor(DARK).lineWidth(0.75).stroke();
    doc
      .font('Serif').fontSize(7.5).fillColor(LIGHT)
      .text('(підпис нотаріуса)', ML, doc.y + 3, { width: 180, align: 'center' });

    // Right — seal placeholder
    const sealCx = ML + col + 80;
    const sealCy = y0 + 30;
    const sealR  = 28;
    doc.circle(sealCx, sealCy, sealR).stroke(NAVY).lineWidth(1);
    doc.circle(sealCx, sealCy, sealR - 5).dash(2, { space: 3 }).stroke(NAVY).lineWidth(0.5).undash();
    doc
      .font('Serif').fontSize(7).fillColor(NAVY)
      .text('М.П.', sealCx - 10, sealCy - 5, { width: 20, align: 'center' });

    doc.y = y0 + sealR * 2 + 20;

    // Date line
    doc
      .font('Serif').fontSize(9).fillColor(DARK)
      .text(`Дата вчинення нотаріальної дії: ${this.fmtDateLong(data.generatedAt)} р.`, ML, doc.y, {
        width: BODY_W,
      });

    doc.moveDown(0.5);
  }

  // ── Page footer ──────────────────────────────────────────────────────────
  private renderFooter(doc: PDFKit.PDFDocument, data: DocumentData): void {
    const pageH  = 841.89;
    const footerY = pageH - 40;

    doc
      .moveTo(ML, footerY - 8)
      .lineTo(PAGE_W - MR, footerY - 8)
      .strokeColor(GOLD).lineWidth(1).stroke();

    doc
      .font('Serif').fontSize(7).fillColor(LIGHT)
      .text(
        `Документ сформовано автоматично системою Нотаріальна CRM · ${data.documentNumber} · ${this.fmtDate(data.generatedAt)}`,
        ML,
        footerY - 2,
        { width: BODY_W, align: 'center' },
      );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private sectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    const y = doc.y;
    doc.rect(ML, y, BODY_W, 18).fill(NAVY);
    doc
      .font('Serif-Bold').fontSize(8.5).fillColor('#FFFFFF')
      .text(title, ML + 8, y + 5, { width: BODY_W - 16 });
    doc.y = y + 18 + 8;
  }

  private renderInfoTable(doc: PDFKit.PDFDocument, rows: [string, string][]): void {
    const labelW = 135;
    const valueW = BODY_W - labelW;
    const rowH   = 16;
    let y = doc.y;

    rows.forEach(([label, value], i) => {
      const bg = i % 2 === 0 ? '#F4F7FB' : '#FFFFFF';
      doc.rect(ML, y, BODY_W, rowH).fill(bg);

      doc
        .font('Serif-Bold').fontSize(8.5).fillColor(NAVY)
        .text(label, ML + 6, y + 4, { width: labelW - 6 });

      doc
        .font('Serif').fontSize(8.5).fillColor(DARK)
        .text(value, ML + labelW, y + 4, { width: valueW - 6 });

      y += rowH;
    });

    // Border around table
    doc.rect(ML, doc.y - rows.length * rowH, BODY_W, rows.length * rowH)
      .stroke(NAVY).lineWidth(0.5);

    doc.y = y + 2;
  }

  private hLine(doc: PDFKit.PDFDocument, color: string, width: number): void {
    doc
      .moveTo(ML, doc.y)
      .lineTo(PAGE_W - MR, doc.y)
      .strokeColor(color)
      .lineWidth(width)
      .stroke();
    doc.moveDown(0.3);
  }

  private fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private fmtDateLong(iso: string): string {
    return new Date(iso).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
