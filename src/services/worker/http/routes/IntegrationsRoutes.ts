import express, { Request, Response } from 'express';
import { BaseRouteHandler } from '../BaseRouteHandler.js';
import { DatabaseManager } from '../../DatabaseManager.js';

export class IntegrationsRoutes extends BaseRouteHandler {
  constructor(private dbManager: DatabaseManager) {
    super();
  }

  setupRoutes(app: express.Application): void {
    app.get('/api/integrations/status', this.handleGetStatus.bind(this));
  }

  private handleGetStatus = this.wrapHandler(async (req: Request, res: Response) => {
    try {
      const chroma = this.dbManager.getChromaSync();
      const chromaStatus = await chroma.getStatus();

      res.json({
        chroma: chromaStatus,
        // Add other integrations here if needed
      });
    } catch (error) {
      // If ChromaSync is not initialized yet (e.g. startup), return a safe fallback
      res.json({
        chroma: {
          connected: false,
          error: 'ChromaSync not initialized'
        }
      });
    }
  });
}
