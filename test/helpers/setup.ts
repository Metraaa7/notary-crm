import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import request from 'supertest';
import { Server } from 'http';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

export async function createApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.init();
  return app;
}

export async function clearCollections(app: INestApplication): Promise<void> {
  await Promise.all([
    app.get(getModelToken('User')).deleteMany({}),
    app.get(getModelToken('Client')).deleteMany({}),
    app.get(getModelToken('Service')).deleteMany({}),
    app.get(getModelToken('NotaryDocument')).deleteMany({}),
  ]);
}

/** Creates a user directly via the model — triggers pre-save password hash. */
export async function createUserDirect(
  app: INestApplication,
  data: { name: string; email: string; password: string; role: string },
): Promise<void> {
  await app.get(getModelToken('User')).create(data);
}

export async function loginAs(server: Server, email: string, password: string): Promise<string> {
  const res = await request(server)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);
  return res.body.data.accessToken as string;
}

// ─── Shared test fixtures ────────────────────────────────────────────────────

export const NOTARY = {
  name: 'Test Notary',
  email: 'notary@test.com',
  password: 'Test1234!',
  role: 'NOTARY',
};

export const ASSISTANT = {
  name: 'Test Assistant',
  email: 'assistant@test.com',
  password: 'Test1234!',
  role: 'ASSISTANT',
};

export const CLIENT_PAYLOAD = {
  firstName: 'Іван',
  lastName: 'Тестовий',
  nationalId: '1234567890',
  dateOfBirth: '1990-01-15',
  address: {
    street: 'вул. Тестова, 1',
    city: 'Київ',
    postalCode: '01001',
    country: 'Україна',
  },
  phone: '+380501234567',
};

export const SERVICE_PAYLOAD = {
  type: 'DEED',
  description: 'Посвідчення правочину',
  feeAmount: 50000,
  feeCurrency: 'UAH',
};
