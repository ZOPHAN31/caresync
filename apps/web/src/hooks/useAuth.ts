'use client';

import type { AuthUser } from '@/lib/auth';

interface UseAuthResult {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Returns the current user from session.
 * Placeholder until NextAuth is wired up in Phase 3.
 */
export function useAuth(): UseAuthResult {
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
  };
}
