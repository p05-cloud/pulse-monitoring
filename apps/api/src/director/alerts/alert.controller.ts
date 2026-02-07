import { Request, Response, NextFunction } from 'express';
import { alertService, CreateAlertContactSchema, UpdateAlertContactSchema } from './alert.service';

export class AlertController {
  /**
   * Get all alert contacts
   * GET /api/v1/alert-contacts
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const contacts = await alertService.findAll();
      res.json({ success: true, data: contacts });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get alert contact by ID
   * GET /api/v1/alert-contacts/:id
   */
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await alertService.findById(req.params.id);
      res.json({ success: true, data: contact });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new alert contact
   * POST /api/v1/alert-contacts
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateAlertContactSchema.parse(req.body);
      const contact = await alertService.create(data);

      res.status(201).json({ success: true, data: contact });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update alert contact
   * PUT /api/v1/alert-contacts/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateAlertContactSchema.parse(req.body);
      const contact = await alertService.update(req.params.id, data);

      res.json({ success: true, data: contact });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete alert contact
   * DELETE /api/v1/alert-contacts/:id
   */
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await alertService.delete(req.params.id);
      res.json({ success: true, message: 'Alert contact deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test notification
   * POST /api/v1/alert-contacts/:id/test
   */
  async test(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await alertService.testNotification(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();
