import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { ClientsService } from '../clients/clients.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ConfirmServiceDto } from './dto/confirm-service.dto';
import { ServiceStatus } from './enums/service-status.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly clientsService: ClientsService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateServiceDto,
    createdBy: string,
    actor?: { userId: string; email: string },
  ): Promise<ServiceDocument> {
    // Verify client exists before linking
    await this.clientsService.findById(dto.clientId);

    const service = new this.serviceModel({
      client: new Types.ObjectId(dto.clientId),
      type: dto.type,
      description: dto.description,
      feeAmount: dto.feeAmount,
      feeCurrency: dto.feeCurrency ?? 'UAH',
      notes: dto.notes,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      createdBy: new Types.ObjectId(createdBy),
    });

    const saved = await service.save();

    if (actor) {
      void this.auditService.log({
        entity: 'service',
        entityId: String(saved._id),
        action: 'CREATE',
        userId: actor.userId,
        userName: actor.email,
        changes: { type: dto.type, clientId: dto.clientId },
      });
    }

    return saved;
  }

  async getCalendar(from: string, to: string): Promise<ServiceDocument[]> {
    return this.serviceModel
      .find({
        scheduledAt: {
          $gte: new Date(from),
          $lte: new Date(to),
        },
      })
      .populate('client', 'firstName lastName')
      .populate('createdBy', 'name email role')
      .sort({ scheduledAt: 1 })
      .exec();
  }

  async findAll(): Promise<ServiceDocument[]> {
    return this.serviceModel
      .find({})
      .populate('client', 'firstName lastName')
      .populate('createdBy', 'name email role')
      .populate('confirmedBy', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllByClient(clientId: string): Promise<ServiceDocument[]> {
    // Verify client exists
    await this.clientsService.findById(clientId);

    return this.serviceModel
      .find({ client: new Types.ObjectId(clientId) })
      .populate('createdBy', 'name email role')
      .populate('confirmedBy', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<ServiceDocument> {
    const service = await this.serviceModel
      .findById(id)
      .populate('client')
      .populate('createdBy', 'name email role')
      .populate('confirmedBy', 'name email role')
      .exec();

    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }
    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<ServiceDocument> {
    const service = await this.serviceModel
      .findOneAndUpdate(
        { _id: id, status: { $nin: [ServiceStatus.COMPLETED, ServiceStatus.CANCELLED] } },
        dto,
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!service) {
      throw new NotFoundException(
        `Service ${id} not found or cannot be modified in its current status`,
      );
    }
    return service;
  }

  async confirm(
    id: string,
    confirmedBy: string,
    dto: ConfirmServiceDto,
    actor?: { userId: string; email: string },
  ): Promise<ServiceDocument> {
    const service = await this.serviceModel.findById(id).exec();

    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }

    const confirmableStatuses = [ServiceStatus.PENDING, ServiceStatus.IN_PROGRESS];
    if (!confirmableStatuses.includes(service.status)) {
      throw new BadRequestException(
        `Cannot confirm a service with status '${service.status}'`,
      );
    }

    service.status = ServiceStatus.COMPLETED;
    service.confirmedBy = new Types.ObjectId(confirmedBy) as unknown as typeof service.confirmedBy;
    service.confirmedAt = new Date();
    if (dto.notes) service.notes = dto.notes;

    const saved = await service.save();

    if (actor) {
      void this.auditService.log({
        entity: 'service',
        entityId: id,
        action: 'CONFIRM',
        userId: actor.userId,
        userName: actor.email,
        changes: { status: ServiceStatus.COMPLETED },
      });
    }

    return saved;
  }

  async cancel(
    id: string,
    actor?: { userId: string; email: string },
  ): Promise<ServiceDocument> {
    const service = await this.serviceModel.findById(id).exec();

    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }

    if (service.status === ServiceStatus.COMPLETED) {
      throw new BadRequestException('A completed service cannot be cancelled');
    }

    if (service.status === ServiceStatus.CANCELLED) {
      throw new BadRequestException('Service is already cancelled');
    }

    service.status = ServiceStatus.CANCELLED;
    const saved = await service.save();

    if (actor) {
      void this.auditService.log({
        entity: 'service',
        entityId: id,
        action: 'CANCEL',
        userId: actor.userId,
        userName: actor.email,
        changes: { status: ServiceStatus.CANCELLED },
      });
    }

    return saved;
  }
}
