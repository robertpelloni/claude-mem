import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { ClaudeMemDatabase } from '../../src/services/sqlite/Database.js';
import { createSDKSession, updateMemorySessionId } from '../../src/services/sqlite/Sessions.js';
import { storeObservation } from '../../src/services/sqlite/Observations.js';
import type { Database } from 'bun:sqlite';

describe('Endurance & Throughput Benchmark', () => {
    let db: Database;
    let sessionId: number;
    let memorySessionId: string;

    beforeAll(() => {
        db = new ClaudeMemDatabase(':memory:').db;
        memorySessionId = `mem-endurance-${Date.now()}`;
        sessionId = createSDKSession(db, `content-${Date.now()}`, 'Endurance Project', 'Benchmark context saturation');
        updateMemorySessionId(db, sessionId, memorySessionId);
    });

    afterAll(() => {
        db.close();
    });

    it('should handle rapid observation ingestion without error (1000 items)', () => {
        const start = performance.now();
        console.log(`Starting insertion into Session ID: ${sessionId} (Memory ID: ${memorySessionId})`);

        for (let i = 0; i < 1000; i++) {
            storeObservation(db, memorySessionId, 'Endurance Project', {
                type: 'mcp_execution',
                title: `Simulated Code Reading ${i}`,
                subtitle: 'Reading files',
                facts: ['read fake file'],
                narrative: `Simulated output chunk. This represents typical code reading. ${i}`,
                concepts: ['endurance'],
                files_read: ['fake-file.ts'],
                files_modified: []
            }, i, 0);
        }

        const elapsed = performance.now() - start;
        console.log(`Inserted 1000 observations in ${elapsed.toFixed(2)}ms`);
        // SQLite insertion of 1000 items should be extremely fast (<1s)
        expect(elapsed).toBeLessThan(1000);
    });
});
