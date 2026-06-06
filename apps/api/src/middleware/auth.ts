import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export const requireAuth = (_req: AuthRequest, _res: Response, next: NextFunction) => {
  // Placeholder — implemented fully in Phase 3
  next(ApiError.unauthorized('Authentication not yet configured'));
};
