import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { NotaryDocument, DocumentSchema } from './schemas/document.schema';
import { TextGenerator } from './generators/text.generator';
import { PdfGenerator } from './generators/pdf.generator';
import { ClientsModule } from '../clients/clients.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotaryDocument.name, schema: DocumentSchema },
    ]),
    ClientsModule,
    ServicesModule,
    UsersModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, TextGenerator, PdfGenerator],
})
export class DocumentsModule {}
