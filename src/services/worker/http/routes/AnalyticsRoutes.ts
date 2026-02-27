import express, { Request, Response } from 'express';
import { DatabaseManager } from '../../DatabaseManager.js';
import { BaseRouteHandler } from '../BaseRouteHandler.js';

export class AnalyticsRoutes extends BaseRouteHandler {
  constructor(private dbManager: DatabaseManager) {
    super();
  }

  setupRoutes(app: express.Application): void {
    app.get('/api/analytics', this.handleGetAnalytics.bind(this));
  }

  private handleGetAnalytics = this.wrapHandler(async (req: Request, res: Response): Promise<void> => {
    const analytics = this.dbManager.getSessionStore().getAnalytics();
    res.json(analytics);
  });
}
