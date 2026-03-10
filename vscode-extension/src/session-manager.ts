/**
 * Session Manager for VSCode Extension
 * Manages mapping between Copilot conversation IDs and claude-mem session IDs
 */

import * as vscode from 'vscode';
import * as workerClient from './worker-client';

export interface SessionData {
  sessionDbId: number;
  conversationId: string;
  project: string;
  promptNumber: number;
  startTime: number;
}

/**
 * Manages active sessions in memory
 */
export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();

  constructor() { }

  /**
   * Create or get existing session
   */
  async createSession(conversationId: string, project: string, userPrompt: string): Promise<SessionData> {
    // Check if session already exists in memory
    if (this.sessions.has(conversationId)) {
      return this.sessions.get(conversationId)!;
    }

    try {
      // Use walker client to initialize
      const { sessionDbId, promptNumber } = await workerClient.initSession(conversationId, project, userPrompt);

      const sessionData: SessionData = {
        sessionDbId,
        conversationId,
        project,
        promptNumber,
        startTime: Date.now()
      };

      this.sessions.set(conversationId, sessionData);
      return sessionData;
    } catch (e: any) {
      console.warn('Failed to alert worker of new session, proceeding with local tracking only:', e);
      // Fallback local-only execution
      const sessionData: SessionData = {
        sessionDbId: -1,
        conversationId,
        project,
        promptNumber: 1,
        startTime: Date.now()
      };
      this.sessions.set(conversationId, sessionData);
      return sessionData;
    }
  }

  /**
   * Get session by conversation ID
   */
  getSession(conversationId: string): SessionData | undefined {
    return this.sessions.get(conversationId);
  }

  /**
   * Increment prompt counter for a session
   */
  incrementPromptCounter(conversationId: string): number {
    const session = this.sessions.get(conversationId);
    if (!session) {
      throw new Error(`Session not found: ${conversationId}`);
    }

    session.promptNumber++;
    return session.promptNumber;
  }

  /**
   * Get current prompt counter
   */
  getPromptCounter(conversationId: string): number {
    const session = this.sessions.get(conversationId);
    return session?.promptNumber || 1;
  }

  /**
   * Save user prompt internally
   * The actual DB save happens via workerClient in extension.ts
   */
  async saveUserPrompt(conversationId: string, promptNumber: number, promptText: string): Promise<void> {
    // Tracking is handled via the worker HTTP API elsewhere.
    return;
  }

  /**
   * Mark session as complete
   */
  async completeSession(conversationId: string): Promise<void> {
    const session = this.sessions.get(conversationId);
    if (!session) {
      return; // Already cleaned up or never existed
    }

    try {
      await workerClient.completeSession(conversationId);
    } catch (e) {
      console.warn('Silent failure to complete session via HTTP:', e);
    }

    // Remove from memory
    this.sessions.delete(conversationId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clear all sessions (for testing/debugging)
   */
  clearAll(): void {
    this.sessions.clear();
  }
}
