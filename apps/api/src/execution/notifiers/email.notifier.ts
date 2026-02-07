import { Resend } from 'resend';
import { logger } from '../../utils/logger';

export interface EmailConfig {
  email: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  monitorName: string;
  monitorUrl: string;
  projectName?: string;
}

class EmailNotifier {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    // Initialize Resend with API key
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      logger.warn('RESEND_API_KEY not set - email notifications will not work');
    }

    this.resend = new Resend(apiKey);
    this.fromEmail = process.env.EMAIL_FROM || 'PULSE Monitoring <noreply@pulse.local>';

    logger.info('Email notifier initialized with Resend');
  }

  /**
   * Send DOWN notification email
   */
  async sendDownNotification(data: {
    to: string;
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    errorMessage?: string;
    errorCategory?: string;
    timestamp: string;
    rcaDetails?: any;
  }) {
    const subject = `🔴 [PULSE] DOWN: ${data.monitorName}`;
    const html = this.generateDownEmailTemplate(data);

    return this.send({
      to: data.to,
      subject,
      html,
      monitorName: data.monitorName,
      monitorUrl: data.monitorUrl,
      projectName: data.projectName,
    });
  }

  /**
   * Send UP (recovery) notification email
   */
  async sendUpNotification(data: {
    to: string;
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    duration?: number;
  }) {
    const subject = `✅ [PULSE] RECOVERED: ${data.monitorName}`;
    const html = this.generateUpEmailTemplate(data);

    return this.send({
      to: data.to,
      subject,
      html,
      monitorName: data.monitorName,
      monitorUrl: data.monitorUrl,
      projectName: data.projectName,
    });
  }

  /**
   * Send DEGRADED notification email
   */
  async sendDegradedNotification(data: {
    to: string;
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    responseTime?: number;
  }) {
    const subject = `⚠️ [PULSE] DEGRADED: ${data.monitorName}`;
    const html = this.generateDegradedEmailTemplate(data);

    return this.send({
      to: data.to,
      subject,
      html,
      monitorName: data.monitorName,
      monitorUrl: data.monitorUrl,
      projectName: data.projectName,
    });
  }

  /**
   * Send core email using Resend
   */
  private async send(data: EmailData) {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: data.to,
        subject: data.subject,
        html: data.html,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      logger.info(`Email sent to ${data.to}: ${result.data?.id}`);
      return { success: true, messageId: result.data?.id };
    } catch (error: any) {
      logger.error(`Failed to send email to ${data.to}:`, error);
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }

  /**
   * Generate DOWN email template
   */
  private generateDownEmailTemplate(data: {
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    errorMessage?: string;
    errorCategory?: string;
    timestamp: string;
    rcaDetails?: any;
  }): string {
    const rcaSummary = data.rcaDetails
      ? `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #495057;">Root Cause Analysis</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${data.rcaDetails.phases?.dns ? `
            <tr>
              <td style="padding: 5px 0; color: #6c757d;">DNS:</td>
              <td style="padding: 5px 0;">${data.rcaDetails.phases.dns.durationMs}ms</td>
              <td style="padding: 5px 0; color: ${data.rcaDetails.phases.dns.success ? '#28a745' : '#dc3545'};">
                ${data.rcaDetails.phases.dns.success ? '✓' : '✗'}
              </td>
            </tr>
            ` : ''}
            ${data.rcaDetails.phases?.tcp ? `
            <tr>
              <td style="padding: 5px 0; color: #6c757d;">TCP:</td>
              <td style="padding: 5px 0;">${data.rcaDetails.phases.tcp.durationMs}ms</td>
              <td style="padding: 5px 0; color: ${data.rcaDetails.phases.tcp.success ? '#28a745' : '#dc3545'};">
                ${data.rcaDetails.phases.tcp.success ? '✓' : '✗'}
              </td>
            </tr>
            ` : ''}
            ${data.rcaDetails.phases?.tls ? `
            <tr>
              <td style="padding: 5px 0; color: #6c757d;">TLS:</td>
              <td style="padding: 5px 0;">${data.rcaDetails.phases.tls.durationMs}ms</td>
              <td style="padding: 5px 0; color: ${data.rcaDetails.phases.tls.success ? '#28a745' : '#dc3545'};">
                ${data.rcaDetails.phases.tls.success ? '✓' : '✗'}
              </td>
            </tr>
            ` : ''}
            ${data.rcaDetails.phases?.http ? `
            <tr>
              <td style="padding: 5px 0; color: #6c757d;">HTTP:</td>
              <td style="padding: 5px 0;">${data.rcaDetails.phases.http.durationMs}ms</td>
              <td style="padding: 5px 0; color: ${data.rcaDetails.phases.http.success ? '#28a745' : '#dc3545'};">
                ${data.rcaDetails.phases.http.success ? '✓' : '✗'} ${data.rcaDetails.phases.http.statusCode || ''}
              </td>
            </tr>
            ` : ''}
            <tr style="border-top: 2px solid #dee2e6;">
              <td style="padding: 10px 0; font-weight: bold;">Total:</td>
              <td style="padding: 10px 0; font-weight: bold;">${data.rcaDetails.totalDurationMs}ms</td>
              <td></td>
            </tr>
          </table>
        </div>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PULSE Monitoring Alert</h1>
        </div>

        <!-- Alert Badge -->
        <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">🔴 MONITOR DOWN</h2>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none;">

          <h3 style="margin: 0 0 20px 0; color: #212529;">${data.monitorName}</h3>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">URL:</td>
              <td style="padding: 10px 0;">
                <a href="${data.monitorUrl}" style="color: #007bff; text-decoration: none;">${data.monitorUrl}</a>
              </td>
            </tr>
            ${data.projectName ? `
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Project:</td>
              <td style="padding: 10px 0;">${data.projectName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Status:</td>
              <td style="padding: 10px 0;"><span style="background: #dc3545; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">DOWN</span></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Started:</td>
              <td style="padding: 10px 0;">${new Date(data.timestamp).toLocaleString()}</td>
            </tr>
            ${data.errorCategory ? `
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Error Type:</td>
              <td style="padding: 10px 0;"><code style="background: #f8f9fa; padding: 4px 8px; border-radius: 3px; font-size: 13px;">${data.errorCategory}</code></td>
            </tr>
            ` : ''}
            ${data.errorMessage ? `
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500; vertical-align: top;">Error:</td>
              <td style="padding: 10px 0; color: #dc3545;">${data.errorMessage}</td>
            </tr>
            ` : ''}
          </table>

          ${rcaSummary}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/incidents"
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Incident Details
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #6c757d; font-size: 12px;">
          <p style="margin: 0;">This is an automated alert from PULSE Monitoring System</p>
          <p style="margin: 5px 0 0 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #667eea; text-decoration: none;">Dashboard</a>
          </p>
        </div>

      </body>
      </html>
    `;
  }

  /**
   * Generate UP (recovery) email template
   */
  private generateUpEmailTemplate(data: {
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    duration?: number;
  }): string {
    const durationText = data.duration
      ? this.formatDuration(data.duration)
      : 'Unknown duration';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PULSE Monitoring Alert</h1>
        </div>

        <!-- Alert Badge -->
        <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">✅ MONITOR RECOVERED</h2>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none;">

          <h3 style="margin: 0 0 20px 0; color: #212529;">${data.monitorName}</h3>

          <p style="color: #28a745; font-size: 16px; font-weight: 500; margin: 0 0 20px 0;">
            🎉 Great news! Your monitor is back online and operational.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">URL:</td>
              <td style="padding: 10px 0;">
                <a href="${data.monitorUrl}" style="color: #007bff; text-decoration: none;">${data.monitorUrl}</a>
              </td>
            </tr>
            ${data.projectName ? `
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Project:</td>
              <td style="padding: 10px 0;">${data.projectName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Status:</td>
              <td style="padding: 10px 0;"><span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">UP</span></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Recovered:</td>
              <td style="padding: 10px 0;">${new Date(data.timestamp).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Downtime:</td>
              <td style="padding: 10px 0; font-weight: 600; color: #dc3545;">${durationText}</td>
            </tr>
          </table>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/monitors"
               style="display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Monitor Details
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #6c757d; font-size: 12px;">
          <p style="margin: 0;">This is an automated alert from PULSE Monitoring System</p>
          <p style="margin: 5px 0 0 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #667eea; text-decoration: none;">Dashboard</a>
          </p>
        </div>

      </body>
      </html>
    `;
  }

  /**
   * Generate DEGRADED email template
   */
  private generateDegradedEmailTemplate(data: {
    monitorName: string;
    monitorUrl: string;
    projectName?: string;
    timestamp: string;
    responseTime?: number;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PULSE Monitoring Alert</h1>
        </div>

        <!-- Alert Badge -->
        <div style="background: #ffc107; color: #333; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">⚠️ MONITOR DEGRADED</h2>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none;">

          <h3 style="margin: 0 0 20px 0; color: #212529;">${data.monitorName}</h3>

          <p style="color: #856404; font-size: 16px; margin: 0 0 20px 0;">
            Your monitor is experiencing degraded performance.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">URL:</td>
              <td style="padding: 10px 0;">
                <a href="${data.monitorUrl}" style="color: #007bff; text-decoration: none;">${data.monitorUrl}</a>
              </td>
            </tr>
            ${data.projectName ? `
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Project:</td>
              <td style="padding: 10px 0;">${data.projectName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Status:</td>
              <td style="padding: 10px 0;"><span style="background: #ffc107; color: #333; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">DEGRADED</span></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Detected:</td>
              <td style="padding: 10px 0;">${new Date(data.timestamp).toLocaleString()}</td>
            </tr>
            ${data.responseTime ? `
            <tr>
              <td style="padding: 10px 0; color: #6c757d; font-weight: 500;">Response Time:</td>
              <td style="padding: 10px 0; font-weight: 600; color: #ffc107;">${data.responseTime}ms</td>
            </tr>
            ` : ''}
          </table>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/monitors"
               style="display: inline-block; background: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Monitor Details
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #6c757d; font-size: 12px;">
          <p style="margin: 0;">This is an automated alert from PULSE Monitoring System</p>
          <p style="margin: 5px 0 0 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #667eea; text-decoration: none;">Dashboard</a>
          </p>
        </div>

      </body>
      </html>
    `;
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
   * Test email configuration by sending a test email
   */
  async testConnection(testEmail?: string) {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured');
      }

      // Resend doesn't have a verify method, so we'll just check if API key exists
      logger.info('Resend API key configured - email notifier ready');
      return true;
    } catch (error) {
      logger.error('Email notifier configuration check failed:', error);
      return false;
    }
  }
}

export const emailNotifier = new EmailNotifier();
