import type { Request } from 'express';

/**
 * API-local types. Shared domain types live in `@caresync/types`.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export type { ApiResponse, PaginationMeta, PaginationParams } from '@caresync/types';
