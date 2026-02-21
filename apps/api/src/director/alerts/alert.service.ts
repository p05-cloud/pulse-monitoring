import { z } from 'zod';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { AlertContactType } from '@prisma/client';
import { emailNotifier } from '../../execution/notifiers/email.notifier';
import { teamsNotifier } from '../../execution/notifiers/teams.notifier';
import { slackNotifier } from '../../execution/notifiers/slack.notifier';
import { webhookNotifier } from '../../execution/notifiers/webhook.notifier';

// Validation schemas
const EmailConfigSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const TeamsConfigSchema = z.object({
  webhookUrl: z.string().url('Invalid webhook URL'),
});

const WebhookConfigSchema = z.object({
  webhookUrl: z.string().url('Invalid webhook URL'),
  headers: z.record(z.string()).optional(),
});

const SlackConfigSchema = z.object({
  webhookUrl: z.string().url('Invalid webhook URL'),
});

export const CreateAlertContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(AlertContactType),
  config: z.union([EmailConfigSchema, TeamsConfigSchema, WebhookConfigSchema, SlackConfigSchema]),
  isActive: z.boolean().optional(),
});

export const UpdateAlertContactSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  type: z.nativeEnum(AlertContactType).optional(),
  config: z
    .union([EmailConfigSchema, TeamsConfigSchema, WebhookConfigSchema, SlackConfigSchema])
    .optional(),
  isActive: z.boolean().optional(),
});

export class AlertService {
  /**
   * Get all alert contacts
   */
  async findAll() {
    const contacts = await prisma.alertContact.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { monitors: true },
        },
      },
    });

    return contacts;
  }

  /**
   * Get alert contact by ID
   */
  async findById(id: string) {
    const contact = await prisma.alertContact.findUnique({
      where: { id },
      include: {
        monitors: {
          select: {
            monitor: {
              select: {
                id: true,
                name: true,
                url: true,
              },
            },
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundError('Alert Contact', id);
    }

    return contact;
  }

  /**
   * Create new alert contact
   */
  async create(data: z.infer<typeof CreateAlertContactSchema>) {
    const contact = await prisma.alertContact.create({
      data: {
        name: data.name,
        type: data.type,
        config: data.config as any,
        isActive: data.isActive ?? true,
      },
    });

    return contact;
  }

  /**
   * Update alert contact
   */
  async update(id: string, data: z.infer<typeof UpdateAlertContactSchema>) {
    // Check if contact exists
    await this.findById(id);

    const contact = await prisma.alertContact.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        config: data.config as any,
        isActive: data.isActive,
      },
    });

    return contact;
  }

  /**
   * Delete alert contact
   */
  async delete(id: string) {
    // Check if contact exists
    await this.findById(id);

    // Delete contact (cascade deletes associations)
    await prisma.alertContact.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Test notification — sends a real test alert to the configured destination
   */
  async testNotification(id: string) {
    const contact = await this.findById(id);
    const config = contact.config as any;
    const timestamp = new Date().toISOString();

    switch (contact.type) {
      case 'EMAIL':
        await emailNotifier.sendDownNotification({
          to: config.email,
          monitorName: 'Test Monitor',
          monitorUrl: 'https://example.com',
          projectName: 'Test Project',
          errorMessage: 'This is a test alert from PULSE.',
          errorCategory: 'TEST',
          timestamp,
        });
        break;

      case 'TEAMS':
        await teamsNotifier.testWebhook(config.webhookUrl);
        break;

      case 'SLACK':
        await slackNotifier.testWebhook(config.webhookUrl);
        break;

      case 'WEBHOOK': {
        const webhookConfig = {
          url: config.webhookUrl,
          headers: config.headers,
          method: (config.method || 'POST') as 'POST' | 'PUT' | 'PATCH',
        };
        await webhookNotifier.sendDownNotification(webhookConfig, {
          monitorId: 'test',
          monitorName: 'Test Monitor',
          monitorUrl: 'https://example.com',
          projectName: 'Test Project',
          errorMessage: 'This is a test alert from PULSE.',
          errorCategory: 'TEST',
          timestamp,
        });
        break;
      }

      default:
        throw new Error(`Test not supported for type: ${contact.type}`);
    }

    return {
      success: true,
      message: `Test notification sent to ${contact.name} (${contact.type})`,
    };
  }
}

export const alertService = new AlertService();
