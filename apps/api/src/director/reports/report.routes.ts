import { Router } from 'express';
import { reportController } from './report.controller';
import { requireAuth } from '../../auth/auth.middleware';

const router = Router();

// All report routes require authentication
router.use(requireAuth);

// Report schedules
router.get('/schedules', reportController.getSchedules.bind(reportController));
router.post('/schedules', reportController.createSchedule.bind(reportController));
router.get('/schedules/:id', reportController.getScheduleById.bind(reportController));
router.put('/schedules/:id', reportController.updateSchedule.bind(reportController));
router.delete('/schedules/:id', reportController.deleteSchedule.bind(reportController));
router.post('/schedules/:id/trigger', reportController.triggerSchedule.bind(reportController));

// On-demand report generation
router.post('/generate', reportController.generateReport.bind(reportController));

// Generated reports
router.get('/', reportController.getGeneratedReports.bind(reportController));
router.get('/:id', reportController.getGeneratedReportById.bind(reportController));
router.get('/:id/download', reportController.downloadReport.bind(reportController));

export default router;
