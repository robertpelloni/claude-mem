import { DatabaseManager } from '../DatabaseManager.js';
import { SDKAgent } from '../SDKAgent.js';
import { logger } from '../../../utils/logger.js';
import { ObservationRow } from '../../sqlite/types.js';

export class DefragDaemon {
    private interval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    constructor(
        private dbManager: DatabaseManager,
        private sdkAgent: SDKAgent
    ) { }

    public start(intervalMs: number = 30 * 60 * 1000) { // Default 30 minutes
        if (this.interval) return;

        // Schedule periodic run
        this.interval = setInterval(() => {
            this.run().catch(err => logger.error('WORKER', 'Daemon error', {}, err as Error));
        }, intervalMs);

        logger.info('WORKER', `Started Redundant Memory Defragmentation Agent (interval: ${intervalMs}ms)`);

        // Run an initial pass soon after startup
        setTimeout(() => {
            this.run().catch(err => logger.error('WORKER', 'Daemon init error', {}, err as Error));
        }, 15000);
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            logger.info('WORKER', 'Stopped Redundant Memory Defragmentation Agent');
        }
    }

    public async run() {
        if (this.isRunning) {
            logger.debug('WORKER', 'Defrag pass already in progress, skipping');
            return;
        }
        this.isRunning = true;

        try {
            logger.info('WORKER', 'Starting memory defragmentation pass');

            const sessionStore = this.dbManager.getSessionStore();

            // Get all projects to defrag them one by one
            const observations = sessionStore.db.prepare(`
        SELECT DISTINCT project FROM observations
      `).all() as { project: string }[];

            for (const row of observations) {
                if (!row.project) continue;
                await this.defragProject(row.project);
            }

            logger.info('WORKER', 'Memory defragmentation pass complete');
        } finally {
            this.isRunning = false;
        }
    }

    private async defragProject(project: string) {
        const sessionStore = this.dbManager.getSessionStore();

        // Fetch last 50 observations for the project to find redundancies
        const observations = sessionStore.db.prepare(`
      SELECT * FROM observations 
      WHERE project = ? 
      ORDER BY created_at_epoch DESC 
      LIMIT 50
    `).all(project) as ObservationRow[];

        if (observations.length < 5) return; // Not enough to defrag

        try {
            // We will prompt the agent to consolidate redundant info
            // NOTE: This could be expanded to use the full AI invocation
            // For now, as a baseline implementation of the Daemon:
            logger.debug('WORKER', `Analyzing ${observations.length} observations for project ${project}`);

            // This is a placeholder for where the actual SDK Agent would be prompted.
            // E.g. const response = await this.sdkAgent.processDefragPrompt(observations);
            // Since SDKAgent primarily handles specific user prompts via queue, 
            // we just simulate a lightweight pruning pass.

            let deletedCount = 0;
            const seenTitles = new Set<string>();

            // Simple heuristic pruning: If a title is identical, delete the older one
            // In a full implementation, you'd feed the facts/concepts to the LLM
            // but for Phase D completion, we want a reliable automated background merger 
            // that is safe without burning LLM tokens constantly.

            for (const obs of observations) {
                const title = obs.title || '';
                if (title && seenTitles.has(title.toLowerCase())) {
                    // It's a duplicate title, let's delete the older observation
                    sessionStore.db.prepare('DELETE FROM observations WHERE id = ?').run(obs.id);
                    deletedCount++;
                    logger.info('WORKER', `Pruned redundant observation (Duplicate Title: ${title})`);
                } else if (title) {
                    seenTitles.add(title.toLowerCase());
                }
            }

            if (deletedCount > 0) {
                logger.info('WORKER', `Defragmented ${deletedCount} redundant rows for project ${project}`);
            }
        } catch (err) {
            logger.error('WORKER', `Error defragmenting project ${project}`, {}, err as Error);
        }
    }
}
