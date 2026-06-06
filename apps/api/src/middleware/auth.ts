import { Request, Response, NextFunction } from 'express';
import { jwtUtils } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Extract and verify JWT from Authorization header
export const requireAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No authentication token provided', 'NO_TOKEN');
    }

    const token = authHeader.slice(7);

    // Try verifying as our own JWT first
    try {
      const payload = jwtUtils.verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      };
      return next();
    } catch {
      // Fall through to try NextAuth token
    }

    // Try as NextAuth token (for requests from Next.js frontend)
    const nextAuthPayload = jwtUtils.verifyNextAuthToken(token);
    if (nextAuthPayload) {
      req.user = {
        id: nextAuthPayload.sub,
        email: nextAuthPayload.email,
        firstName: nextAuthPayload.firstName,
        lastName: nextAuthPayload.lastName,
      };
      return next();
    }

    throw ApiError.unauthorized('Invalid or expired token', 'INVALID_TOKEN');
  } catch (err) {
    next(err);
  }
};

// Require user to be a member of a specific care team
export const requireCareTeamMember =
  (paramName = 'teamId') =>
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized('Not authenticated', 'NOT_AUTHENTICATED');

      const careTeamId = req.params[paramName];
      const membership = await prisma.careTeamMember.findUnique({
        where: { careTeamId_userId: { careTeamId, userId: req.user.id } },
      });

      if (!membership)
        throw ApiError.forbidden('You are not a member of this care team', 'NOT_TEAM_MEMBER');

      // Attach membership to request for downstream use
      (req as AuthRequest & { membership: typeof membership }).membership = membership;
      next();
    } catch (err) {
      next(err);
    }
  };

// Require specific roles within a care team
export const requireRole =
  (...roles: UserRole[]) =>
  async (
    req: AuthRequest & { membership?: { role: UserRole; isAdmin: boolean } },
    _res: Response,
    next: NextFunction
  ) => {
    try {
      const membership = (
        req as AuthRequest & { membership?: { role: UserRole; isAdmin: boolean } }
      ).membership;
      if (!membership)
        throw ApiError.forbidden('Role check requires care team context', 'NO_TEAM_CONTEXT');
      if (!roles.includes(membership.role) && !membership.isAdmin) {
        throw ApiError.forbidden(
          `This action requires one of: ${roles.join(', ')}`,
          'INSUFFICIENT_ROLE'
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };

// Require team admin
export const requireTeamAdmin = async (
  req: AuthRequest & { membership?: { isAdmin: boolean } },
  _res: Response,
  next: NextFunction
) => {
  try {
    const membership = req.membership;
    if (!membership?.isAdmin)
      throw ApiError.forbidden('This action requires team admin access', 'NOT_TEAM_ADMIN');
    next();
  } catch (err) {
    next(err);
  }
};
