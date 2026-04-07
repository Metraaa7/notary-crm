import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createApp,
  clearCollections,
  createUserDirect,
  loginAs,
  NOTARY,
  ASSISTANT,
} from './helpers/setup';

describe('Registry (e2e)', () => {
  let app: INestApplication;
  let notaryToken: string;
  let assistantToken: string;

  beforeAll(async () => {
    app = await createApp();
    await clearCollections(app);
    await createUserDirect(app, NOTARY);
    await createUserDirect(app, ASSISTANT);

    const s = app.getHttpServer();
    notaryToken = await loginAs(s, NOTARY.email, NOTARY.password);
    assistantToken = await loginAs(s, ASSISTANT.email, ASSISTANT.password);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  // ─── POST /registry/verify ─────────────────────────────────────────────────

  describe('POST /api/v1/registry/verify', () => {
    it('200: VERIFIED — known nationalId with correct name', async () => {
      const res = await request(server())
        .post('/api/v1/registry/verify')
        .set(auth(notaryToken))
        .send({ nationalId: '9001011234', firstName: 'Іван', lastName: 'Коваленко' })
        .expect(200);

      expect(res.body.data.status).toBe('VERIFIED');
      expect(res.body.data.nationalId).toBe('9001011234');
      expect(res.body.data.data.firstName).toBe('Іван');
    });

    it('200: MISMATCH — correct nationalId but wrong name', async () => {
      const res = await request(server())
        .post('/api/v1/registry/verify')
        .set(auth(notaryToken))
        .send({ nationalId: '9001011234', firstName: 'Петро', lastName: 'Неправильний' })
        .expect(200);

      expect(res.body.data.status).toBe('MISMATCH');
    });

    it('200: NOT_FOUND — unknown nationalId', async () => {
      const res = await request(server())
        .post('/api/v1/registry/verify')
        .set(auth(notaryToken))
        .send({ nationalId: '1111111111', firstName: 'Хтось', lastName: 'Невідомий' })
        .expect(200);

      expect(res.body.data.status).toBe('NOT_FOUND');
    });

    it('200: UNAVAILABLE — special nationalId simulates outage', async () => {
      const res = await request(server())
        .post('/api/v1/registry/verify')
        .set(auth(notaryToken))
        .send({ nationalId: '0000000000', firstName: 'X', lastName: 'Y' })
        .expect(200);

      expect(res.body.data.status).toBe('UNAVAILABLE');
    });

    it('200: ASSISTANT can also verify', async () => {
      const res = await request(server())
        .post('/api/v1/registry/verify')
        .set(auth(assistantToken))
        .send({ nationalId: '8505156789', firstName: 'Анна', lastName: 'Петренко' })
        .expect(200);

      expect(res.body.data.status).toBe('VERIFIED');
    });

    it('400: missing nationalId', async () => {
      await request(server())
        .post('/api/v1/registry/verify')
        .set(auth(notaryToken))
        .send({ firstName: 'Іван', lastName: 'Коваленко' })
        .expect(400);
    });

    it('400: missing firstName', async () => {
      await request(server())
        .post('/api/v1/registry/verify')
        .set(auth(notaryToken))
        .send({ nationalId: '9001011234', lastName: 'Коваленко' })
        .expect(400);
    });

    it('401: unauthenticated request', async () => {
      await request(server())
        .post('/api/v1/registry/verify')
        .send({ nationalId: '9001011234', firstName: 'Іван', lastName: 'Коваленко' })
        .expect(401);
    });
  });
});
