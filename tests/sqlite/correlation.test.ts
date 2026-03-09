import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { CorrelationEngine } from '../../src/services/domain/CorrelationEngine.js';
import { ClaudeMemDatabase } from '../../src/services/sqlite/Database.js';

// Mock ChromaOrchestrator so we don't need a real Chroma DB running
const mockQueryDocuments = mock();
const mockConnect = mock();
const mockClose = mock();

mock.module('../../src/services/chroma/ChromaOrchestrator.js', () => {
    return {
        ChromaOrchestrator: class {
            connect = mockConnect;
            close = mockClose;
            queryDocuments = mockQueryDocuments;
        }
    };
});

describe('CorrelationEngine Tests', () => {
    let claudeDb: ClaudeMemDatabase;
    let engine: CorrelationEngine;

    beforeEach(() => {
        claudeDb = new ClaudeMemDatabase(':memory:');

        // Ensure missing tables from newer migrations are created manually
        // because the test env pathing prevents MigrationRunner from finding the scripts
        claudeDb.db.prepare(`
          CREATE TABLE IF NOT EXISTS projects (name TEXT PRIMARY KEY, is_current INTEGER DEFAULT 0, metadata TEXT)
        `).run();
        claudeDb.db.prepare(`
          CREATE TABLE IF NOT EXISTS observation_correlations (
            source_observation_id INTEGER NOT NULL,
            target_observation_id INTEGER NOT NULL,
            similarity_score REAL NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            PRIMARY KEY (source_observation_id, target_observation_id)
          )
        `).run();

        engine = new CorrelationEngine(claudeDb.db);

        mockQueryDocuments.mockClear();
        mockConnect.mockClear();
        mockClose.mockClear();
    });

    afterEach(() => {
        claudeDb.close();
    });

    it('should insert correlation when similar observation is found in a different session', async () => {
        const db = claudeDb.db;

        // Setup mock sessions and observations in SQLite
        db.prepare('INSERT OR IGNORE INTO projects (name) VALUES (?)').run('test-proj');

        // Insert sessions
        db.run('INSERT INTO sdk_sessions (content_session_id, memory_session_id, project, started_at, started_at_epoch, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['sess-1', 'mem-1', 'test-proj', new Date().toISOString(), Date.now(), 'completed']
        );
        db.run('INSERT INTO sdk_sessions (content_session_id, memory_session_id, project, started_at, started_at_epoch, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['sess-2', 'mem-2', 'test-proj', new Date().toISOString(), Date.now(), 'active']
        );

        // Insert an old observation
        const insertStmt = db.prepare('INSERT INTO observations (memory_session_id, project, type, text, title, created_at, created_at_epoch) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const oldObsId = insertStmt.run('mem-1', 'test-proj', 'fact', 'Mock text', 'Old Obs', new Date().toISOString(), Date.now()).lastInsertRowid as number;

        // Current observation (from mem-2)
        const currentObservation = {
            id: 999, // We just pass this in to the engine, it doesn't have to be strictly in DB for the correlation logic to run, but let's insert it
            memory_session_id: 'mem-2',
            project: 'test-proj',
            session_id: 'mem-2',
            title: 'New Obs',
            subtitle: '',
            facts: '',
            concepts: ''
        };

        const currentObsId = insertStmt.run('mem-2', 'test-proj', 'fact', 'Mock text', 'New Obs', new Date().toISOString(), Date.now()).lastInsertRowid as number;
        currentObservation.id = currentObsId;

        // Mock Chroma to return the old observation ID
        mockQueryDocuments.mockResolvedValue({
            ids: [['some-uuid']], // Assuming it returns a 2D array
            distances: [[0.5]], // Less than 1.0 threshold
            metadatas: [[{ sqlite_id: oldObsId }]]
        });

        // Run correlation
        await engine.correlateObservation(currentObservation as any);

        // Verify Chroma was called
        expect(mockConnect).toHaveBeenCalled();
        expect(mockQueryDocuments).toHaveBeenCalled();
        expect(mockClose).toHaveBeenCalled();

        // Verify correlation was inserted
        const correlations = db.prepare('SELECT * FROM observation_correlations').all() as any[];
        expect(correlations.length).toBe(1);

        // Ensure minimum ID logic works
        const minId = Math.min(oldObsId, currentObsId);
        const maxId = Math.max(oldObsId, currentObsId);
        expect(correlations[0].source_observation_id).toBe(minId);
        expect(correlations[0].target_observation_id).toBe(maxId);
        expect(correlations[0].similarity_score).toBe(0.5);
    });

    it('should skip correlation if observation is from the same session', async () => {
        const db = claudeDb.db;

        // Setup a single session with two observations
        db.prepare('INSERT OR IGNORE INTO projects (name) VALUES (?)').run('test-proj');

        db.run('INSERT INTO sdk_sessions (content_session_id, memory_session_id, project, started_at, started_at_epoch, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['sess-1', 'mem-1', 'test-proj', new Date().toISOString(), Date.now(), 'active']
        );

        const insertStmt = db.prepare('INSERT INTO observations (memory_session_id, project, type, text, title, created_at, created_at_epoch) VALUES (?, ?, ?, ?, ?, ?, ?)');

        // Both from mem-1
        const earlierObsId = insertStmt.run('mem-1', 'test-proj', 'fact', 'Mock', 'Obs 1', new Date().toISOString(), Date.now()).lastInsertRowid as number;
        const currentObsId = insertStmt.run('mem-1', 'test-proj', 'fact', 'Mock', 'Obs 2', new Date().toISOString(), Date.now()).lastInsertRowid as number;

        const currentObservation = {
            id: currentObsId,
            memory_session_id: 'mem-1',
            project: 'test-proj',
            session_id: 'mem-1',
            title: 'Obs 2'
        };

        // Chroma blindly returns the earlierObsId because they share keywords
        mockQueryDocuments.mockResolvedValue({
            ids: [['uuid-x']],
            distances: [[0.1]],
            metadatas: [[{ sqlite_id: earlierObsId }]]
        });

        // Run correlation
        await engine.correlateObservation(currentObservation as any);

        // Verify correlation was SKIPPED due to same session
        const correlations = db.prepare('SELECT * FROM observation_correlations').all();
        expect(correlations.length).toBe(0);
    });
});
