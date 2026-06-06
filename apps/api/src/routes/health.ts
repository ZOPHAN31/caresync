import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'CareSync API',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

export default router;
