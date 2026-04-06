import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from './schemas/client.schema';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

export interface ClientFilter {
  search?: string;
  includeInactive?: boolean;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,
  ) {}

  async create(
    dto: CreateClientDto,
    createdBy: string,
  ): Promise<ClientDocument> {
    const existing = await this.clientModel.findOne({
      nationalId: dto.nationalId,
    });
    if (existing) {
      throw new ConflictException(
        `Client with nationalId ${dto.nationalId} already exists`,
      );
    }

    const client = new this.clientModel({ ...dto, createdBy });
    return client.save();
  }

  async findAll(filter: ClientFilter = {}): Promise<ClientDocument[]> {
    const query: Record<string, unknown> = {};

    if (!filter.includeInactive) {
      query.isActive = true;
    }

    if (filter.search) {
      query.$text = { $search: filter.search };
    }

    return this.clientModel
      .find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<ClientDocument> {
    const client = await this.clientModel
      .findById(id)
      .populate('createdBy', 'name email role')
      .exec();

    if (!client || !client.isActive) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return client;
  }

  async findByNationalId(nationalId: string): Promise<ClientDocument | null> {
    return this.clientModel.findOne({ nationalId, isActive: true }).exec();
  }

  async update(id: string, dto: UpdateClientDto): Promise<ClientDocument> {
    const client = await this.clientModel
      .findOneAndUpdate(
        { _id: id, isActive: true },
        dto,
        { new: true, runValidators: true },
      )
      .populate('createdBy', 'name email role')
      .exec();

    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return client;
  }

  async deactivate(id: string): Promise<void> {
    const result = await this.clientModel
      .findOneAndUpdate({ _id: id, isActive: true }, { isActive: false })
      .exec();

    if (!result) {
      throw new NotFoundException(`Client ${id} not found`);
    }
  }
}
