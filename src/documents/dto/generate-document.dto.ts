import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ArrayMinSize,
} from 'class-validator';

export class GenerateDocumentDto {
  @IsMongoId()
  clientId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  serviceIds: string[];

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
