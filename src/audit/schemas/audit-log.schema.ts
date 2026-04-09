import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({
  timestamps: false,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class AuditLog {
  @Prop({ required: true, index: true })
  entity: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  entityId: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userName: string;

  @Prop({ type: Date, default: () => new Date() })
  timestamp: Date;

  @Prop({ type: Object, default: {} })
  changes: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });
