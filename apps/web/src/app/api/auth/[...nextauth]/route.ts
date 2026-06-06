import { NextResponse } from 'next/server';

/**
 * NextAuth route placeholder.
 *
 * Full authentication (credentials + Google provider) is wired up in
 * Phase 3 with `next-auth`. Until then these handlers return a clear
 * "not configured" response so the route exists and the app builds.
 */
function notConfigured() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Authentication is not configured yet (arrives in Phase 3).',
        code: 'AUTH_NOT_CONFIGURED',
      },
    },
    { status: 501 }
  );
}

export async function GET() {
  return notConfigured();
}

export async function POST() {
  return notConfigured();
}
