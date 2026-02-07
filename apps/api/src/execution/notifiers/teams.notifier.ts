import axios from 'axios';
import { logger } from '../../utils/logger';

export interface TeamsConfig {
  webhookUrl: string;
}

class TeamsNotifier {
  /**
   * Send DOWN notification to Teams
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
    const card = this.generateDownCard(data);
    return this.send(data.webhookUrl, card);
  }

  /**
   * Send UP (recovery) notification to Teams
   */
  async sendUpNotification(data: {
    webhookUrl: string;
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    duration?: number;
  }) {
    const card = this.generateUpCard(data);
    return this.send(data.webhookUrl, card);
  }

  /**
   * Send DEGRADED notification to Teams
   */
  async sendDegradedNotification(data: {
    webhookUrl: string;
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    responseTime?: number;
  }) {
    const card = this.generateDegradedCard(data);
    return this.send(data.webhookUrl, card);
  }

  /**
   * Send adaptive card to Teams webhook
   */
  private async send(webhookUrl: string, card: any) {
    try {
      const response = await axios.post(webhookUrl, card, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.status === 200 || response.status === 204) {
        logger.info(`Teams notification sent successfully`);
        return { success: true };
      } else {
        throw new Error(`Teams webhook returned status ${response.status}`);
      }
    } catch (error: any) {
      logger.error('Failed to send Teams notification:', error);
      throw new Error(`Teams notification failed: ${error.message}`);
    }
  }

  /**
   * Generate DOWN adaptive card
   */
  private generateDownCard(data: {
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    errorMessage?: string;
    errorCategory?: string;
    timestamp: string;
    rcaDetails?: any;
  }) {
    const facts: any[] = [
      {
        title: 'URL',
        value: data.monitorUrl,
      },
      {
        title: 'Status',
        value: 'DOWN',
      },
      {
        title: 'Time',
        value: new Date(data.timestamp).toLocaleString(),
      },
    ];

    if (data.projectName) {
      facts.unshift({
        title: 'Project',
        value: data.projectName,
      });
    }

    if (data.errorCategory) {
      facts.push({
        title: 'Error Type',
        value: data.errorCategory,
      });
    }

    if (data.errorMessage) {
      facts.push({
        title: 'Error',
        value: data.errorMessage,
      });
    }

    // Add RCA summary if available
    if (data.rcaDetails) {
      const rcaText: string[] = [];
      if (data.rcaDetails.phases?.dns) {
        rcaText.push(
          `DNS: ${data.rcaDetails.phases.dns.success ? '✓' : '✗'} ${data.rcaDetails.phases.dns.durationMs}ms`
        );
      }
      if (data.rcaDetails.phases?.tcp) {
        rcaText.push(
          `TCP: ${data.rcaDetails.phases.tcp.success ? '✓' : '✗'} ${data.rcaDetails.phases.tcp.durationMs}ms`
        );
      }
      if (data.rcaDetails.phases?.tls) {
        rcaText.push(
          `TLS: ${data.rcaDetails.phases.tls.success ? '✓' : '✗'} ${data.rcaDetails.phases.tls.durationMs}ms`
        );
      }
      if (data.rcaDetails.phases?.http) {
        rcaText.push(
          `HTTP: ${data.rcaDetails.phases.http.success ? '✓' : '✗'} ${data.rcaDetails.phases.http.durationMs}ms (${data.rcaDetails.phases.http.statusCode || 'N/A'})`
        );
      }
      if (rcaText.length > 0) {
        facts.push({
          title: 'Root Cause Analysis',
          value: rcaText.join('  \n'),
        });
        facts.push({
          title: 'Total Duration',
          value: `${data.rcaDetails.totalDurationMs}ms`,
        });
      }
    }

    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `Monitor DOWN: ${data.monitorName}`,
      themeColor: 'DC3545', // Red
      title: '🔴 Monitor DOWN',
      sections: [
        {
          activityTitle: data.monitorName,
          activitySubtitle: 'PULSE Monitoring Alert',
          facts,
        },
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Incident',
          targets: [
            {
              os: 'default',
              uri: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/incidents`,
            },
          ],
        },
        {
          '@type': 'OpenUri',
          name: 'View Monitor',
          targets: [
            {
              os: 'default',
              uri: data.monitorUrl,
            },
          ],
        },
      ],
    };
  }

  /**
   * Generate UP (recovery) adaptive card
   */
  private generateUpCard(data: {
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    duration?: number;
  }) {
    const durationText = data.duration ? this.formatDuration(data.duration) : 'Unknown';

    const facts: any[] = [
      {
        title: 'URL',
        value: data.monitorUrl,
      },
      {
        title: 'Status',
        value: 'UP',
      },
      {
        title: 'Recovered',
        value: new Date(data.timestamp).toLocaleString(),
      },
      {
        title: 'Downtime',
        value: durationText,
      },
    ];

    if (data.projectName) {
      facts.unshift({
        title: 'Project',
        value: data.projectName,
      });
    }

    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `Monitor RECOVERED: ${data.monitorName}`,
      themeColor: '28A745', // Green
      title: '✅ Monitor RECOVERED',
      sections: [
        {
          activityTitle: data.monitorName,
          activitySubtitle: 'PULSE Monitoring Alert',
          text: 'Great news! Your monitor is back online and operational.',
          facts,
        },
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Monitor',
          targets: [
            {
              os: 'default',
              uri: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/monitors`,
            },
          ],
        },
      ],
    };
  }

  /**
   * Generate DEGRADED adaptive card
   */
  private generateDegradedCard(data: {
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    responseTime?: number;
  }) {
    const facts: any[] = [
      {
        title: 'URL',
        value: data.monitorUrl,
      },
      {
        title: 'Status',
        value: 'DEGRADED',
      },
      {
        title: 'Detected',
        value: new Date(data.timestamp).toLocaleString(),
      },
    ];

    if (data.projectName) {
      facts.unshift({
        title: 'Project',
        value: data.projectName,
      });
    }

    if (data.responseTime) {
      facts.push({
        title: 'Response Time',
        value: `${data.responseTime}ms`,
      });
    }

    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `Monitor DEGRADED: ${data.monitorName}`,
      themeColor: 'FFC107', // Yellow
      title: '⚠️ Monitor DEGRADED',
      sections: [
        {
          activityTitle: data.monitorName,
          activitySubtitle: 'PULSE Monitoring Alert',
          text: 'Your monitor is experiencing degraded performance.',
          facts,
        },
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Monitor',
          targets: [
            {
              os: 'default',
              uri: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/monitors`,
            },
          ],
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
   * Test Teams webhook
   */
  async testWebhook(webhookUrl: string) {
    try {
      const testCard = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: 'Test notification from PULSE',
        themeColor: '667EEA',
        title: '🧪 Test Notification',
        sections: [
          {
            activityTitle: 'PULSE Monitoring System',
            activitySubtitle: 'Connection Test',
            text: 'This is a test notification. Your Teams integration is working correctly!',
          },
        ],
      };

      await this.send(webhookUrl, testCard);
      return { success: true };
    } catch (error) {
      logger.error('Teams webhook test failed:', error);
      throw error;
    }
  }
}

export const teamsNotifier = new TeamsNotifier();
