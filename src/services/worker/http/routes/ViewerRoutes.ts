/**
 * Viewer Routes
 *
 * Handles health check, viewer UI, and SSE stream endpoints.
 * These are used by the web viewer UI at http://localhost:37777
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { readFileSync, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { logger } from '../../../../utils/logger.js';
import { getPackageRoot } from '../../../../shared/paths.js';
import { SSEBroadcaster } from '../../SSEBroadcaster.js';
import { DatabaseManager } from '../../DatabaseManager.js';
import { SessionManager } from '../../SessionManager.js';
import { BaseRouteHandler } from '../BaseRouteHandler.js';

export class ViewerRoutes extends BaseRouteHandler {
  constructor(
    private sseBroadcaster: SSEBroadcaster,
    private dbManager: DatabaseManager,
    private sessionManager: SessionManager
  ) {
    super();
  }

  setupRoutes(app: express.Application): void {
    // Serve static UI assets (JS, CSS, fonts, etc.)
    const packageRoot = getPackageRoot();
    app.use(express.static(path.join(packageRoot, 'ui')));

    app.get('/health', this.handleHealth.bind(this));
    app.get('/', this.handleViewerUI.bind(this));
    app.get('/transcript-viewer', this.handleTranscriptUI.bind(this));
    app.get('/stream', this.handleSSEStream.bind(this));
    app.get('/api/transcript', this.handleTranscriptAPI.bind(this));
  }

  /**
   * Health check endpoint
   */
  private handleHealth = this.wrapHandler((req: Request, res: Response): void => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  /**
   * Serve viewer UI
   */
  private handleViewerUI = this.wrapHandler((req: Request, res: Response): void => {
    const packageRoot = getPackageRoot();

    // Try cache structure first (ui/viewer.html), then marketplace structure (plugin/ui/viewer.html)
    const viewerPaths = [
      path.join(packageRoot, 'ui', 'viewer.html'),
      path.join(packageRoot, 'plugin', 'ui', 'viewer.html')
    ];

    const viewerPath = viewerPaths.find(p => existsSync(p));

    if (!viewerPath) {
      throw new Error('Viewer UI not found at any expected location');
    }

    const html = readFileSync(viewerPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  /**
   * Serve transcript viewer UI
   */
  private handleTranscriptUI = this.wrapHandler((req: Request, res: Response): void => {
    const packageRoot = getPackageRoot();

    const viewerPaths = [
      path.join(packageRoot, 'ui', 'transcript-viewer.html'),
      path.join(packageRoot, 'plugin', 'ui', 'transcript-viewer.html')
    ];

    const viewerPath = viewerPaths.find(p => existsSync(p));

    if (!viewerPath) {
      throw new Error('Transcript Viewer UI not found at any expected location');
    }

    const html = readFileSync(viewerPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  /**
   * SSE stream endpoint
   */
  private handleSSEStream = this.wrapHandler((req: Request, res: Response): void => {
    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add client to broadcaster
    this.sseBroadcaster.addClient(res);

    // Send initial_load event with projects list
    const allProjects = this.dbManager.getSessionStore().getAllProjects();
    this.sseBroadcaster.broadcast({
      type: 'initial_load',
      projects: allProjects,
      timestamp: Date.now()
    });

    // Send initial processing status (based on queue depth + active generators)
    const isProcessing = this.sessionManager.isAnySessionProcessing();
    const queueDepth = this.sessionManager.getTotalActiveWork(); // Includes queued + actively processing
    this.sseBroadcaster.broadcast({
      type: 'processing_status',
      isProcessing,
      queueDepth
    });
  });

  /**
   * Transcript API (serves JSONL messages)
   */
  private handleTranscriptAPI = this.wrapHandler(async (req: Request, res: Response): Promise<void> => {
    const transcriptPath = req.query.path as string;

    if (!transcriptPath) {
      res.status(400).json({ error: 'Missing transcript path parameter' });
      return;
    }

    if (!existsSync(transcriptPath)) {
      res.status(404).json({ error: 'Transcript not found or inaccessible.' });
      return;
    }

    try {
      const content = await readFile(transcriptPath, 'utf-8');

      // Parse as JSON array first, fallback to line-delimited JSONL
      let messages = [];
      try {
        messages = JSON.parse(content);
        if (!Array.isArray(messages)) messages = [messages];
      } catch (e) {
        messages = content.split('\n')
          .filter(line => line.trim())
          .map(line => {
            try { return JSON.parse(line); } catch { return null; }
          })
          .filter(Boolean);
      }

      res.json({ messages });
    } catch (e) {
      logger.error('ViewerRoutes' as any, 'Failed to read transcript', { error: String(e) });
      res.status(500).json({ error: 'Failed to read transcript file' });
    }
  });
}
