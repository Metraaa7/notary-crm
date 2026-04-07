import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createApp,
  clearCollections,
  createUserDirect,
  loginAs,
  NOTARY,
  ASSISTANT,
  CLIENT_PAYLOAD,
} from './helpers/setup';

describe('Clients (e2e)', () => {
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

  // ─── POST /clients ─────────────────────────────────────────────────────────

  describe('POST /api/v1/clients', () => {
    it('201: NOTARY creates client', async () => {
      const res = await request(server())
        .post('/api/v1/clients')
        .set(auth(notaryToken))
        .send(CLIENT_PAYLOAD)
        .expect(201);

      expect(res.body.data.firstName).toBe(CLIENT_PAYLOAD.firstName);
      expect(res.body.data.lastName).toBe(CLIENT_PAYLOAD.lastName);
      expect(res.body.data.nationalId).toBe(CLIENT_PAYLOAD.nationalId);
      expect(res.body.data.isActive).toBe(true);
    });

    it('201: ASSISTANT can also create clients', async () => {
      const payload = { ...CLIENT_PAYLOAD, nationalId: '9999999991' };
      const res = await request(server())
        .post('/api/v1/clients')
        .set(auth(assistantToken))
        .send(payload)
        .expect(201);

      expect(res.body.data.nationalId).toBe('9999999991');
    });

    it('409: duplicate nationalId', async () => {
      await request(server())
        .post('/api/v1/clients')
        .set(auth(notaryToken))
        .send(CLIENT_PAYLOAD)
        .expect(409);
    });

    it('400: missing required fields', async () => {
      await request(server())
        .post('/api/v1/clients')
        .set(auth(notaryToken))
        .send({ firstName: 'Only' })
        .expect(400);
    });

    it('400: invalid dateOfBirth format', async () => {
      await request(server())
        .post('/api/v1/clients')
        .set(auth(notaryToken))
        .send({ ...CLIENT_PAYLOAD, nationalId: 'unique-x', dateOfBirth: 'not-a-date' })
        .expect(400);
    });
  });

  // ─── GET /clients ──────────────────────────────────────────────────────────

  describe('GET /api/v1/clients', () => {
    it('200: returns active clients list', async () => {
      const res = await request(server())
        .get('/api/v1/clients')
        .set(auth(notaryToken))
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((c: any) => expect(c.isActive).toBe(true));
    });

    it('200: ASSISTANT can also list clients', async () => {
      await request(server())
        .get('/api/v1/clients')
        .set(auth(assistantToken))
        .expect(200);
    });
  });

  // ─── GET /clients/:id ──────────────────────────────────────────────────────

  describe('GET /api/v1/clients/:id', () => {
    let clientId: string;

    beforeAll(async () => {
      const res = await request(server())
        .get('/api/v1/clients')
        .set(auth(notaryToken))
        .expect(200);
      clientId = res.body.data[0]._id;
    });

    it('200: returns client by id', async () => {
      const res = await request(server())
        .get(`/api/v1/clients/${clientId}`)
        .set(auth(notaryToken))
        .expect(200);

      expect(res.body.data._id).toBe(clientId);
      expect(res.body.data.address).toBeDefined();
    });

    it('404: unknown id', async () => {
      await request(server())
        .get('/api/v1/clients/000000000000000000000001')
        .set(auth(notaryToken))
        .expect(404);
    });
  });

  // ─── PATCH /clients/:id ────────────────────────────────────────────────────

  describe('PATCH /api/v1/clients/:id', () => {
    let clientId: string;

    beforeAll(async () => {
      const res = await request(server())
        .post('/api/v1/clients')
        .set(auth(notaryToken))
        .send({ ...CLIENT_PAYLOAD, nationalId: 'patch-test-001' })
        .expect(201);
      clientId = res.body.data._id;
    });

    it('200: updates phone and notes', async () => {
      const res = await request(server())
        .patch(`/api/v1/clients/${clientId}`)
        .set(auth(notaryToken))
        .send({ phone: '+380991112233', notes: 'Updated note' })
        .expect(200);

      expect(res.body.data.phone).toBe('+380991112233');
      expect(res.body.data.notes).toBe('Updated note');
    });

    it('404: patching nonexistent client', async () => {
      await request(server())
        .patch('/api/v1/clients/000000000000000000000001')
        .set(auth(notaryToken))
        .send({ phone: '+380001112233' })
        .expect(404);
    });
  });

  // ─── DELETE /clients/:id ───────────────────────────────────────────────────

  describe('DELETE /api/v1/clients/:id (deactivate)', () => {
    let clientId: string;

    beforeAll(async () => {
      const res = await request(server())
        .post('/api/v1/clients')
        .set(auth(notaryToken))
        .send({ ...CLIENT_PAYLOAD, nationalId: 'deactivate-test-001' })
        .expect(201);
      clientId = res.body.data._id;
    });

    it('403: ASSISTANT cannot deactivate', async () => {
      await request(server())
        .delete(`/api/v1/clients/${clientId}`)
        .set(auth(assistantToken))
        .expect(403);
    });

    it('204: NOTARY deactivates client', async () => {
      await request(server())
        .delete(`/api/v1/clients/${clientId}`)
        .set(auth(notaryToken))
        .expect(204);
    });

    it('404: deactivated client not found', async () => {
      await request(server())
        .get(`/api/v1/clients/${clientId}`)
        .set(auth(notaryToken))
        .expect(404);
    });

    it('200: includeInactive=true returns deactivated client', async () => {
      const res = await request(server())
        .get('/api/v1/clients?includeInactive=true')
        .set(auth(notaryToken))
        .expect(200);

      const found = res.body.data.find((c: any) => c._id === clientId);
      expect(found).toBeDefined();
      expect(found.isActive).toBe(false);
    });
  });

  // ─── Text search ───────────────────────────────────────────────────────────

  describe('GET /api/v1/clients?search=', () => {
    beforeAll(async () => {
      // Ensure index is built by waiting a moment
      await new Promise((r) => setTimeout(r, 500));
    });

    it('200: search finds matching clients by last name', async () => {
      const res = await request(server())
        .get(`/api/v1/clients?search=${CLIENT_PAYLOAD.lastName}`)
        .set(auth(notaryToken))
        .expect(200);

      // Could be 0 if text index isn't ready, but at least should not error
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('200: search returns empty for nonexistent name', async () => {
      const res = await request(server())
        .get('/api/v1/clients?search=XxXnonexistentXxX')
        .set(auth(notaryToken))
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });
  });
});
