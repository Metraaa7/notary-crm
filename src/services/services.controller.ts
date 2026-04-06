import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ConfirmServiceDto } from './dto/confirm-service.dto';
import { ServiceDocument } from './schemas/service.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import type { RequestUser } from '../auth/strategies/jwt.strategy';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // POST /clients/:clientId/services
  @Post('clients/:clientId/services')
  @Roles(Role.NOTARY, Role.ASSISTANT)
  create(
    @Param('clientId') clientId: string,
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ServiceDocument> {
    return this.servicesService.create(
      { ...dto, clientId },
      user.userId,
    );
  }

  // GET /services
  @Get('services')
  @Roles(Role.NOTARY, Role.ASSISTANT)
  findAll(): Promise<ServiceDocument[]> {
    return this.servicesService.findAll();
  }

  // GET /clients/:clientId/services
  @Get('clients/:clientId/services')
  @Roles(Role.NOTARY, Role.ASSISTANT)
  findAllByClient(
    @Param('clientId') clientId: string,
  ): Promise<ServiceDocument[]> {
    return this.servicesService.findAllByClient(clientId);
  }

  // GET /services/:id
  @Get('services/:id')
  @Roles(Role.NOTARY, Role.ASSISTANT)
  findOne(@Param('id') id: string): Promise<ServiceDocument> {
    return this.servicesService.findById(id);
  }

  // PATCH /services/:id
  @Patch('services/:id')
  @Roles(Role.NOTARY, Role.ASSISTANT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceDocument> {
    return this.servicesService.update(id, dto);
  }

  // PATCH /services/:id/confirm  — NOTARY only
  @Patch('services/:id/confirm')
  @Roles(Role.NOTARY)
  @HttpCode(HttpStatus.OK)
  confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmServiceDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ServiceDocument> {
    return this.servicesService.confirm(id, user.userId, dto);
  }

  // PATCH /services/:id/cancel  — NOTARY only
  @Patch('services/:id/cancel')
  @Roles(Role.NOTARY)
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string): Promise<ServiceDocument> {
    return this.servicesService.cancel(id);
  }
}
