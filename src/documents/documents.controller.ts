import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { DocumentDocument } from './schemas/document.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import type { RequestUser } from '../auth/strategies/jwt.strategy';
import { UsersService } from '../users/users.service';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Roles(Role.NOTARY)
  async generate(
    @Body() dto: GenerateDocumentDto,
    @CurrentUser() user: RequestUser,
  ): Promise<DocumentDocument> {
    let generatedByName = user.email;
    try {
      const notaryUser = await this.usersService.findById(user.userId);
      generatedByName = notaryUser.name;
    } catch {
      // fall back to email if user lookup fails
    }
    return this.documentsService.generate(dto, user.userId, generatedByName);
  }

  @Get()
  @Roles(Role.NOTARY, Role.ASSISTANT)
  findAll(): Promise<DocumentDocument[]> {
    return this.documentsService.findAll();
  }

  @Get('client/:clientId')
  @Roles(Role.NOTARY, Role.ASSISTANT)
  findAllByClient(
    @Param('clientId') clientId: string,
  ): Promise<DocumentDocument[]> {
    return this.documentsService.findAllByClient(clientId);
  }

  @Get(':id')
  @Roles(Role.NOTARY, Role.ASSISTANT)
  findOne(@Param('id') id: string): Promise<DocumentDocument> {
    return this.documentsService.findById(id);
  }

  @Patch(':id/finalize')
  @Roles(Role.NOTARY)
  @HttpCode(HttpStatus.OK)
  finalize(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<DocumentDocument> {
    return this.documentsService.finalize(id, user.userId, user);
  }

  @Get(':id/export/pdf')
  @Roles(Role.NOTARY, Role.ASSISTANT)
  async exportPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.documentsService.exportPdf(id);
    const document = await this.documentsService.findById(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${document.documentNumber.replace(/\//g, '-')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
