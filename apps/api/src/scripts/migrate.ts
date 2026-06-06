import { execSync } from 'node:child_process';

/**
 * Applies committed Prisma migrations to the production database.
 *
 * `prisma migrate deploy` only applies existing migration files — it never
 * generates new ones or prompts — so it is safe to run in a deploy pipeline
 * (e.g. a Railway release command or a one-off `pnpm --filter @caresync/api
 * migrate:prod`). It uses DIRECT_URL for the connection.
 */
function main(): void {
  console.log('Running prisma migrate deploy...');
  execSync('prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migrations applied.');
}

main();
