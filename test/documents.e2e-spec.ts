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

describe('Documents (e2e)', () => {
  let app: INestApplication;
  let notaryToken: string;
  let assistantToken: string;

  // Shared state for the "full flow" tests
  let clientId: string;
  let clientId2: string;
  let completedServiceId: string;
  let pendingServiceId: string;
  let serviceFromClient2: string;

  beforeAll(async () => {
    app = await createApp();
    await clearCollections(app);
    await createUserDirect(app, NOTARY);
    await createUserDirect(app, ASSISTANT);

    const s = app.getHttpServer();
    notaryToken = await loginAs(s, NOTARY.email, NOTARY.password);
    assistantToken = await loginAs(s, ASSISTANT.email, ASSISTANT.password);

    const hdr = { Authorization: `Bearer ${notaryToken}` };

    // Create two clients
    const [c1Res, c2Res] = await Promise.all([
      request(s).post('/api/v1/clients').set(hdr).send(CLIENT_PAYLOAD).expect(201),
      request(s).post('/api/v1/clients').set(hdr).send({ ...CLIENT_PAYLOAD, nationalId: 'doc-client-002' }).expect(201),
    ]);
    clientId = c1Res.body.data._id;
    clientId2 = c2Res.body.data._id;

    // Create services on client 1
    const [svc1Res, svc2Res] = await Promise.all([
      request(s).post(`/api/v1/clients/${clientId}/services`).set(hdr).send(SERVICE_PAYLOAD).expect(201),
      request(s).post(`/api/v1/clients/${clientId}/services`).set(hdr).send({ ...SERVICE_PAYLOAD, description: 'Pending service' }).expect(201),
    ]);

    completedServiceId = svc1Res.body.data._id;
    pendingServiceId = svc2Res.body.data._id;

    // Create service on client 2
    const svc3Res = await request(s)
      .post(`/api/v1/clients/${clientId2}/services`)
      .set(hdr)
      .send(SERVICE_PAYLOAD)
      .expect(201);
    serviceFromClient2 = svc3Res.body.data._id;

    // Confirm service on client 1 and client 2
    await Promise.all([
      request(s).patch(`/api/v1/services/${completedServiceId}/confirm`).set(hdr).send({}).expect(200),
      request(s).patch(`/api/v1/services/${serviceFromClient2}/confirm`).set(hdr).send({}).expect(200),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  // ─── POST /documents ───────────────────────────────────────────────────────

  describe('POST /api/v1/documents', () => {
    it('403: ASSISTANT cannot generate documents', async () => {
      await request(server())
        .post('/api/v1/documents')
        .set(auth(assistantToken))
        .send({ clientId, serviceIds: [completedServiceId], title: 'Test Doc' })
        .expect(403);
    });

    it('400: cannot generate with PENDING service', async () => {
      const res = await request(server())
        .post('/api/v1/documents')
        .set(auth(notaryToken))
        .send({ clientId, serviceIds: [pendingServiceId], title: 'Should fail' })
        .expect(400);

      expect(res.body.message).toBeDefined();
    });

    it('400: services from different client', async () => {
      await request(server())
        .post('/api/v1/documents')
        .set(auth(notaryToken))
        .send({ clientId, serviceIds: [serviceFromClient2], title: 'Should fail' })
        .expect(400);
    });

    it('400: serviceIds array must not be empty', async () => {
      await request(server())
        .post('/api/v1/documents')
        .set(auth(notaryToken))
        .send({ clientId, serviceIds: [], title: 'Should fail' })
        .expect(400);
    });

    it('400: missing title', async () => {
      await request(server())
        .post('/api/v1/documents')
        .set(auth(notaryToken))
        .send({ clientId, serviceIds: [completedServiceId] })
        .expect(400);
    });

    it('201: NOTARY generates document with COMPLETED service', async () => {
      const res = await request(server())
        .post('/api/v1/documents')
        .set(auth(notaryToken))
        .send({ clientId, serviceIds: [completedServiceId], title: 'Нотаріальний акт' })
        .expect(201);

      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.documentNumber).toMatch(/^NOT\//);
      expect(res.body.data.title).toBe('Нотаріальний акт');
      expect(res.body.data.content).toBeDefined();
    });
  });

  // ─── GET /documents ────────────────────────────────────────────────────────

  describe('GET /api/v1/documents', () => {
    it('200: returns all documents', async () => {
      const res = await request(server())
        .get('/api/v1/documents')
        .set(auth(notaryToken))
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('200: ASSISTANT can list documents', async () => {
      await request(server())
        .get('/api/v1/documents')
        .set(auth(assistantToken))
        .expect(200);
    });
  });

  // ─── GET /documents/client/:clientId ───────────────────────────────────────

  describe('GET /api/v1/documents/client/:clientId', () => {
    it('200: returns documents for specific client', async () => {
      const res = await request(server())
        .get(`/api/v1/documents/client/${clientId}`)
        .set(auth(notaryToken))
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('200: returns empty array for client with no documents', async () => {
      // client2 had its service confirmed but no document generated
      const res = await request(server())
        .get(`/api/v1/documents/client/${clientId2}`)
        .set(auth(notaryToken))
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('404: unknown clientId', async () => {
      await request(server())
        .get('/api/v1/documents/client/000000000000000000000001')
        .set(auth(notaryToken))
        .expect(404);
    });
  });

  // ─── GET /documents/:id ────────────────────────────────────────────────────

  describe('GET /api/v1/documents/:id', () => {
    let documentId: string;

    beforeAll(async () => {
      const res = await request(server())
        .get('/api/v1/documents')
        .set(auth(notaryToken))
        .expect(200);
      documentId = res.body.data[0]._id;
    });

    it('200: returns document by id with populated client and services', async () => {
      const res = await request(server())
        .get(`/api/v1/documents/${documentId}`)
        .set(auth(notaryToken))
        .expect(200);

      expect(res.body.data._id).toBe(documentId);
      expect(typeof res.body.data.client).toBe('object');
      expect(Array.isArray(res.body.data.services)).toBe(true);
    });

    it('404: unknown document id', async () => {
      await request(server())
        .get('/api/v1/documents/000000000000000000000001')
        .set(auth(notaryToken))
        .expect(404);
    });
  });

  // ─── PATCH /documents/:id/finalize ─────────────────────────────────────────

  describe('PATCH /api/v1/documents/:id/finalize', () => {
    let documentId: string;

    beforeAll(async () => {
      // Create a fresh service + document for finalize tests
      const hdr = { Authorization: `Bearer ${notaryToken}` };

      const newClientRes = await request(server())
        .post('/api/v1/clients')
        .set(hdr)
        .send({ ...CLIENT_PAYLOAD, nationalId: 'finalize-client-001' })
        .expect(201);
      const newClientId = newClientRes.body.data._id;

      const svcRes = await request(server())
        .post(`/api/v1/clients/${newClientId}/services`)
        .set(hdr)
        .send(SERVICE_PAYLOAD)
        .expect(201);

      await request(server())
        .patch(`/api/v1/services/${svcRes.body.data._id}/confirm`)
        .set(hdr)
        .send({})
        .expect(200);

      const docRes = await request(server())
        .post('/api/v1/documents')
        .set(hdr)
        .send({ clientId: newClientId, serviceIds: [svcRes.body.data._id], title: 'To finalize' })
        .expect(201);

      documentId = docRes.body.data._id;
    });

    it('403: ASSISTANT cannot finalize', async () => {
      await request(server())
        .patch(`/api/v1/documents/${documentId}/finalize`)
        .set(auth(assistantToken))
        .expect(403);
    });

    it('200: NOTARY finalizes document', async () => {
      const res = await request(server())
        .patch(`/api/v1/documents/${documentId}/finalize`)
        .set(auth(notaryToken))
        .expect(200);

      expect(res.body.data.status).toBe('FINAL');
      expect(res.body.data.finalizedAt).toBeDefined();
    });

    it('400: cannot finalize already finalized document', async () => {
      await request(server())
        .patch(`/api/v1/documents/${documentId}/finalize`)
        .set(auth(notaryToken))
        .expect(400);
    });
  });

  // ─── GET /documents/:id/export/pdf ─────────────────────────────────────────

  describe('GET /api/v1/documents/:id/export/pdf', () => {
    let documentId: string;

    beforeAll(async () => {
      const hdr = { Authorization: `Bearer ${notaryToken}` };

      const newClientRes = await request(server())
        .post('/api/v1/clients')
        .set(hdr)
        .send({ ...CLIENT_PAYLOAD, nationalId: 'pdf-client-001' })
        .expect(201);
      const newClientId = newClientRes.body.data._id;

      const svcRes = await request(server())
        .post(`/api/v1/clients/${newClientId}/services`)
        .set(hdr)
        .send(SERVICE_PAYLOAD)
        .expect(201);

      await request(server())
        .patch(`/api/v1/services/${svcRes.body.data._id}/confirm`)
        .set(hdr)
        .send({})
        .expect(200);

      const docRes = await request(server())
        .post('/api/v1/documents')
        .set(hdr)
        .send({ clientId: newClientId, serviceIds: [svcRes.body.data._id], title: 'PDF Test' })
        .expect(201);

      documentId = docRes.body.data._id;
    });

    it('200: returns PDF binary (DRAFT document)', async () => {
      const res = await request(server())
        .get(`/api/v1/documents/${documentId}/export/pdf`)
        .set(auth(notaryToken))
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/pdf/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      // PDF starts with %PDF
      expect((res.body as Buffer).slice(0, 4).toString()).toBe('%PDF');
    });

    it('200: ASSISTANT can also export PDF', async () => {
      const res = await request(server())
        .get(`/api/v1/documents/${documentId}/export/pdf`)
        .set(auth(assistantToken))
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });

    it('404: export PDF for nonexistent document', async () => {
      await request(server())
        .get('/api/v1/documents/000000000000000000000001/export/pdf')
        .set(auth(notaryToken))
        .expect(404);
    });
  });
});
