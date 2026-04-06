import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotaryDocument, DocumentDocument } from './schemas/document.schema';
import { ClientsService } from '../clients/clients.service';
import { ServicesService } from '../services/services.service';
import { TextGenerator } from './generators/text.generator';
import { PdfGenerator } from './generators/pdf.generator';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { DocumentData } from './interfaces/document-generator.interface';
import { DocumentStatus } from './enums/document-status.enum';
import { ServiceStatus } from '../services/enums/service-status.enum';
import { ClientDocument } from '../clients/schemas/client.schema';
import { ServiceDocument } from '../services/schemas/service.schema';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(NotaryDocument.name)
    private readonly documentModel: Model<DocumentDocument>,
    private readonly clientsService: ClientsService,
    private readonly servicesService: ServicesService,
    private readonly textGenerator: TextGenerator,
    private readonly pdfGenerator: PdfGenerator,
  ) {}

  async generate(
    dto: GenerateDocumentDto,
    generatedBy: string,
    generatedByName: string,
  ): Promise<DocumentDocument> {
    const client = await this.clientsService.findById(dto.clientId);

    const services = await Promise.all(
      dto.serviceIds.map((id) => this.servicesService.findById(id)),
    );

    this.validateServicesForClient(services, dto.clientId);

    const documentData = this.buildDocumentData(
      client,
      services,
      generatedBy,
      generatedByName,
      dto,
    );

    const content = this.textGenerator.generate(documentData);

    const document = new this.documentModel({
      documentNumber: documentData.documentNumber,
      title: dto.title,
      client: dto.clientId,
      services: dto.serviceIds,
      content,
      generatedBy,
    });

    return document.save();
  }

  async findAllByClient(clientId: string): Promise<DocumentDocument[]> {
    await this.clientsService.findById(clientId);

    return this.documentModel
      .find({ client: clientId })
      .populate('generatedBy', 'name email')
      .populate('finalizedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<DocumentDocument> {
    const document = await this.documentModel
      .findById(id)
      .populate('client')
      .populate('services')
      .populate('generatedBy', 'name email')
      .populate('finalizedBy', 'name email')
      .exec();

    if (!document) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return document;
  }

  async finalize(id: string, finalizedBy: string): Promise<DocumentDocument> {
    const document = await this.documentModel.findById(id).exec();

    if (!document) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    if (document.status === DocumentStatus.FINAL) {
      throw new BadRequestException('Document is already finalized');
    }

    document.status = DocumentStatus.FINAL;
    document.finalizedBy = finalizedBy as unknown as typeof document.finalizedBy;
    document.finalizedAt = new Date();

    return document.save();
  }

  async exportPdf(id: string, notaryName: string): Promise<Buffer> {
    const document = await this.findById(id);

    const client = document.client as unknown as ClientDocument;
    const services = document.services as unknown as ServiceDocument[];

    const documentData: DocumentData = {
      documentNumber: document.documentNumber,
      title: document.title,
      generatedBy: notaryName,
      generatedAt: (document as unknown as { createdAt: Date }).createdAt.toISOString(),
      verificationStatus: document.verificationStatus ?? undefined,
      client: {
        fullName: `${client.firstName} ${client.lastName}`,
        nationalId: client.nationalId,
        dateOfBirth: client.dateOfBirth.toISOString(),
        address: `${client.address.street}, ${client.address.postalCode} ${client.address.city}`,
        phone: client.phone,
        email: client.email,
      },
      services: services.map((s) => ({
        type: s.type,
        description: s.description,
        feeAmount: s.feeAmount,
        feeCurrency: s.feeCurrency,
        confirmedAt: s.confirmedAt?.toISOString(),
      })),
    };

    return this.pdfGenerator.generate(documentData, document.content);
  }

  private validateServicesForClient(
    services: ServiceDocument[],
    clientId: string,
  ): void {
    const mismatched = services.filter(
      (s) => s.client.toString() !== clientId,
    );

    if (mismatched.length > 0) {
      throw new BadRequestException(
        'All services must belong to the specified client',
      );
    }

    const nonCompleted = services.filter(
      (s) => s.status !== ServiceStatus.COMPLETED,
    );

    if (nonCompleted.length > 0) {
      throw new BadRequestException(
        'All services must be in COMPLETED status before generating a document',
      );
    }
  }

  private buildDocumentData(
    client: ClientDocument,
    services: ServiceDocument[],
    generatedBy: string,
    generatedByName: string,
    dto: GenerateDocumentDto,
  ): DocumentData {
    return {
      documentNumber: this.generateDocumentNumber(),
      title: dto.title,
      generatedBy: generatedByName,
      generatedAt: new Date().toISOString(),
      notes: dto.notes,
      client: {
        fullName: `${client.firstName} ${client.lastName}`,
        nationalId: client.nationalId,
        dateOfBirth: client.dateOfBirth.toISOString(),
        address: `${client.address.street}, ${client.address.postalCode} ${client.address.city}`,
        phone: client.phone,
        email: client.email,
      },
      services: services.map((s) => ({
        type: s.type,
        description: s.description,
        feeAmount: s.feeAmount,
        feeCurrency: s.feeCurrency,
        confirmedAt: s.confirmedAt?.toISOString(),
      })),
    };
  }

  private generateDocumentNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    return `NOT/${year}/${month}/${day}/${random}`;
  }
}
