import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RegistryService } from './registry.service';
import { VerifyIdentityDto } from './dto/verify-identity.dto';
import { RegistryVerificationResult } from './interfaces/registry-response.interface';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('registry')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @Post('verify')
  @Roles(Role.NOTARY, Role.ASSISTANT)
  @HttpCode(HttpStatus.OK)
  verify(@Body() dto: VerifyIdentityDto): Promise<RegistryVerificationResult> {
    return this.registryService.verifyIdentity(
      dto.nationalId,
      dto.firstName,
      dto.lastName,
    );
  }
}
