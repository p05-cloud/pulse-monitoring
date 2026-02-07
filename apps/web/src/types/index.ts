export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type MonitorType = 'SIMPLE' | 'AGGREGATOR';

export interface AggregatorConfig {
  arrayPath: string;
  nameField: string;
  statusField: string;
  statusCodeField?: string;
  responseTimeField?: string;
  errorField?: string;
  successValues: string[];
}

export interface Monitor {
  id: string;
  projectId: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatus: number;
  keyword: string | null;
  headers: Record<string, string>;
  body: string | null; // Request body for POST/PUT/PATCH/DELETE
  tags: string[];
  monitorType: MonitorType;
  aggregatorConfig: AggregatorConfig | null;
  isActive: boolean;
  currentStatus: 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN' | 'PAUSED';
  lastCheckAt: string | null;
  lastStatusChangeAt: string | null;
  consecutiveFailures: number;
  createdAt: string;
  updatedAt: string;
  project?: Project;
}

export interface CheckResult {
  id: string;
  monitorId: string;
  checkedAt: string;
  success: boolean;
  responseTimeMs: number | null;
  statusCode: number | null;
  errorCategory: string | null;
  errorMessage: string | null;
  rcaDetails: RCADetails | null;
  createdAt: string;
  // Aggregator sub-monitor fields
  subMonitorName: string | null;
  subMonitorData: Record<string, any> | null;
}

export interface RCADetails {
  category: string;
  message: string;
  timestamp: string;
  phases: {
    dns?: {
      durationMs: number;
      resolvedIp?: string;
      success: boolean;
      error?: string;
    };
    tcp?: {
      durationMs: number;
      success: boolean;
      error?: string;
    };
    tls?: {
      durationMs: number;
      protocol?: string;
      cipher?: string;
      certValid?: boolean;
      certExpires?: string;
      certIssuer?: string;
      success: boolean;
      error?: string;
    };
    http?: {
      durationMs: number;
      statusCode?: number;
      statusText?: string;
      contentType?: string;
      contentLength?: number;
      server?: string;
      responseBodyPreview?: string;
      success: boolean;
      error?: string;
    };
    keyword?: {
      expected: string;
      found: boolean;
      success: boolean;
    };
  };
  totalDurationMs: number;
}

export interface Incident {
  id: string;
  monitorId: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  startedAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  durationSeconds: number | null;
  errorCategory: string | null;
  errorMessage: string | null;
  rcaDetails: RCADetails | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  monitor?: Monitor;
}

export interface AlertContact {
  id: string;
  name: string;
  type: 'EMAIL' | 'TEAMS' | 'WEBHOOK' | 'SLACK';
  config: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  degradedMonitors: number;
  pausedMonitors: number;
  openIncidents: number;
  avgResponseTime: number;
  uptimePercentage: number;
}

export interface ProjectHealth {
  projectId: string;
  projectName: string;
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  degradedMonitors: number;
  uptimePercentage: number;
  avgResponseTime: number;
  openIncidents: number;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, any> | null;
  createdAt: string;
  user?: User;
}
