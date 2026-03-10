import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { DatabaseManager } from '../../src/services/worker/DatabaseManager.js';
import { SDKAgent } from '../../src/services/worker/SDKAgent.js';
import { SessionManager } from '../../src/services/worker/SessionManager.js';
import { DefragDaemon } from '../../src/services/worker/tasks/DefragDaemon.js';
import { createSDKSession, updateMemorySessionId } from '../../src/services/sqlite/Sessions.js';
import { storeObservation } from '../../src/services/sqlite/Observations.js';
import { BorgExtensionDatabase } from '../../src/services/sqlite/Database.js';

describe('DefragDaemon Integration Tests', () => {
    let dbManager: DatabaseManager;
    let sessionManager: SessionManager;
    let sdkAgent: SDKAgent;
    let daemon: DefragDaemon;
    let claudeDb: BorgExtensionDatabase;

    beforeEach(async () => {
        // 1. Create fully migrated in-memory DB
        claudeDb = new BorgExtensionDatabase(':memory:');

        // 2. Mock dbManager to return our migrated db
        dbManager = {
            getSessionStore: () => ({ db: claudeDb.db }) as any
        } as DatabaseManager;

        // 3. Mock dependencies
        const fakeSessionManager = {
            getSessionIdForPrompt: () => 'mock-id'
        } as any;

        const fakeSdkAgent = {
            // DefragDaemon doesn't actively invoke sdkAgent natively in this test version
        } as any;

        daemon = new DefragDaemon(dbManager, fakeSdkAgent);
    });

    afterEach(() => {
        daemon.stop();
        claudeDb.close();
    });

    it('should prune duplicate observation titles within the same project', async () => {
        const memorySessionId = 'mem-session-defrag';
        const project = 'test-project';
        const db = claudeDb.db;

        // Create actual project in DB to satisfy Foreign Keys
        db.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        name TEXT PRIMARY KEY,
        is_current INTEGER DEFAULT 0,
        metadata TEXT
      )
    `).run();
        db.prepare('INSERT OR IGNORE INTO projects (name, is_current, metadata) VALUES (?, 1, ?)').run(project, '{}');

        // Create a mock session matching observations.test.ts
        const numId = createSDKSession(db, 'content-1', project, 'test prompt');
        updateMemorySessionId(db, numId, memorySessionId);

        const baseObs = {
            subtitle: 'Subtitle',
            narrative: 'Narrative',
            facts: [],
            concepts: [],
            files_read: [],
            files_modified: []
        };

        // Insert 3 original observations + 2 duplicates
        storeObservation(db, memorySessionId, project, { ...baseObs, type: 'bugfix', title: 'Fix Auth' }, 1);
        await new Promise(r => setTimeout(r, 5));

        storeObservation(db, memorySessionId, project, { ...baseObs, type: 'feature', title: 'Add Login' }, 1);
        await new Promise(r => setTimeout(r, 5));

        storeObservation(db, memorySessionId, project, { ...baseObs, type: 'concept', title: 'User Module' }, 1);
        await new Promise(r => setTimeout(r, 5));

        // Duplicate title 1
        storeObservation(db, memorySessionId, project, { ...baseObs, type: 'bugfix', title: 'Fix Auth', narrative: 'Narrative 2' }, 1);
        await new Promise(r => setTimeout(r, 5));

        // Duplicate title 2 (case insensitive)
        storeObservation(db, memorySessionId, project, { ...baseObs, type: 'concept', title: 'USER MODULE', narrative: 'Narrative 3' }, 1);

        // Verify exactly 5 exist
        const beforeCount = db.prepare('SELECT count(*) as c FROM observations WHERE project = ?').get(project) as { c: number };
        expect(beforeCount.c).toBe(5);

        // Run defrag
        await daemon.run();

        // Verify exactly 3 exist
        const afterCount = db.prepare('SELECT count(*) as c FROM observations WHERE project = ?').get(project) as { c: number };
        expect(afterCount.c).toBe(3);

        // Verify the remaining titles are unique
        const remaining = db.prepare('SELECT title FROM observations WHERE project = ?').all(project) as { title: string }[];
        const titles = new Set(remaining.map(r => r.title.toLowerCase()));
        expect(titles.size).toBe(3);
        expect(titles.has('fix auth')).toBe(true);
        expect(titles.has('add login')).toBe(true);
        expect(titles.has('user module')).toBe(true);
    });
});
