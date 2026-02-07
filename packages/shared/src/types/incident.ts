export enum IncidentStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
}

export interface Incident {
  id: string;
  monitorId: string;
  status: IncidentStatus;
  startedAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  durationSeconds?: number;
  errorCategory?: string;
  errorMessage?: string;
  rcaDetails?: Record<string, any>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIncidentDto {
  monitorId: string;
  errorCategory?: string;
  errorMessage?: string;
  rcaDetails?: Record<string, any>;
}

export interface UpdateIncidentDto {
  status?: IncidentStatus;
  acknowledgedBy?: string;
  notes?: string;
}
