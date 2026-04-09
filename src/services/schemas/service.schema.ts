import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ServiceType } from '../enums/service-type.enum';
import { ServiceStatus } from '../enums/service-status.enum';

export type ServiceDocument = Service & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Service {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
  client: Types.ObjectId;

  @Prop({ type: String, enum: ServiceType, required: true })
  type: ServiceType;

  @Prop({
    type: String,
    enum: ServiceStatus,
    default: ServiceStatus.PENDING,
  })
  status: ServiceStatus;

  @Prop({ required: true, trim: true })
  description: string;

  // Fee stored in smallest currency unit (копійка = 1/100 UAH) to avoid float issues
  @Prop({ required: true, min: 0 })
  feeAmount: number;

  @Prop({ required: true, trim: true, default: 'UAH' })
  feeCurrency: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  // Scheduled appointment date/time (optional)
  @Prop({ type: Date, default: null })
  scheduledAt: Date | null;

  // Set when a NOTARY confirms the service
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  confirmedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  confirmedAt: Date | null;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// Compound index: most common query is "all services for a client"
ServiceSchema.index({ client: 1, status: 1 });
