import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://caresync:caresync@localhost:5432/caresync_test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test_jwt_secret_at_least_32_characters_long_000',
      JWT_EXPIRES_IN: '7d',
      ALLOWED_ORIGINS: 'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/server.ts'],
    },
  },
});
