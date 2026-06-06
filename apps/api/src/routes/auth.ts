import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    firstName: z.string().min(1, 'First name required').max(50),
    lastName: z.string().min(1, 'Last name required').max(50),
    phone: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email required'),
    password: z.string().min(1, 'Password required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email required'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[0-9]/, 'Must contain a number'),
  }),
});

// POST /api/v1/auth/register
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  })
);

// POST /api/v1/auth/login
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  })
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    res.json({ success: true, data: tokens });
  })
);

// POST /api/v1/auth/logout
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    // JWT is stateless — client discards tokens
    // In future: add token to blocklist in Redis
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  })
);

// GET /api/v1/auth/me
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.getMe(req.user!.id);
    res.json({ success: true, data: user });
  })
);

// POST /api/v1/auth/forgot-password
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    res.json({
      success: true,
      data: { message: 'If this email exists, a reset link has been sent.' },
    });
  })
);

// POST /api/v1/auth/reset-password
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, data: { message: 'Password reset successfully. Please log in.' } });
  })
);

export default router;
