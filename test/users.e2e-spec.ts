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

describe('Users (e2e)', () => {
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

  // ─── POST /users ───────────────────────────────────────────────────────────

  describe('POST /api/v1/users', () => {
    it('201: NOTARY creates a new user', async () => {
      const res = await request(server())
        .post('/api/v1/users')
        .set(auth(notaryToken))
        .send({ name: 'New User', email: 'new@test.com', password: 'Pass1234!', role: 'ASSISTANT' })
        .expect(201);

      expect(res.body.data.email).toBe('new@test.com');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('409: duplicate email', async () => {
      await request(server())
        .post('/api/v1/users')
        .set(auth(notaryToken))
        .send({ name: 'Dup', email: NOTARY.email, password: 'Pass1234!', role: 'ASSISTANT' })
        .expect(409);
    });

    it('400: password too short', async () => {
      await request(server())
        .post('/api/v1/users')
        .set(auth(notaryToken))
        .send({ name: 'X', email: 'x@test.com', password: '123', role: 'ASSISTANT' })
        .expect(400);
    });

    it('400: invalid role', async () => {
      await request(server())
        .post('/api/v1/users')
        .set(auth(notaryToken))
        .send({ name: 'X', email: 'x2@test.com', password: 'Pass1234!', role: 'SUPERADMIN' })
        .expect(400);
    });

    it('403: ASSISTANT cannot create users', async () => {
      await request(server())
        .post('/api/v1/users')
        .set(auth(assistantToken))
        .send({ name: 'X', email: 'x3@test.com', password: 'Pass1234!', role: 'ASSISTANT' })
        .expect(403);
    });
  });

  // ─── GET /users ────────────────────────────────────────────────────────────

  describe('GET /api/v1/users', () => {
    it('200: returns list of active users', async () => {
      const res = await request(server())
        .get('/api/v1/users')
        .set(auth(notaryToken))
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      res.body.data.forEach((u: any) => expect(u).not.toHaveProperty('password'));
    });

    it('403: ASSISTANT cannot list users', async () => {
      await request(server())
        .get('/api/v1/users')
        .set(auth(assistantToken))
        .expect(403);
    });
  });

  // ─── GET /users/:id ────────────────────────────────────────────────────────

  describe('GET /api/v1/users/:id', () => {
    let userId: string;

    beforeAll(async () => {
      const res = await request(server())
        .get('/api/v1/users')
        .set(auth(notaryToken))
        .expect(200);
      userId = res.body.data[0]._id;
    });

    it('200: returns user by id', async () => {
      const res = await request(server())
        .get(`/api/v1/users/${userId}`)
        .set(auth(notaryToken))
        .expect(200);

      expect(res.body.data._id).toBe(userId);
    });

    it('404: unknown id', async () => {
      await request(server())
        .get('/api/v1/users/000000000000000000000001')
        .set(auth(notaryToken))
        .expect(404);
    });
  });

  // ─── PATCH /users/:id ──────────────────────────────────────────────────────

  describe('PATCH /api/v1/users/:id', () => {
    let userId: string;

    beforeAll(async () => {
      const res = await request(server())
        .post('/api/v1/users')
        .set(auth(notaryToken))
        .send({ name: 'To Update', email: 'update@test.com', password: 'Pass1234!', role: 'ASSISTANT' })
        .expect(201);
      userId = res.body.data._id;
    });

    it('200: updates user name', async () => {
      const res = await request(server())
        .patch(`/api/v1/users/${userId}`)
        .set(auth(notaryToken))
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated Name');
    });
  });

  // ─── DELETE /users/:id ─────────────────────────────────────────────────────

  describe('DELETE /api/v1/users/:id', () => {
    let userId: string;

    beforeAll(async () => {
      const res = await request(server())
        .post('/api/v1/users')
        .set(auth(notaryToken))
        .send({ name: 'To Delete', email: 'delete@test.com', password: 'Pass1234!', role: 'ASSISTANT' })
        .expect(201);
      userId = res.body.data._id;
    });

    it('204: deactivates user', async () => {
      await request(server())
        .delete(`/api/v1/users/${userId}`)
        .set(auth(notaryToken))
        .expect(204);
    });

    it('404: deactivated user not found', async () => {
      await request(server())
        .get(`/api/v1/users/${userId}`)
        .set(auth(notaryToken))
        .expect(404);
    });
  });
});
