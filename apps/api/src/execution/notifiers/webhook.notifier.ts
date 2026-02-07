import axios from 'axios';
import { logger } from '../../utils/logger';

export interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
  method?: 'POST' | 'PUT' | 'PATCH';
}

class WebhookNotifier {
  /**
   * Send notification to generic webhook
   */
  async send(config: WebhookConfig, payload: any) {
    try {
      const method = config.method || 'POST';
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'PULSE-Monitoring/1.0',
        ...config.headers,
      };

      const response = await axios({
        method,
        url: config.url,
        headers,
        data: payload,
        timeout: 10000,
      });

      if (response.status >= 200 && response.status < 300) {
        logger.info(`Webhook notification sent successfully to ${config.url}`);
        return { success: true, statusCode: response.status, data: response.data };
      } else {
        throw new Error(`Webhook returned status ${response.status}`);
      }
    } catch (error: any) {
      logger.error(`Failed to send webhook notification to ${config.url}:`, error);
      throw new Error(`Webhook notification failed: ${error.message}`);
    }
  }

  /**
   * Send DOWN notification
   */
  async sendDownNotification(
    config: WebhookConfig,
    data: {
      monitorId: string;
      monitorName: string;
      monitorUrl: string;
      projectName?: string;
      errorMessage?: string;
      errorCategory?: string;
      timestamp: string;
      rcaDetails?: any;
    }
  ) {
    const payload = {
      event: 'monitor.down',
      timestamp: data.timestamp,
      monitor: {
        id: data.monitorId,
        name: data.monitorName,
        url: data.monitorUrl,
        project: data.projectName,
      },
      status: 'DOWN',
      error: {
        message: data.errorMessage,
        category: data.errorCategory,
      },
      rca: data.rcaDetails,
      links: {
        dashboard: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
        incidents: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/incidents`,
        monitor: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/monitors/${data.monitorId}`,
      },
    };

    return this.send(config, payload);
  }

  /**
   * Send UP (recovery) notification
   */
  async sendUpNotification(
    config: WebhookConfig,
    data: {
      monitorId: string;
      monitorName: string;
      monitorUrl: string;
      projectName?: string;
      timestamp: string;
      duration?: number;
    }
  ) {
    const payload = {
      event: 'monitor.up',
      timestamp: data.timestamp,
      monitor: {
        id: data.monitorId,
        name: data.monitorName,
        url: data.monitorUrl,
        project: data.projectName,
      },
      status: 'UP',
      downtime: {
        duration_seconds: data.duration,
        duration_human: data.duration ? this.formatDuration(data.duration) : null,
      },
      links: {
        dashboard: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
        monitor: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/monitors/${data.monitorId}`,
      },
    };

    return this.send(config, payload);
  }

  /**
   * Send DEGRADED notification
   */
  async sendDegradedNotification(
    config: WebhookConfig,
    data: {
      monitorId: string;
      monitorName: string;
      monitorUrl: string;
      projectName?: string;
      timestamp: string;
      responseTime?: number;
    }
  ) {
    const payload = {
      event: 'monitor.degraded',
      timestamp: data.timestamp,
      monitor: {
        id: data.monitorId,
        name: data.monitorName,
        url: data.monitorUrl,
        project: data.projectName,
      },
      status: 'DEGRADED',
      performance: {
        response_time_ms: data.responseTime,
      },
      links: {
        dashboard: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
        monitor: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/monitors/${data.monitorId}`,
      },
    };

    return this.send(config, payload);
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(config: WebhookConfig) {
    try {
      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        message: 'This is a test notification from PULSE Monitoring System',
        source: 'PULSE',
        version: '1.0.0',
      };

      await this.send(config, testPayload);
      return { success: true };
    } catch (error) {
      logger.error('Webhook test failed:', error);
      throw error;
    }
  }
}

export const webhookNotifier = new WebhookNotifier();
