/**
 * Session Completion Handler
 *
 * Consolidates session completion logic for manual session deletion/completion.
 * Used by DELETE /api/sessions/:id and POST /api/sessions/:id/complete endpoints.
 *
 * Completion flow:
 * 1. Delete session from SessionManager (aborts SDK agent, cleans up in-memory state)
 * 2. Broadcast session completed event (updates UI spinner)
 */

import { SessionManager } from '../SessionManager.js';
import { SessionEventBroadcaster } from '../events/SessionEventBroadcaster.js';
import { logger } from '../../../utils/logger.js';
import { HandoffGenerator } from './HandoffGenerator.js';
import { DatabaseManager } from '../DatabaseManager.js';

export class SessionCompletionHandler {
  private handoffGenerator?: HandoffGenerator;

  constructor(
    private sessionManager: SessionManager,
    private eventBroadcaster: SessionEventBroadcaster,
    private dbManager?: DatabaseManager
  ) {
    if (dbManager) {
      this.handoffGenerator = new HandoffGenerator(dbManager);
    }
  }

  /**
   * Complete session by database ID
   * Used by DELETE /api/sessions/:id and POST /api/sessions/:id/complete
   */
  async completeByDbId(sessionDbId: number, cwd?: string): Promise<void> {
    if (this.handoffGenerator && cwd) {
      // Auto-generate HANDOFF.md before deleting session from manager
      await this.handoffGenerator.generateHandoff(sessionDbId, cwd);
    }

    // Delete from session manager (aborts SDK agent)
    await this.sessionManager.deleteSession(sessionDbId);

    // Broadcast session completed event
    this.eventBroadcaster.broadcastSessionCompleted(sessionDbId);
  }
}
