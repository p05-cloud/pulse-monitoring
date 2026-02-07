import { prisma } from '../config/database';
import { IntegrationType } from '@prisma/client';
import axios from 'axios';

interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

interface TeamsConfig {
  webhookUrl: string;
}

interface WebhookConfig {
  url: string;
  method?: 'POST' | 'GET';
  headers?: Record<string, string>;
}

type IntegrationConfig = SlackConfig | TeamsConfig | WebhookConfig;

export class IntegrationsService {
  // Get all integrations
  async getAll() {
    return prisma.integration.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get by ID
  async getById(id: string) {
    return prisma.integration.findUnique({
      where: { id },
    });
  }

  // Get active integrations by type
  async getActiveByType(type: IntegrationType) {
    return prisma.integration.findMany({
      where: { type, isActive: true },
    });
  }

  // Create integration
  async create(name: string, type: IntegrationType, config: IntegrationConfig) {
    return prisma.integration.create({
      data: {
        name,
        type,
        config: config as any,
        isActive: true,
      },
    });
  }

  // Update integration
  async update(id: string, data: { name?: string; config?: IntegrationConfig; isActive?: boolean }) {
    return prisma.integration.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.config !== undefined && { config: data.config as any }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  // Delete integration
  async delete(id: string) {
    return prisma.integration.delete({
      where: { id },
    });
  }

  // Test Slack integration
  async testSlack(config: SlackConfig): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(config.webhookUrl, {
        text: 'PULSE Monitoring - Test notification',
        username: config.username || 'PULSE',
        icon_emoji: config.iconEmoji || ':robot_face:',
        channel: config.channel,
        attachments: [
          {
            color: '#36a64f',
            title: 'Integration Test Successful',
            text: 'Your Slack integration is working correctly!',
            footer: 'PULSE Monitoring',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Test Teams integration
  async testTeams(config: TeamsConfig): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(config.webhookUrl, {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '0076D7',
        summary: 'PULSE Monitoring Test',
        sections: [
          {
            activityTitle: 'Integration Test Successful',
            activitySubtitle: 'PULSE Monitoring',
            facts: [
              { name: 'Status', value: 'Connected' },
              { name: 'Timestamp', value: new Date().toISOString() },
            ],
            markdown: true,
          },
        ],
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Send Slack notification
  async sendSlackNotification(
    config: SlackConfig,
    title: string,
    message: string,
    color: 'good' | 'warning' | 'danger' = 'danger',
    fields?: Array<{ title: string; value: string; short?: boolean }>
  ) {
    try {
      await axios.post(config.webhookUrl, {
        username: config.username || 'PULSE',
        icon_emoji: config.iconEmoji || ':warning:',
        channel: config.channel,
        attachments: [
          {
            color,
            title,
            text: message,
            fields,
            footer: 'PULSE Monitoring',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Send Teams notification
  async sendTeamsNotification(
    config: TeamsConfig,
    title: string,
    message: string,
    themeColor: string = 'FF0000',
    facts?: Array<{ name: string; value: string }>
  ) {
    try {
      await axios.post(config.webhookUrl, {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor,
        summary: title,
        sections: [
          {
            activityTitle: title,
            activitySubtitle: 'PULSE Monitoring',
            text: message,
            facts,
            markdown: true,
          },
        ],
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const integrationsService = new IntegrationsService();
