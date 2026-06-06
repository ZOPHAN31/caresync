import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { authService } from '../services/authService';

const app = createApp();
let accessToken: string;
let careTeamId: string;
let recipientId: string;

beforeAll(async () => {
  await prisma.$connect();
  // Use seed demo data
  const result = await authService.login({
    email: 'narrissa@caresync.demo',
    password: 'CareSync123!',
  });
  accessToken = result.tokens.accessToken;
  const memberships = await prisma.careTeamMember.findMany({
    where: { userId: result.user.id },
    include: { careTeam: { include: { recipient: true } } },
  });
  careTeamId = memberships[0].careTeamId;
  recipientId = memberships[0].careTeam.recipient!.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/v1/dashboard/:teamId', () => {
  it('returns dashboard data for authenticated member', async () => {
    const res = await request(app)
      .get(`/api/v1/dashboard/${careTeamId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.hasRecipient).toBe(true);
    expect(res.body.data.recipient.firstName).toBe('Robert');
    expect(res.body.data.medications).toBeDefined();
    expect(res.body.data.tasks).toBeDefined();
  });
});

describe('GET /api/v1/care-logs', () => {
  it('returns care logs for recipient', async () => {
    const res = await request(app)
      .get(`/api/v1/care-logs?recipientId=${recipientId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/v1/care-logs', () => {
  it('creates a care log entry', async () => {
    const res = await request(app)
      .post('/api/v1/care-logs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        recipientId,
        type: 'MEAL',
        mealDescription: 'Test meal',
        mealAmount: 'full',
        notes: 'Test note',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('MEAL');
    // Clean up
    await prisma.careLog.delete({ where: { id: res.body.data.id } });
  });
});

describe('GET /api/v1/medications', () => {
  it('returns medications for recipient', async () => {
    const res = await request(app)
      .get(`/api/v1/medications?recipientId=${recipientId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
