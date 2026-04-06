import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyIdentityDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 10, { message: 'nationalId must be exactly 10 characters (РНОКПП)' })
  nationalId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
