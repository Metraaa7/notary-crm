import { IsOptional, IsString } from 'class-validator';

export class ConfirmServiceDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
