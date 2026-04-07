import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientDocument } from './schemas/client.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import type { RequestUser } from '../auth/strategies/jwt.strategy';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(Role.NOTARY, Role.ASSISTANT)
  create(
    @Body() dto: CreateClientDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ClientDocument> {
    return this.clientsService.create(dto, user.userId);
  }

  @Get()
  @Roles(Role.NOTARY, Role.ASSISTANT)
  findAll(
    @Query('search') search?: string,
    @Query('nationalId') nationalId?: string,
    @Query('city') city?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ClientDocument[]> {
    return this.clientsService.findAll({
      search,
      nationalId,
      city,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':id')
  @Roles(Role.NOTARY, Role.ASSISTANT)
  findOne(@Param('id') id: string): Promise<ClientDocument> {
    return this.clientsService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.NOTARY, Role.ASSISTANT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientDocument> {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.NOTARY)
  deactivate(@Param('id') id: string): Promise<void> {
    return this.clientsService.deactivate(id);
  }
}
