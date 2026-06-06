import 'dotenv/config';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './lib/prisma';
import { storageService } from './services/storageService';

const app = createApp();

async function bootstrap(): Promise<void> {
  await connectDatabase();

  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    await storageService.ensureBucketExists();
    logger.info('Storage bucket ready');
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`CareSync API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
