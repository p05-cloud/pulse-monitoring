export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export enum MonitorStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  DEGRADED = 'DEGRADED',
  UNKNOWN = 'UNKNOWN',
  PAUSED = 'PAUSED',
}

export interface Monitor {
  id: string;
  projectId: string;
  name: string;
  url: string;
  method: HttpMethod;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatus: number;
  keyword?: string;
  headers: Record<string, string>;
  tags: string[];
  isActive: boolean;
  currentStatus: MonitorStatus;
  lastCheckAt?: Date;
  lastStatusChangeAt?: Date;
  consecutiveFailures: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMonitorDto {
  projectId: string;
  name: string;
  url: string;
  method?: HttpMethod;
  intervalSeconds?: number;
  timeoutMs?: number;
  expectedStatus?: number;
  keyword?: string;
  headers?: Record<string, string>;
  tags?: string[];
}

export interface UpdateMonitorDto {
  name?: string;
  url?: string;
  method?: HttpMethod;
  intervalSeconds?: number;
  timeoutMs?: number;
  expectedStatus?: number;
  keyword?: string;
  headers?: Record<string, string>;
  tags?: string[];
  isActive?: boolean;
}
