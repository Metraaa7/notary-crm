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
  nationalId?: string;
  city?: string;
  includeInactive?: boolean;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    // Build $and conditions for each active filter
    const conditions: Record<string, unknown>[] = [];

    if (filter.search?.trim()) {
      // Split into words so "Петро Гончаренко" matches across firstName + lastName
      const words = filter.search.trim().split(/\s+/);
      for (const word of words) {
        const r = { $regex: escapeRegex(word), $options: 'i' };
        conditions.push({ $or: [{ firstName: r }, { lastName: r }] });
      }
    }

    if (filter.nationalId?.trim()) {
      conditions.push({
        nationalId: { $regex: escapeRegex(filter.nationalId.trim()), $options: 'i' },
      });
    }

    if (filter.city?.trim()) {
      conditions.push({
        'address.city': { $regex: escapeRegex(filter.city.trim()), $options: 'i' },
      });
    }

    if (conditions.length > 0) {
      query.$and = conditions;
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
        { returnDocument: 'after', runValidators: true },
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
