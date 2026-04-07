import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createApp,
  clearCollections,
  createUserDirect,
  NOTARY,
} from './helpers/setup';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await clearCollections(app);
    await createUserDirect(app, NOTARY);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  // ─── POST /auth/login ──────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('200: returns accessToken + user on valid credentials', async () => {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: NOTARY.email, password: NOTARY.password })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(NOTARY.email);
      expect(res.body.data.user.role).toBe('NOTARY');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('401: wrong password', async () => {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: NOTARY.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.message).toBeDefined();
    });

    it('401: unknown email', async () => {
      await request(server())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'Test1234!' })
        .expect(401);
    });

    it('400: missing email', async () => {
      await request(server())
        .post('/api/v1/auth/login')
        .send({ password: NOTARY.password })
        .expect(400);
    });

    it('400: missing password', async () => {
      await request(server())
        .post('/api/v1/auth/login')
        .send({ email: NOTARY.email })
        .expect(400);
    });

    it('400: empty body', async () => {
      await request(server())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
    });
  });

  // ─── Protected routes without token → 401 ─────────────────────────────────

  describe('Protected routes (no token)', () => {
    const protectedRoutes = [
      ['GET', '/api/v1/clients'],
      ['GET', '/api/v1/services'],
      ['GET', '/api/v1/documents'],
      ['GET', '/api/v1/users'],
    ];

    it.each(protectedRoutes)('%s %s → 401', async (method, path) => {
      await (request(server()) as any)[method.toLowerCase()](path).expect(401);
    });
  });

  // ─── Invalid token ─────────────────────────────────────────────────────────

  it('401: forged / expired JWT', async () => {
    await request(server())
      .get('/api/v1/clients')
      .set('Authorization', 'Bearer this.is.not.a.valid.jwt')
      .expect(401);
  });
});
