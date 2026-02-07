import { Request, Response, NextFunction } from 'express';
import { integrationsService } from './integrations.service';
import { IntegrationType } from '@prisma/client';
import { z } from 'zod';

const SlackConfigSchema = z.object({
  webhookUrl: z.string().url('Invalid webhook URL'),
  channel: z.string().optional(),
  username: z.string().optional(),
  iconEmoji: z.string().optional(),
});

const TeamsConfigSchema = z.object({
  webhookUrl: z.string().url('Invalid webhook URL'),
});

const WebhookConfigSchema = z.object({
  url: z.string().url('Invalid URL'),
  method: z.enum(['POST', 'GET']).default('POST'),
  headers: z.record(z.string()).optional(),
});

const CreateIntegrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['SLACK', 'TEAMS', 'DISCORD', 'PAGERDUTY', 'OPSGENIE', 'WEBHOOK']),
  config: z.union([SlackConfigSchema, TeamsConfigSchema, WebhookConfigSchema]),
});

export class IntegrationsController {
  // GET /api/v1/integrations
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const integrations = await integrationsService.getAll();
      // Mask sensitive data in config
      const maskedIntegrations = integrations.map(i => ({
        ...i,
        config: this.maskConfig(i.config as any, i.type),
      }));
      res.json({ success: true, data: maskedIntegrations });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/integrations/:id
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const integration = await integrationsService.getById(req.params.id);
      if (!integration) {
        return res.status(404).json({ success: false, error: 'Integration not found' });
      }
      res.json({
        success: true,
        data: {
          ...integration,
          config: this.maskConfig(integration.config as any, integration.type),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/integrations
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = CreateIntegrationSchema.parse(req.body);

      // Validate config based on type
      this.validateConfigForType(validated.type as IntegrationType, validated.config);

      const integration = await integrationsService.create(
        validated.name,
        validated.type as IntegrationType,
        validated.config
      );
      res.status(201).json({ success: true, data: integration });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/integrations/:id
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, config, isActive } = req.body;

      const existingIntegration = await integrationsService.getById(req.params.id);
      if (!existingIntegration) {
        return res.status(404).json({ success: false, error: 'Integration not found' });
      }

      // Validate config if provided
      if (config) {
        this.validateConfigForType(existingIntegration.type, config);
      }

      const integration = await integrationsService.update(req.params.id, {
        name,
        config,
        isActive,
      });
      res.json({ success: true, data: integration });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/integrations/:id
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await integrationsService.delete(req.params.id);
      res.json({ success: true, message: 'Integration deleted' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/integrations/:id/test
  async test(req: Request, res: Response, next: NextFunction) {
    try {
      const integration = await integrationsService.getById(req.params.id);
      if (!integration) {
        return res.status(404).json({ success: false, error: 'Integration not found' });
      }

      let result: { success: boolean; error?: string };

      switch (integration.type) {
        case 'SLACK':
          result = await integrationsService.testSlack(integration.config as any);
          break;
        case 'TEAMS':
          result = await integrationsService.testTeams(integration.config as any);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: `Test not implemented for ${integration.type}`,
          });
      }

      if (result.success) {
        res.json({ success: true, message: 'Test notification sent successfully' });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      next(error);
    }
  }

  private validateConfigForType(type: IntegrationType, config: any) {
    switch (type) {
      case 'SLACK':
        SlackConfigSchema.parse(config);
        break;
      case 'TEAMS':
        TeamsConfigSchema.parse(config);
        break;
      case 'WEBHOOK':
        WebhookConfigSchema.parse(config);
        break;
      // Add more validations as needed
    }
  }

  private maskConfig(config: any, type: IntegrationType): any {
    if (!config) return config;

    const masked = { ...config };

    // Mask webhook URLs
    if (masked.webhookUrl) {
      masked.webhookUrl = this.maskUrl(masked.webhookUrl);
    }
    if (masked.url) {
      masked.url = this.maskUrl(masked.url);
    }

    return masked;
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Show domain but mask path
      return `${parsed.protocol}//${parsed.host}/***masked***`;
    } catch {
      return '***invalid-url***';
    }
  }
}

export const integrationsController = new IntegrationsController();
