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
  SERVICE_PAYLOAD,
} from './helpers/setup';

describe('Services (e2e)', () => {
  let app: INestApplication;
  let notaryToken: string;
  let assistantToken: string;
  let clientId: string;

  beforeAll(async () => {
    app = await createApp();
    await clearCollections(app);
    await createUserDirect(app, NOTARY);
    await createUserDirect(app, ASSISTANT);

    const s = app.getHttpServer();
    notaryToken = await loginAs(s, NOTARY.email, NOTARY.password);
    assistantToken = await loginAs(s, ASSISTANT.email, ASSISTANT.password);

    // Create a client to attach services to
    const clientRes = await request(s)
      .post('/api/v1/clients')
      .set({ Authorization: `Bearer ${notaryToken}` })
      .send(CLIENT_PAYLOAD)
      .expect(201);
    clientId = clientRes.body.data._id;
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  // ─── POST /clients/:clientId/services ──────────────────────────────────────

  describe('POST /api/v1/clients/:clientId/services', () => {
    it('201: NOTARY creates service for client', async () => {
      const res = await request(server())
        .post(`/api/v1/clients/${clientId}/services`)
        .set(auth(notaryToken))
        .send(SERVICE_PAYLOAD)
        .expect(201);

      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.feeAmount).toBe(SERVICE_PAYLOAD.feeAmount);
      expect(res.body.data.type).toBe(SERVICE_PAYLOAD.type);
    });

    it('201: ASSISTANT can also create services', async () => {
      const res = await request(server())
        .post(`/api/v1/clients/${clientId}/services`)
        .set(auth(assistantToken))
        .send({ ...SERVICE_PAYLOAD, description: 'By assistant' })
        .expect(201);

      expect(res.body.data._id).toBeDefined();
    });

    it('404: unknown clientId', async () => {
      await request(server())
        .post('/api/v1/clients/000000000000000000000001/services')
        .set(auth(notaryToken))
        .send(SERVICE_PAYLOAD)
        .expect(404);
    });

    it('400: missing required fields', async () => {
      await request(server())
        .post(`/api/v1/clients/${clientId}/services`)
        .set(auth(notaryToken))
        .send({ type: 'DEED' })
        .expect(400);
    });

    it('400: invalid service type', async () => {
      await request(server())
        .post(`/api/v1/clients/${clientId}/services`)
        .set(auth(notaryToken))
        .send({ ...SERVICE_PAYLOAD, type: 'INVALID_TYPE' })
        .expect(400);
    });

    it('400: feeAmount must not be negative', async () => {
      await request(server())
        .post(`/api/v1/clients/${clientId}/services`)
        .set(auth(notaryToken))
        .send({ ...SERVICE_PAYLOAD, feeAmount: -100 })
        .expect(400);
    });
  });

  // ─── GET /services ─────────────────────────────────────────────────────────

  describe('GET /api/v1/services', () => {
    it('200: returns all services', async () => {
      const res = await request(server())
        .get('/api/v1/services')
        .set(auth(notaryToken))
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // ─── GET /clients/:clientId/services ───────────────────────────────────────

  describe('GET /api/v1/clients/:clientId/services', () => {
    it('200: returns services for specific client', async () => {
      const res = await request(server())
        .get(`/api/v1/clients/${clientId}/services`)
        .set(auth(notaryToken))
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((svc: any) => {
        const cid = typeof svc.client === 'object' ? svc.client._id : svc.client;
        expect(cid).toBe(clientId);
      });
    });

    it('200: returns empty array for client with no services', async () => {
      const newClientRes = await request(server())
        .post('/api/v1/clients')
        .set(auth(notaryToken))
        .send({ ...CLIENT_PAYLOAD, nationalId: 'no-svc-client-001' })
        .expect(201);

      const res = await request(server())
        .get(`/api/v1/clients/${newClientRes.body.data._id}/services`)
        .set(auth(notaryToken))
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });

    it('404: unknown clientId', async () => {
      await request(server())
        .get('/api/v1/clients/000000000000000000000001/services')
        .set(auth(notaryToken))
        .expect(404);
    });
  });

  // ─── GET /services/:id ─────────────────────────────────────────────────────

  describe('GET /api/v1/services/:id', () => {
    let serviceId: string;

    beforeAll(async () => {
      const res = await request(server())
        .get(`/api/v1/clients/${clientId}/services`)
        .set(auth(notaryToken))
        .expect(200);
      serviceId = res.body.data[0]._id;
    });

    it('200: returns service by id', async () => {
      const res = await request(server())
        .get(`/api/v1/services/${serviceId}`)
        .set(auth(notaryToken))
        .expect(200);

      expect(res.body.data._id).toBe(serviceId);
      expect(res.body.data.client).toBeDefined();
    });

    it('404: unknown service id', async () => {
      await request(server())
        .get('/api/v1/services/000000000000000000000001')
        .set(auth(notaryToken))
        .expect(404);
    });
  });

  // ─── PATCH /services/:id ───────────────────────────────────────────────────

  describe('PATCH /api/v1/services/:id', () => {
    let serviceId: string;

    beforeAll(async () => {
      const res = await request(server())
        .post(`/api/v1/clients/${clientId}/services`)
        .set(auth(notaryToken))
        .send({ ...SERVICE_PAYLOAD, description: 'To update' })
        .expect(201);
      serviceId = res.body.data._id;
    });

    it('200: updates description and fee', async () => {
      const res = await request(server())
        .patch(`/api/v1/services/${serviceId}`)
        .set(auth(notaryToken))
        .send({ description: 'Updated description', feeAmount: 75000 })
        .expect(200);

      expect(res.body.data.description).toBe('Updated description');
      expect(res.body.data.feeAmount).toBe(75000);
    });
  });

  // ─── PATCH /services/:id/confirm ───────────────────────────────────────────

  describe('PATCH /api/v1/services/:id/confirm', () => {
    let serviceId: string;

    beforeAll(async () => {
      const res = await request(server())
        .post(`/api/v1/clients/${clientId}/services`)
        .set(auth(notaryToken))
        .send({ ...SERVICE_PAYLOAD, description: 'To confirm' })
        .expect(201);
      serviceId = res.body.data._id;
    });

    it('403: ASSISTANT cannot confirm services', async () => {
      await request(server())
        .patch(`/api/v1/services/${serviceId}/confirm`)
        .set(auth(assistantToken))
        .send({})
        .expect(403);
    });

    it('200: NOTARY confirms service → COMPLETED', async () => {
      const res = await request(server())
        .patch(`/api/v1/services/${serviceId}/confirm`)
        .set(auth(notaryToken))
        .send({})
        .expect(200);

      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.confirmedAt).toBeDefined();
    });

    it('400: cannot confirm already COMPLETED service', async () => {
      await request(server())
        .patch(`/api/v1/services/${serviceId}/confirm`)
        .set(auth(notaryToken))
        .send({})
        .expect(400);
    });
  });

  // ─── PATCH /services/:id/cancel ────────────────────────────────────────────

  describe('PATCH /api/v1/services/:id/cancel', () => {
    let pendingId: string;
    let completedId: string;

    beforeAll(async () => {
      const [r1, r2] = await Promise.all([
        request(server())
          .post(`/api/v1/clients/${clientId}/services`)
          .set(auth(notaryToken))
          .send({ ...SERVICE_PAYLOAD, description: 'To cancel' })
          .expect(201),
        request(server())
          .post(`/api/v1/clients/${clientId}/services`)
          .set(auth(notaryToken))
          .send({ ...SERVICE_PAYLOAD, description: 'Completed to cancel' })
          .expect(201),
      ]);

      pendingId = r1.body.data._id;
      completedId = r2.body.data._id;

      // Confirm the second service
      await request(server())
        .patch(`/api/v1/services/${completedId}/confirm`)
        .set(auth(notaryToken))
        .send({})
        .expect(200);
    });

    it('403: ASSISTANT cannot cancel services', async () => {
      await request(server())
        .patch(`/api/v1/services/${pendingId}/cancel`)
        .set(auth(assistantToken))
        .expect(403);
    });

    it('200: NOTARY cancels PENDING service', async () => {
      const res = await request(server())
        .patch(`/api/v1/services/${pendingId}/cancel`)
        .set(auth(notaryToken))
        .expect(200);

      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('400: cannot cancel already CANCELLED service', async () => {
      await request(server())
        .patch(`/api/v1/services/${pendingId}/cancel`)
        .set(auth(notaryToken))
        .expect(400);
    });

    it('400: cannot cancel COMPLETED service', async () => {
      await request(server())
        .patch(`/api/v1/services/${completedId}/cancel`)
        .set(auth(notaryToken))
        .expect(400);
    });

    it('200: cancelled service cannot be updated', async () => {
      // PATCH update on cancelled/completed should return 404 (not found or cannot modify)
      await request(server())
        .patch(`/api/v1/services/${pendingId}`)
        .set(auth(notaryToken))
        .send({ description: 'Try to update cancelled' })
        .expect(404);
    });
  });
});
