import express, { Request, Response } from 'express';
import { DatabaseManager } from '../../DatabaseManager.js';
import { BaseRouteHandler } from '../BaseRouteHandler.js';

export class GraphRoutes extends BaseRouteHandler {
  constructor(private dbManager: DatabaseManager) {
    super();
  }

  setupRoutes(app: express.Application): void {
    app.get('/api/graph', this.handleGetGraph.bind(this));
  }

  private handleGetGraph = this.wrapHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const graph = this.dbManager.getSessionStore().getKnowledgeGraph(limit);
    res.json(graph);
  });
}
