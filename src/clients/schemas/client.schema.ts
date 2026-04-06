import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ _id: false })
class Address {
  @Prop({ required: true, trim: true })
  street: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  postalCode: string;

  @Prop({ required: true, trim: true, default: 'Україна' })
  country: string;
}

const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret['__v'];
      return ret;
    },
  },
})
export class Client {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  nationalId: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ required: true, type: AddressSchema })
  address: Address;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: false, lowercase: true, trim: true })
  email?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

// Compound text index for search by name
ClientSchema.index({ firstName: 'text', lastName: 'text' });
