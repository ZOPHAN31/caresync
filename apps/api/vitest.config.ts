import { defineConfig } from 'vitest/config';
import { config as loadEnv } from 'dotenv';

// Load apps/api/.env so tests use the real database + secrets.
loadEnv();

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    // Long timeout: auth tests round-trip to the (remote) Supabase database.
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      DIRECT_URL: process.env.DIRECT_URL ?? '',
      REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
      JWT_SECRET: process.env.JWT_SECRET ?? 'test_jwt_secret_at_least_32_characters_long_000',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET ?? 'test_nextauth_secret_at_least_32_characters_0',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/server.ts'],
    },
  },
});
