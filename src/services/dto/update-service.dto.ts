import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';

export class UpdateServiceDto extends PartialType(
  OmitType(CreateServiceDto, ['clientId', 'type'] as const),
) {}
