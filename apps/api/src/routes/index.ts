import { Router } from 'express';
import healthRouter from './health';

const router = Router();
router.use('/health', healthRouter);
// All feature routes will be mounted here in subsequent phases

export default router;
