import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { jwtUtils } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, SubscriptionPlan } from '@prisma/client';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    careTeams: Array<{
      careTeamId: string;
      careTeamName: string;
      role: UserRole;
      isAdmin: boolean;
    }>;
  };
  tokens: AuthTokens;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing)
      throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        emailVerified: null,
      },
    });

    // Create a personal care team for the new user
    const careTeam = await prisma.careTeam.create({
      data: {
        name: `${input.firstName}'s Care Team`,
        members: {
          create: {
            userId: user.id,
            role: UserRole.PRIMARY_CAREGIVER,
            isAdmin: true,
          },
        },
        subscription: {
          create: { plan: SubscriptionPlan.FREE },
        },
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'REGISTER', resource: 'user', resourceId: user.id },
    });

    const tokens = authService._generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        careTeams: [
          {
            careTeamId: careTeam.id,
            careTeamName: careTeam.name,
            role: UserRole.PRIMARY_CAREGIVER,
            isAdmin: true,
          },
        ],
      },
      tokens,
    };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        careTeamMemberships: {
          include: { careTeam: true },
          where: { careTeam: { status: { not: 'INACTIVE' } } },
        },
      },
    });

    if (!user || !user.passwordHash)
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    if (!user.isActive)
      throw ApiError.forbidden('This account has been deactivated', 'ACCOUNT_DEACTIVATED');

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid)
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', resource: 'user', resourceId: user.id },
    });

    const tokens = authService._generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        careTeams: user.careTeamMemberships.map((m) => ({
          careTeamId: m.careTeamId,
          careTeamName: m.careTeam.name,
          role: m.role,
          isAdmin: m.isAdmin,
        })),
      },
      tokens,
    };
  },

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string };
    try {
      payload = jwtUtils.verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive)
      throw ApiError.unauthorized('User not found or deactivated', 'USER_NOT_FOUND');

    return authService._generateTokens(user);
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always return success even if user not found — prevents email enumeration
    if (!user) return;

    // Expire any existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { email: email.toLowerCase(), usedAt: null },
      data: { expiresAt: new Date() },
    });

    const token = uuidv4();
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Email sending happens here — implemented in emailService (below)
    // For now: log the reset link for development
    console.log(
      `[DEV] Password reset link: ${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    );
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw ApiError.badRequest('This reset link is invalid or has expired', 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { passwordHash },
    });
    await prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        careTeamMemberships: {
          include: { careTeam: { include: { recipient: true, subscription: true } } },
        },
      },
    });
    if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },

  _generateTokens(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }): AuthTokens {
    const accessToken = jwtUtils.signAccessToken({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    const refreshToken = jwtUtils.signRefreshToken(user.id);
    return { accessToken, refreshToken, expiresIn: 900 }; // 15 minutes
  },
};
