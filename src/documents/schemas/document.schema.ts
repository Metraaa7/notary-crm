import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DocumentStatus } from '../enums/document-status.enum';
import { VerificationStatus } from '../../registry/interfaces/registry-response.interface';

export type DocumentDocument = NotaryDocument & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class NotaryDocument {
  @Prop({ required: true, unique: true, trim: true })
  documentNumber: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
  client: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Service' }], default: [] })
  services: Types.ObjectId[];

  @Prop({ required: true })
  content: string; // Rendered text content — source of truth for PDF generation

  @Prop({
    type: String,
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  @Prop({
    type: String,
    enum: VerificationStatus,
    default: null,
  })
  verificationStatus: VerificationStatus | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  generatedBy: Types.ObjectId;

  // Set when notary finalizes the document
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  finalizedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  finalizedAt: Date | null;
}

export const DocumentSchema = SchemaFactory.createForClass(NotaryDocument);

DocumentSchema.index({ client: 1, status: 1 });
