import { Database } from 'bun:sqlite';
import { ChromaOrchestrator } from '../chroma/ChromaOrchestrator.js';
import { logger } from '../../utils/logger.js';
import { MemoryRow } from '../sqlite/types.js';

export class CorrelationEngine {
    private db: Database;
    private chroma: ChromaOrchestrator;

    constructor(db: Database) {
        this.db = db;
        this.chroma = new ChromaOrchestrator();
    }

    /**
     * Evaluates a single observation against past knowledge using ChromaDB semantic search.
     * If related observations from other sessions are found, it inserts correlation records.
     */
    async correlateObservation(observation: MemoryRow): Promise<void> {
        const SIMILARITY_THRESHOLD = 1.0; // Typical Chroma L2 distance threshold
        const MAX_CORRELATIONS = 3;

        try {
            await this.chroma.connect();

            // Build a dense text representation for semantic search
            const queryText = [
                observation.title || '',
                observation.subtitle || '',
                observation.facts || '',
                observation.concepts || ''
            ].filter(Boolean).join(' ');

            if (!queryText.trim()) {
                return; // Nothing to correlate
            }

            // Query Chroma for similar documents
            const results = await this.chroma.queryDocuments(
                queryText,
                15, // Fetch top 15 to leave room to filter out same-session
                { project: observation.project } // Only match within same project
            );

            // Extract metadata
            const metadatas = results.metadatas[0] || [];
            const distances = results.distances[0] || [];

            let correlationsAdded = 0;

            for (let i = 0; i < metadatas.length; i++) {
                if (correlationsAdded >= MAX_CORRELATIONS) break;

                const meta = metadatas[i];
                const distance = distances[i];

                // Skip if missing ID, or distance is too far
                // Chroma might store session_id as well, but we can double-check via DB if necessary
                if (!meta.sqlite_id || distance > SIMILARITY_THRESHOLD) {
                    continue;
                }

                const targetId = meta.sqlite_id;

                // Verify target observation is not from the same exact session
                const targetRecord = this.db.prepare('SELECT memory_session_id FROM observations WHERE id = ?').get(targetId) as { memory_session_id: string } | undefined;
                if (!targetRecord || targetRecord.memory_session_id === observation.memory_session_id) {
                    continue;
                }

                const sourceId = observation.id;
                const targetObsId = targetId;

                // DB requires source and target. We'll order them smallest first to avoid duplicates (since UNIQUE constraint)
                const minId = Math.min(sourceId, targetObsId);
                const maxId = Math.max(sourceId, targetObsId);

                // Don't correlate with self (should be caught by session check, but just in case)
                if (minId === maxId) continue;

                try {
                    this.db.run(`
            INSERT OR IGNORE INTO observation_correlations 
            (source_observation_id, target_observation_id, similarity_score, created_at_epoch)
            VALUES (?, ?, ?, ?)
          `, [
                        minId,
                        maxId,
                        distance,
                        Date.now()
                    ]);

                    correlationsAdded++;
                } catch (err) {
                    logger.error('WORKER', `Failed to insert correlation ${minId} -> ${maxId}`, { error: err as Error });
                }
            }

            if (correlationsAdded > 0) {
                logger.info('WORKER', `Correlated observation [${observation.id}] with ${correlationsAdded} prior memories.`);
            }

        } catch (error) {
            logger.error('WORKER', 'CorrelationEngine failed to query ChromaDB', { error: error as Error });
        } finally {
            await this.chroma.close();
        }
    }
}
