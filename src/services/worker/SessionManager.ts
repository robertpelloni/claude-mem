/**
 * SessionManager: Event-driven session lifecycle
 *
 * Responsibility:
 * - Manage active session lifecycle
 * - Handle event-driven message queues
 * - Coordinate between HTTP requests and SDK agent
 * - Zero-latency event notification (no polling)
 */

import { EventEmitter } from 'events';
import { DatabaseManager } from './DatabaseManager.js';
import { logger } from '../../utils/logger.js';
import type { ActiveSession, PendingMessage, ObservationData } from '../worker-types.js';

export class SessionManager {
  private dbManager: DatabaseManager;
  private sessions: Map<number, ActiveSession> = new Map();
  private sessionQueues: Map<number, EventEmitter> = new Map();

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
  }

  /**
   * Initialize a new session or return existing one
   */
  initializeSession(sessionDbId: number): ActiveSession {
    // Check if already active
    let session = this.sessions.get(sessionDbId);
    if (session) {
      return session;
    }

    // Fetch from database
    const dbSession = this.dbManager.getSessionById(sessionDbId);

    // Create active session
    session = {
      sessionDbId,
      claudeSessionId: dbSession.claude_session_id,
      sdkSessionId: null,
      jitSessionId: null,
      jitAbortController: null,
      jitGeneratorPromise: null,
      project: dbSession.project,
      userPrompt: dbSession.user_prompt,
      pendingMessages: [],
      abortController: new AbortController(),
      generatorPromise: null,
      lastPromptNumber: this.dbManager.getSessionStore().getPromptCounter(sessionDbId),
      startTime: Date.now()
    };

    this.sessions.set(sessionDbId, session);

    // Create event emitter for queue notifications
    const emitter = new EventEmitter();
    this.sessionQueues.set(sessionDbId, emitter);

    logger.info('WORKER', 'Session initialized', { sessionDbId, project: session.project });

    return session;
  }

  /**
   * Get active session by ID
   */
  getSession(sessionDbId: number): ActiveSession | undefined {
    return this.sessions.get(sessionDbId);
  }

  /**
   * Queue an observation for processing (zero-latency notification)
   * Auto-initializes session if not in memory but exists in database
   */
  queueObservation(sessionDbId: number, data: ObservationData): void {
    // Auto-initialize from database if needed (handles worker restarts)
    let session = this.sessions.get(sessionDbId);
    if (!session) {
      session = this.initializeSession(sessionDbId);
    }

    session.pendingMessages.push({
      type: 'observation',
      tool_name: data.tool_name,
      tool_input: data.tool_input,
      tool_response: data.tool_response,
      prompt_number: data.prompt_number
    });

    // Notify generator immediately (zero latency)
    const emitter = this.sessionQueues.get(sessionDbId);
    emitter?.emit('message');

    logger.debug('WORKER', 'Observation queued', {
      sessionDbId,
      queueLength: session.pendingMessages.length
    });
  }

  /**
   * Queue a summarize request (zero-latency notification)
   * Auto-initializes session if not in memory but exists in database
   */
  queueSummarize(sessionDbId: number): void {
    // Auto-initialize from database if needed (handles worker restarts)
    let session = this.sessions.get(sessionDbId);
    if (!session) {
      session = this.initializeSession(sessionDbId);
    }

    session.pendingMessages.push({ type: 'summarize' });

    const emitter = this.sessionQueues.get(sessionDbId);
    emitter?.emit('message');

    logger.debug('WORKER', 'Summarize queued', { sessionDbId });
  }

  /**
   * Complete a session (abort SDK agents and cleanup in-memory resources)
   * NOTE: Does not delete from database - only marks as completed
   */
  async deleteSession(sessionDbId: number): Promise<void> {
    const session = this.sessions.get(sessionDbId);
    if (!session) {
      return; // Already cleaned up
    }

    // Abort the main SDK agent
    session.abortController.abort();

    // Abort the JIT session if it exists
    if (session.jitAbortController) {
      session.jitAbortController.abort();
    }

    // Wait for main generator to finish
    if (session.generatorPromise) {
      await session.generatorPromise.catch(() => {});
    }

    // Wait for JIT generator to finish
    if (session.jitGeneratorPromise) {
      await session.jitGeneratorPromise.catch(() => {});
    }

    // Cleanup in-memory resources
    this.sessions.delete(sessionDbId);
    this.sessionQueues.delete(sessionDbId);

    logger.info('WORKER', 'Session completed and cleaned up', { sessionDbId });
  }

  private static readonly MAX_SESSION_IDLE_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Reap sessions with no active generator and no pending work that have been idle too long.
   * This unblocks the orphan reaper which skips processes for "active" sessions. (Issue #1168)
   */
  async reapStaleSessions(): Promise<number> {
    const now = Date.now();
    const staleSessionIds: number[] = [];

    for (const [sessionDbId, session] of this.sessions) {
      // Skip sessions with active generators
      if (session.generatorPromise) continue;

      // Skip sessions with pending work
      const pendingCount = this.getPendingStore().getPendingCount(sessionDbId);
      if (pendingCount > 0) continue;

      // No generator + no pending work + old enough = stale
      const sessionAge = now - session.startTime;
      if (sessionAge > SessionManager.MAX_SESSION_IDLE_MS) {
        staleSessionIds.push(sessionDbId);
      }
    }

    for (const sessionDbId of staleSessionIds) {
      logger.warn('SESSION', `Reaping stale session ${sessionDbId} (no activity for >${Math.round(SessionManager.MAX_SESSION_IDLE_MS / 60000)}m)`, { sessionDbId });
      await this.deleteSession(sessionDbId);
    }

    return staleSessionIds.length;
  }

  /**
   * Shutdown all active sessions
   */
  async shutdownAll(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    await Promise.all(sessionIds.map(id => this.deleteSession(id)));
  }

  /**
   * Check if any session has pending messages (for spinner tracking)
   */
  hasPendingMessages(): boolean {
    return Array.from(this.sessions.values()).some(
      session => session.pendingMessages.length > 0
    );
  }

  /**
   * Get number of active sessions (for stats)
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get message iterator for SDKAgent to consume (event-driven, no polling)
   * Auto-initializes session if not in memory but exists in database
   */
  async *getMessageIterator(sessionDbId: number): AsyncIterableIterator<PendingMessage> {
    // Auto-initialize from database if needed (handles worker restarts)
    let session = this.sessions.get(sessionDbId);
    if (!session) {
      session = this.initializeSession(sessionDbId);
    }

    const emitter = this.sessionQueues.get(sessionDbId);
    if (!emitter) {
      throw new Error(`No emitter for session ${sessionDbId}`);
    }

    while (!session.abortController.signal.aborted) {
      // Wait for messages if queue is empty
      if (session.pendingMessages.length === 0) {
        await new Promise<void>(resolve => {
          const handler = () => resolve();
          emitter.once('message', handler);

<<<<<<< HEAD
          // Also listen for abort
          session.abortController.signal.addEventListener('abort', () => {
            emitter.off('message', handler);
            resolve();
          }, { once: true });
        });
=======
    // Use the robust iterator - messages are deleted on claim (no tracking needed)
    // CRITICAL: Pass onIdleTimeout callback that triggers abort to kill the subprocess
    // Without this, the iterator returns but the Claude subprocess stays alive as a zombie
    for await (const message of processor.createIterator({
      sessionDbId,
      signal: session.abortController.signal,
      onIdleTimeout: () => {
        logger.info('SESSION', 'Triggering abort due to idle timeout to kill subprocess', { sessionDbId });
        session.idleTimedOut = true;
        session.abortController.abort();
      }
    })) {
      // Track earliest timestamp for accurate observation timestamps
      // This ensures backlog messages get their original timestamps, not current time
      if (session.earliestPendingTimestamp === null) {
        session.earliestPendingTimestamp = message._originalTimestamp;
      } else {
        session.earliestPendingTimestamp = Math.min(session.earliestPendingTimestamp, message._originalTimestamp);
>>>>>>> upstream/main
      }

      // Yield all pending messages
      while (session.pendingMessages.length > 0) {
        const message = session.pendingMessages.shift()!;
        yield message;
      }
    }
  }
}
