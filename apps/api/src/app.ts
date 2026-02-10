import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { requestLogger } from './middleware/request.logger';
import { rateLimiter } from './middleware/rate.limiter';
import { errorHandler, notFoundHandler } from './middleware/error.handler';
import authRoutes from './auth/auth.routes';
import userRoutes from './users/user.routes';
import projectRoutes from './projects/project.routes';
import alertContactRoutes from './director/alerts/alert.routes';
import monitorRoutes from './director/monitors/monitor.routes';
import incidentRoutes from './director/incidents/incident.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import reportRoutes from './director/reports/report.routes';
import teamRoutes from './team/team.routes';
import maintenanceRoutes from './maintenance/maintenance.routes';
import integrationsRoutes from './integrations/integrations.routes';

const app = express();

// Trust proxy - required for accurate IP detection behind Render's proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for API - frontend handles its own CSP
  crossOriginEmbedderPolicy: false, // Allow embedding for dashboard iframes
}));

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(rateLimiter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    name: 'PULSE Monitoring API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      documentation: 'https://github.com/p05-cloud/pulse-monitoring',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Pulse API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/alert-contacts', alertContactRoutes);
app.use('/api/v1/monitors', monitorRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/integrations', integrationsRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
