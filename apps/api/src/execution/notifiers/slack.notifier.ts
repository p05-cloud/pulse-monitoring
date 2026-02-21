import axios from 'axios';
import { logger } from '../../utils/logger';

class SlackNotifier {
  /**
   * Send DOWN notification to Slack
   */
  async sendDownNotification(data: {
    webhookUrl: string;
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    errorMessage?: string;
    errorCategory?: string;
    timestamp: string;
    rcaDetails?: any;
  }) {
    const payload = this.generateDownPayload(data);
    return this.send(data.webhookUrl, payload);
  }

  /**
   * Send UP (recovery) notification to Slack
   */
  async sendUpNotification(data: {
    webhookUrl: string;
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    duration?: number;
  }) {
    const payload = this.generateUpPayload(data);
    return this.send(data.webhookUrl, payload);
  }

  /**
   * Send DEGRADED notification to Slack
   */
  async sendDegradedNotification(data: {
    webhookUrl: string;
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    responseTime?: number;
  }) {
    const payload = this.generateDegradedPayload(data);
    return this.send(data.webhookUrl, payload);
  }

  /**
   * Post payload to Slack incoming webhook
   */
  private async send(webhookUrl: string, payload: any) {
    try {
      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        logger.info('Slack notification sent successfully');
        return { success: true };
      } else {
        throw new Error(`Slack webhook returned status ${response.status}`);
      }
    } catch (error: any) {
      logger.error('Failed to send Slack notification:', error);
      throw new Error(`Slack notification failed: ${error.message}`);
    }
  }

  /**
   * Generate DOWN attachment payload
   */
  private generateDownPayload(data: {
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    errorMessage?: string;
    errorCategory?: string;
    timestamp: string;
    rcaDetails?: any;
  }) {
    const fields: any[] = [
      { title: 'URL', value: data.monitorUrl, short: false },
      { title: 'Time', value: new Date(data.timestamp).toLocaleString(), short: true },
    ];

    if (data.projectName) {
      fields.unshift({ title: 'Project', value: data.projectName, short: true });
    }
    if (data.errorCategory) {
      fields.push({ title: 'Error Type', value: data.errorCategory, short: true });
    }
    if (data.errorMessage) {
      fields.push({ title: 'Error', value: data.errorMessage, short: false });
    }

    if (data.rcaDetails) {
      const rcaParts: string[] = [];
      if (data.rcaDetails.phases?.dns) {
        rcaParts.push(`DNS: ${data.rcaDetails.phases.dns.success ? '✓' : '✗'} ${data.rcaDetails.phases.dns.durationMs}ms`);
      }
      if (data.rcaDetails.phases?.tcp) {
        rcaParts.push(`TCP: ${data.rcaDetails.phases.tcp.success ? '✓' : '✗'} ${data.rcaDetails.phases.tcp.durationMs}ms`);
      }
      if (data.rcaDetails.phases?.tls) {
        rcaParts.push(`TLS: ${data.rcaDetails.phases.tls.success ? '✓' : '✗'} ${data.rcaDetails.phases.tls.durationMs}ms`);
      }
      if (data.rcaDetails.phases?.http) {
        rcaParts.push(`HTTP: ${data.rcaDetails.phases.http.success ? '✓' : '✗'} ${data.rcaDetails.phases.http.durationMs}ms (${data.rcaDetails.phases.http.statusCode || 'N/A'})`);
      }
      if (rcaParts.length > 0) {
        fields.push({ title: 'Root Cause Analysis', value: rcaParts.join('\n'), short: false });
      }
    }

    return {
      attachments: [
        {
          color: '#DC3545',
          title: `🔴 Monitor DOWN: ${data.monitorName}`,
          title_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/incidents`,
          footer: 'PULSE Monitoring',
          fields,
          ts: Math.floor(new Date(data.timestamp).getTime() / 1000),
        },
      ],
    };
  }

  /**
   * Generate UP (recovery) attachment payload
   */
  private generateUpPayload(data: {
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    duration?: number;
  }) {
    const durationText = data.duration ? this.formatDuration(data.duration) : 'Unknown';

    const fields: any[] = [
      { title: 'URL', value: data.monitorUrl, short: false },
      { title: 'Recovered', value: new Date(data.timestamp).toLocaleString(), short: true },
      { title: 'Downtime', value: durationText, short: true },
    ];

    if (data.projectName) {
      fields.unshift({ title: 'Project', value: data.projectName, short: true });
    }

    return {
      attachments: [
        {
          color: '#28A745',
          title: `✅ Monitor RECOVERED: ${data.monitorName}`,
          title_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/monitors`,
          text: 'Your monitor is back online and operational.',
          footer: 'PULSE Monitoring',
          fields,
          ts: Math.floor(new Date(data.timestamp).getTime() / 1000),
        },
      ],
    };
  }

  /**
   * Generate DEGRADED attachment payload
   */
  private generateDegradedPayload(data: {
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    responseTime?: number;
  }) {
    const fields: any[] = [
      { title: 'URL', value: data.monitorUrl, short: false },
      { title: 'Detected', value: new Date(data.timestamp).toLocaleString(), short: true },
    ];

    if (data.projectName) {
      fields.unshift({ title: 'Project', value: data.projectName, short: true });
    }
    if (data.responseTime) {
      fields.push({ title: 'Response Time', value: `${data.responseTime}ms`, short: true });
    }

    return {
      attachments: [
        {
          color: '#FFC107',
          title: `⚠️ Monitor DEGRADED: ${data.monitorName}`,
          title_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/monitors`,
          text: 'Your monitor is experiencing degraded performance.',
          footer: 'PULSE Monitoring',
          fields,
          ts: Math.floor(new Date(data.timestamp).getTime() / 1000),
        },
      ],
    };
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
   * Test Slack webhook
   */
  async testWebhook(webhookUrl: string) {
    try {
      await this.send(webhookUrl, {
        attachments: [
          {
            color: '#667EEA',
            title: '🧪 Test Notification',
            text: 'This is a test notification. Your Slack integration is working correctly!',
            footer: 'PULSE Monitoring System',
          },
        ],
      });
      return { success: true };
    } catch (error) {
      logger.error('Slack webhook test failed:', error);
      throw error;
    }
  }
}

export const slackNotifier = new SlackNotifier();
