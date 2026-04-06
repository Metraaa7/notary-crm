import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ServiceType } from '../enums/service-type.enum';

export class CreateServiceDto {
  @IsMongoId()
  clientId: string;

  @IsEnum(ServiceType)
  type: ServiceType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @Min(0)
  feeAmount: number;

  @IsString()
  @IsOptional()
  feeCurrency?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
