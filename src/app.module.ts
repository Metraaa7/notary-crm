import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration, { AppConfig } from './config/configuration';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ServicesModule } from './services/services.module';
import { RegistryModule } from './registry/registry.module';
import { DocumentsModule } from './documents/documents.module';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => ({
        uri: config.get('mongodb.uri', { infer: true }),
      }),
    }),
    UsersModule,
    AuthModule,
    ClientsModule,
    ServicesModule,
    RegistryModule,
    DocumentsModule,
  ],
})
export class AppModule {}
