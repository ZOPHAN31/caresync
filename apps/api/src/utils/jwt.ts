import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

export const jwtUtils = {
  signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
  },

  signRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId, type: 'refresh' }, env.JWT_SECRET, { expiresIn: '30d' });
  },

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  },

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const payload = jwt.verify(token, env.JWT_SECRET) as RefreshTokenPayload;
    if (payload.type !== 'refresh') throw new Error('Invalid token type');
    return payload;
  },

  // Verify a NextAuth JWT signed with NEXTAUTH_SECRET
  verifyNextAuthToken(token: string): JwtPayload | null {
    try {
      if (!env.NEXTAUTH_SECRET) return null;
      return jwt.verify(token, env.NEXTAUTH_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  },
};
