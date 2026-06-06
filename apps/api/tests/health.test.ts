import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('GET /api/v1/health', () => {
  it('returns a healthy status payload', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.service).toBe('CareSync API');
    expect(res.body.data.version).toBe('0.1.0');
    expect(typeof res.body.data.timestamp).toBe('string');
  });
});

describe('unknown routes', () => {
  it('returns a 404 envelope', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
