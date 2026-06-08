import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 'postgresql://fortifyci:fortifyci_password@localhost:5433/fortifyci_test?schema=public';
  process.env.LOG_LEVEL = 'silent';
  process.env.LOG_PRETTY = 'false';
});

afterAll(async () => {
});
