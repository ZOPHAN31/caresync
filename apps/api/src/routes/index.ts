import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import inviteRouter from './invites';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/', inviteRouter);

// Feature routes — mounted in subsequent phases:
// router.use('/care-teams', careTeamRouter);
// router.use('/recipients', recipientRouter);
// router.use('/care-logs', careLogRouter);
// router.use('/medications', medicationRouter);
// router.use('/tasks', taskRouter);
// router.use('/appointments', appointmentRouter);
// router.use('/documents', documentRouter);
// router.use('/inventory', inventoryRouter);
// router.use('/handoffs', handoffRouter);
// router.use('/blueprints', blueprintRouter);
// router.use('/notifications', notificationRouter);

export default router;
