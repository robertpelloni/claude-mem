/**
 * System Information Routes
 *
 * Handles system info retrieval: project structure, dependencies, git info.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { getPackageRoot } from '../../../../shared/paths.js';
import { BaseRouteHandler } from '../BaseRouteHandler.js';
import { getBranchInfo } from '../../BranchManager.js';
import { DatabaseManager } from '../../DatabaseManager.js';

export class SystemRoutes extends BaseRouteHandler {
  constructor(private dbManager?: DatabaseManager) {
    super();
  }

  setupRoutes(app: express.Application): void {
    app.get('/api/system/info', this.handleGetSystemInfo.bind(this));
  }

  /**
   * Get system information (project structure, dependencies, git)
   */
  private handleGetSystemInfo = this.wrapHandler(async (req: Request, res: Response): Promise<void> => {
    const packageRoot = getPackageRoot();

    // 1. Dependencies from package.json
    let dependencies: Record<string, string> = {};
    try {
      const pkgPath = path.join(packageRoot, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        dependencies = {
          ...pkg.dependencies,
          ...pkg.devDependencies
        };
      }
    } catch (e) {
      // Ignore errors reading package.json
    }

    // 2. Git Info
    const gitInfo = getBranchInfo();

    // 3. Project Structure (Simplified)
    const structure = this.scanDirectory(packageRoot, 0, 2); // Max depth 2

    // 4. Endless Mode Stats (if DB available)
    let endlessMode = null;
    if (this.dbManager) {
      try {
        const stats = this.dbManager.getSessionStore().getEndlessModeStats();
        endlessMode = {
          active: true, // Always active if DB is connected
          savings: stats.totalArchivedTokens,
          sessions: stats.totalSessions,
          observations: stats.totalObservations
        };
      } catch (e) {
        // Ignore stats errors
      }
    }

    res.json({
      dependencies,
      git: gitInfo,
      structure,
      endlessMode
    });
  });

  private scanDirectory(dir: string, depth: number, maxDepth: number): any {
    if (depth > maxDepth) return null;

    const name = path.basename(dir);
    const result: any = { name, type: 'directory', children: [] };

    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.') || item.name === 'node_modules') continue;

        if (item.isDirectory()) {
          const child = this.scanDirectory(path.join(dir, item.name), depth + 1, maxDepth);
          if (child) result.children.push(child);
        } else {
          result.children.push({ name: item.name, type: 'file' });
        }
      }
    } catch (e) {
      // Ignore access errors
    }

    return result;
  }
}
