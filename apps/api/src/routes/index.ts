import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import inviteRouter from './invites';
import careTeamsRouter from './careTeams';
import recipientsRouter from './recipients';
import careLogsRouter from './careLogs';
import medicationsRouter from './medications';
import tasksRouter from './tasks';
import dashboardRouter from './dashboard';
import appointmentsRouter from './appointments';
import inventoryRouter from './inventory';
import handoffsRouter from './handoffs';
import blueprintsRouter from './blueprints';
import documentsRouter from './documents';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/', inviteRouter);
router.use('/teams', careTeamsRouter);
router.use('/', recipientsRouter);
router.use('/care-logs', careLogsRouter);
router.use('/medications', medicationsRouter);
router.use('/tasks', tasksRouter);
router.use('/dashboard', dashboardRouter);
router.use('/appointments', appointmentsRouter);
router.use('/inventory', inventoryRouter);
router.use('/handoffs', handoffsRouter);
router.use('/blueprints', blueprintsRouter);
router.use('/documents', documentsRouter);

export default router;
