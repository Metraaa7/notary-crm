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
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDocument } from './schemas/user.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.NOTARY)
  create(@Body() dto: CreateUserDto): Promise<UserDocument> {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(Role.NOTARY)
  findAll(): Promise<UserDocument[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.NOTARY)
  findOne(@Param('id') id: string): Promise<UserDocument> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.NOTARY)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.NOTARY)
  deactivate(@Param('id') id: string): Promise<void> {
    return this.usersService.deactivate(id);
  }
}
