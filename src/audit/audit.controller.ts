import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogDocument } from './schemas/audit-log.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.NOTARY, Role.ASSISTANT)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findByEntity(
    @Query('entity') entity: string,
    @Query('entityId') entityId: string,
  ): Promise<AuditLogDocument[]> {
    return this.auditService.findByEntity(entity, entityId);
  }
}
