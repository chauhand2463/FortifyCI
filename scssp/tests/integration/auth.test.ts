import { beforeAll, afterAll, describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:3000/api/v1';

describe('Auth Integration Tests', () => {
  let accessToken: string;
  let refreshToken: string;

  it('POST /auth/register - should register a new user', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        username: `testuser-${Date.now()}`,
        password: 'TestPass123!@#',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.user.email).toBeDefined();
  });

  it('POST /auth/login - should login with valid credentials', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@fortifyci.local',
        password: 'Admin123!@#',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();

    accessToken = body.data.accessToken;
    refreshToken = res.headers.get('set-cookie') || '';
  });

  it('GET /health - should return healthy status', async () => {
    const res = await fetch(`${BASE_URL.replace('/api/v1', '')}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('healthy');
  });

  it('GET /users/me - should return current user', async () => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.email).toBe('admin@fortifyci.local');
  });
});
