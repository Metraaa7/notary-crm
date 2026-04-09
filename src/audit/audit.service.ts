import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface LogEntry {
  entity: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  changes?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  async log(entry: LogEntry): Promise<void> {
    await this.auditModel.create({
      entity: entry.entity,
      entityId: new Types.ObjectId(entry.entityId),
      action: entry.action,
      userId: new Types.ObjectId(entry.userId),
      userName: entry.userName,
      changes: entry.changes ?? {},
    });
  }

  async findByEntity(
    entity: string,
    entityId: string,
  ): Promise<AuditLogDocument[]> {
    return this.auditModel
      .find({ entity, entityId: new Types.ObjectId(entityId) })
      .sort({ timestamp: -1 })
      .exec();
  }
}
