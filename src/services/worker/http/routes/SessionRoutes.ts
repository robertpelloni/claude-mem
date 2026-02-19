/**
 * Session Routes
 *
 * Handles session lifecycle operations: initialization, observations, summarization, completion.
 * These routes manage the flow of work through the Claude Agent SDK.
 */

import express, { Request, Response } from 'express';
import { getWorkerPort } from '../../../../shared/worker-utils.js';
import { logger } from '../../../../utils/logger.js';
import { stripMemoryTagsFromJson } from '../../../../utils/tag-stripping.js';
import { SessionManager } from '../../SessionManager.js';
import { DatabaseManager } from '../../DatabaseManager.js';
import { SDKAgent } from '../../SDKAgent.js';
import type { WorkerService } from '../../../worker-service.js';
import { BaseRouteHandler } from '../BaseRouteHandler.js';
import { SessionEventBroadcaster } from '../../events/SessionEventBroadcaster.js';
import { SessionCompletionHandler } from '../../session/SessionCompletionHandler.js';
import { PrivacyCheckValidator } from '../../validation/PrivacyCheckValidator.js';
<<<<<<< HEAD
=======
import { SettingsDefaultsManager } from '../../../../shared/SettingsDefaultsManager.js';
import { USER_SETTINGS_PATH } from '../../../../shared/paths.js';
import { getProcessBySession, ensureProcessExit } from '../../ProcessRegistry.js';
>>>>>>> upstream/main

export class SessionRoutes extends BaseRouteHandler {
  private completionHandler: SessionCompletionHandler;

  constructor(
    private sessionManager: SessionManager,
    private dbManager: DatabaseManager,
    private sdkAgent: SDKAgent,
    private eventBroadcaster: SessionEventBroadcaster,
    private workerService: WorkerService
  ) {
    super();
    this.completionHandler = new SessionCompletionHandler(
      sessionManager,
      dbManager,
      eventBroadcaster
    );
  }

  /**
   * Ensures SDK agent generator is running for a session
   * Auto-starts if not already running to process pending queue
   */
  private ensureGeneratorRunning(sessionDbId: number, source: string): void {
    const session = this.sessionManager.getSession(sessionDbId);
    if (session && !session.generatorPromise) {
      logger.info('SESSION', `Generator auto-starting (${source})`, {
        sessionId: sessionDbId,
        queueDepth: session.pendingMessages.length
      });

      session.generatorPromise = this.sdkAgent.startSession(session, this.workerService)
        .catch(err => {
          logger.failure('SDK', 'SDK agent error', { sessionId: sessionDbId }, err);
        })
        .finally(() => {
          logger.info('SESSION', `Generator finished`, { sessionId: sessionDbId });
          session.generatorPromise = null;
          this.workerService.broadcastProcessingStatus();
        });
    }
  }

<<<<<<< HEAD
=======
  /**
   * Start a generator with the specified provider
   */
  private startGeneratorWithProvider(
    session: ReturnType<typeof this.sessionManager.getSession>,
    provider: 'claude' | 'gemini' | 'openrouter',
    source: string
  ): void {
    if (!session) return;

    // Reset AbortController if it was previously aborted
    // This fixes the bug where a session gets stuck in an infinite "Generator aborted" loop
    // after its AbortController was aborted (e.g., from a previous generator exit)
    if (session.abortController.signal.aborted) {
      logger.debug('SESSION', 'Resetting aborted AbortController before starting generator', {
        sessionId: session.sessionDbId
      });
      session.abortController = new AbortController();
    }

    const agent = provider === 'openrouter' ? this.openRouterAgent : (provider === 'gemini' ? this.geminiAgent : this.sdkAgent);
    const agentName = provider === 'openrouter' ? 'OpenRouter' : (provider === 'gemini' ? 'Gemini' : 'Claude SDK');

    // Use database count for accurate telemetry (in-memory array is always empty due to FK constraint fix)
    const pendingStore = this.sessionManager.getPendingMessageStore();
    const actualQueueDepth = pendingStore.getPendingCount(session.sessionDbId);

    logger.info('SESSION', `Generator auto-starting (${source}) using ${agentName}`, {
      sessionId: session.sessionDbId,
      queueDepth: actualQueueDepth,
      historyLength: session.conversationHistory.length
    });

    // Track which provider is running
    session.currentProvider = provider;

    session.generatorPromise = agent.startSession(session, this.workerService)
      .catch(error => {
        // Only log non-abort errors
        if (session.abortController.signal.aborted) return;
        
        logger.error('SESSION', `Generator failed`, {
          sessionId: session.sessionDbId,
          provider: provider,
          error: error.message
        }, error);

        // Mark all processing messages as failed so they can be retried or abandoned
        const pendingStore = this.sessionManager.getPendingMessageStore();
        try {
          const failedCount = pendingStore.markSessionMessagesFailed(session.sessionDbId);
          if (failedCount > 0) {
            logger.error('SESSION', `Marked messages as failed after generator error`, {
              sessionId: session.sessionDbId,
              failedCount
            });
          }
        } catch (dbError) {
          logger.error('SESSION', 'Failed to mark messages as failed', {
            sessionId: session.sessionDbId
          }, dbError as Error);
        }
      })
      .finally(async () => {
        // CRITICAL: Verify subprocess exit to prevent zombie accumulation (Issue #1168)
        const tracked = getProcessBySession(session.sessionDbId);
        if (tracked && !tracked.process.killed && tracked.process.exitCode === null) {
          await ensureProcessExit(tracked, 5000);
        }

        const sessionDbId = session.sessionDbId;
        this.spawnInProgress.delete(sessionDbId);
        const wasAborted = session.abortController.signal.aborted;

        if (wasAborted) {
          logger.info('SESSION', `Generator aborted`, { sessionId: sessionDbId });
        } else {
          logger.error('SESSION', `Generator exited unexpectedly`, { sessionId: sessionDbId });
        }

        session.generatorPromise = null;
        session.currentProvider = null;
        this.workerService.broadcastProcessingStatus();

        // Crash recovery: If not aborted and still has work, restart (with limit)
        if (!wasAborted) {
          try {
            const pendingStore = this.sessionManager.getPendingMessageStore();
            const pendingCount = pendingStore.getPendingCount(sessionDbId);

            // CRITICAL: Limit consecutive restarts to prevent infinite loops
            // This prevents runaway API costs when there's a persistent error (e.g., memorySessionId not captured)
            const MAX_CONSECUTIVE_RESTARTS = 3;

            if (pendingCount > 0) {
              // GUARD: Prevent duplicate crash recovery spawns
              if (this.crashRecoveryScheduled.has(sessionDbId)) {
                logger.debug('SESSION', 'Crash recovery already scheduled', { sessionDbId });
                return;
              }

              session.consecutiveRestarts = (session.consecutiveRestarts || 0) + 1;

              if (session.consecutiveRestarts > MAX_CONSECUTIVE_RESTARTS) {
                logger.error('SESSION', `CRITICAL: Generator restart limit exceeded - stopping to prevent runaway costs`, {
                  sessionId: sessionDbId,
                  pendingCount,
                  consecutiveRestarts: session.consecutiveRestarts,
                  maxRestarts: MAX_CONSECUTIVE_RESTARTS,
                  action: 'Generator will NOT restart. Check logs for root cause. Messages remain in pending state.'
                });
                // Don't restart - abort to prevent further API calls
                session.abortController.abort();
                return;
              }

              logger.info('SESSION', `Restarting generator after crash/exit with pending work`, {
                sessionId: sessionDbId,
                pendingCount,
                consecutiveRestarts: session.consecutiveRestarts,
                maxRestarts: MAX_CONSECUTIVE_RESTARTS
              });

              // Abort OLD controller before replacing to prevent child process leaks
              const oldController = session.abortController;
              session.abortController = new AbortController();
              oldController.abort();

              this.crashRecoveryScheduled.add(sessionDbId);

              // Exponential backoff: 1s, 2s, 4s for subsequent restarts
              const backoffMs = Math.min(1000 * Math.pow(2, session.consecutiveRestarts - 1), 8000);

              // Delay before restart with exponential backoff
              setTimeout(() => {
                this.crashRecoveryScheduled.delete(sessionDbId);
                const stillExists = this.sessionManager.getSession(sessionDbId);
                if (stillExists && !stillExists.generatorPromise) {
                  this.startGeneratorWithProvider(stillExists, this.getSelectedProvider(), 'crash-recovery');
                }
              }, backoffMs);
            } else {
              // No pending work - abort to kill the child process
              session.abortController.abort();
              // Reset restart counter on successful completion
              session.consecutiveRestarts = 0;
              logger.debug('SESSION', 'Aborted controller after natural completion', {
                sessionId: sessionDbId
              });
            }
          } catch (e) {
            // Ignore errors during recovery check, but still abort to prevent leaks
            logger.debug('SESSION', 'Error during recovery check, aborting to prevent leaks', { sessionId: sessionDbId, error: e instanceof Error ? e.message : String(e) });
            session.abortController.abort();
          }
        }
        // NOTE: We do NOT delete the session here anymore.
        // The generator waits for events, so if it exited, it's either aborted or crashed.
        // Idle sessions stay in memory (ActiveSession is small) to listen for future events.
      });
  }

>>>>>>> upstream/main
  setupRoutes(app: express.Application): void {
    // Legacy session endpoints (use sessionDbId)
    app.post('/sessions/:sessionDbId/init', this.handleSessionInit.bind(this));
    app.post('/sessions/:sessionDbId/observations', this.handleObservations.bind(this));
    app.post('/sessions/:sessionDbId/summarize', this.handleSummarize.bind(this));
    app.get('/sessions/:sessionDbId/status', this.handleSessionStatus.bind(this));
    app.delete('/sessions/:sessionDbId', this.handleSessionDelete.bind(this));
    app.post('/sessions/:sessionDbId/complete', this.handleSessionComplete.bind(this));

    // New session endpoints (use claudeSessionId)
    app.post('/api/sessions/pre-tool-use', this.handlePreToolUse.bind(this));
    app.get('/api/sessions/observations-for-tool-use/:toolUseId', this.handleGetObservationsForToolUse.bind(this));
    app.post('/api/sessions/observations', this.handleObservationsByClaudeId.bind(this));
    app.post('/api/sessions/summarize', this.handleSummarizeByClaudeId.bind(this));
    app.post('/api/sessions/complete', this.handleSessionCompleteByClaudeId.bind(this));
  }

  /**
   * Initialize a new session
   */
  private handleSessionInit = this.wrapHandler((req: Request, res: Response): void => {
    const sessionDbId = this.parseIntParam(req, res, 'sessionDbId');
    if (sessionDbId === null) return;

    const { userPrompt, promptNumber } = req.body;
    const session = this.sessionManager.initializeSession(sessionDbId, userPrompt, promptNumber);

    // Get the latest user_prompt for this session to sync to Chroma
    const latestPrompt = this.dbManager.getSessionStore().getLatestUserPrompt(session.claudeSessionId);

    // Broadcast new prompt to SSE clients (for web UI)
    if (latestPrompt) {
      this.eventBroadcaster.broadcastNewPrompt({
        id: latestPrompt.id,
        claude_session_id: latestPrompt.claude_session_id,
        project: latestPrompt.project,
        prompt_number: latestPrompt.prompt_number,
        prompt_text: latestPrompt.prompt_text,
        created_at_epoch: latestPrompt.created_at_epoch
      });

      // Sync user prompt to Chroma with error logging
      const chromaStart = Date.now();
      const promptText = latestPrompt.prompt_text;
      this.dbManager.getChromaSync().syncUserPrompt(
        latestPrompt.id,
        latestPrompt.sdk_session_id,
        latestPrompt.project,
        promptText,
        latestPrompt.prompt_number,
        latestPrompt.created_at_epoch
      ).then(() => {
        const chromaDuration = Date.now() - chromaStart;
        const truncatedPrompt = promptText.length > 60
          ? promptText.substring(0, 60) + '...'
          : promptText;
        logger.debug('CHROMA', 'User prompt synced', {
          promptId: latestPrompt.id,
          duration: `${chromaDuration}ms`,
          prompt: truncatedPrompt
        });
      }).catch(err => {
        logger.error('CHROMA', 'Failed to sync user_prompt', {
          promptId: latestPrompt.id,
          sessionId: sessionDbId
        }, err);
      });
    }

    // Start SDK agent in background (pass worker ref for spinner control)
    logger.info('SESSION', 'Generator starting', {
      sessionId: sessionDbId,
      project: session.project,
      promptNum: session.lastPromptNumber
    });

    session.generatorPromise = this.sdkAgent.startSession(session, this.workerService)
      .catch(err => {
        logger.failure('SDK', 'SDK agent error', { sessionId: sessionDbId }, err);
      })
      .finally(() => {
        // Clear generator reference when completed
        logger.info('SESSION', `Generator finished`, { sessionId: sessionDbId });
        session.generatorPromise = null;
        // Broadcast status change (generator finished, may stop spinner)
        this.workerService.broadcastProcessingStatus();
      });

    // Broadcast session started event
    this.eventBroadcaster.broadcastSessionStarted(sessionDbId, session.project);

    res.json({ status: 'initialized', sessionDbId, port: getWorkerPort() });
  });

  /**
   * Queue observations for processing
   * CRITICAL: Ensures SDK agent is running to process the queue (ALWAYS SAVE EVERYTHING)
   */
  private handleObservations = this.wrapHandler((req: Request, res: Response): void => {
    const sessionDbId = this.parseIntParam(req, res, 'sessionDbId');
    if (sessionDbId === null) return;

    const { tool_name, tool_input, tool_response, prompt_number, cwd } = req.body;

    this.sessionManager.queueObservation(sessionDbId, {
      tool_name,
      tool_input,
      tool_response,
      prompt_number,
      cwd
    });

    // CRITICAL: Ensure SDK agent is running to consume the queue
    this.ensureGeneratorRunning(sessionDbId, 'observation');

    // Broadcast observation queued event
    this.eventBroadcaster.broadcastObservationQueued(sessionDbId);

    res.json({ status: 'queued' });
  });

  /**
   * Queue summarize request
   * CRITICAL: Ensures SDK agent is running to process the queue (ALWAYS SAVE EVERYTHING)
   */
  private handleSummarize = this.wrapHandler((req: Request, res: Response): void => {
    const sessionDbId = this.parseIntParam(req, res, 'sessionDbId');
    if (sessionDbId === null) return;

    const { last_user_message, last_assistant_message } = req.body;

    this.sessionManager.queueSummarize(sessionDbId, last_user_message, last_assistant_message);

    // CRITICAL: Ensure SDK agent is running to consume the queue
    this.ensureGeneratorRunning(sessionDbId, 'summarize');

    // Broadcast summarize queued event
    this.eventBroadcaster.broadcastSummarizeQueued();

    res.json({ status: 'queued' });
  });

  /**
   * Get session status
   */
  private handleSessionStatus = this.wrapHandler((req: Request, res: Response): void => {
    const sessionDbId = this.parseIntParam(req, res, 'sessionDbId');
    if (sessionDbId === null) return;

    const session = this.sessionManager.getSession(sessionDbId);

    if (!session) {
      res.json({ status: 'not_found' });
      return;
    }

    res.json({
      status: 'active',
      sessionDbId,
      project: session.project,
      queueLength: session.pendingMessages.length,
      uptime: Date.now() - session.startTime
    });
  });

  /**
   * Delete a session
   */
  private handleSessionDelete = this.wrapHandler(async (req: Request, res: Response): Promise<void> => {
    const sessionDbId = this.parseIntParam(req, res, 'sessionDbId');
    if (sessionDbId === null) return;

    await this.completionHandler.completeByDbId(sessionDbId);

    res.json({ status: 'deleted' });
  });

  /**
   * Complete a session (backward compatibility for cleanup-hook)
   * cleanup-hook expects POST /sessions/:sessionDbId/complete instead of DELETE
   */
  private handleSessionComplete = this.wrapHandler(async (req: Request, res: Response): Promise<void> => {
    const sessionDbId = this.parseIntParam(req, res, 'sessionDbId');
    if (sessionDbId === null) return;

    await this.completionHandler.completeByDbId(sessionDbId);

    res.json({ success: true });
  });

  /**
   * Track tool execution start timestamp (pre-tool-use-hook uses this)
   * POST /api/sessions/pre-tool-use
   * Body: { claudeSessionId, toolUseId, timestamp }
   *
   * Phase 1: Just log for now - will be used in Phase 2 for observation correlation
   */
  private handlePreToolUse = this.wrapHandler((req: Request, res: Response): void => {
    const { claudeSessionId, toolUseId, timestamp } = req.body;

    if (!claudeSessionId || !toolUseId) {
      return this.badRequest(res, 'Missing claudeSessionId or toolUseId');
    }

    logger.debug('HOOK', 'PreToolUse tracking received', {
      claudeSessionId,
      toolUseId,
      timestamp
    });

    // Phase 1: Just acknowledge - Phase 2 will store this for observation correlation
    res.json({ status: 'tracked' });
  });

  /**
   * Get observations for a specific tool_use_id (Endless Mode v7.1)
   * GET /api/sessions/observations-for-tool-use/:toolUseId
   *
   * Returns all observations created for this tool execution
   */
  private handleGetObservationsForToolUse = this.wrapHandler((req: Request, res: Response): void => {
    const { toolUseId } = req.params;

    if (!toolUseId) {
      return this.badRequest(res, 'Missing toolUseId');
    }

    const store = this.dbManager.getSessionStore();
    const observations = store.getObservationsByToolUseId(toolUseId);

    logger.debug('HOOK', 'Observations retrieved for tool_use_id', {
      toolUseId,
      count: observations.length
    });

    res.json({ observations });
  });

  /**
   * Queue observations by claudeSessionId (post-tool-use-hook uses this)
   * POST /api/sessions/observations
   * Body: { claudeSessionId, tool_name, tool_input, tool_response, cwd, toolUseId }
   * Query: ?wait_until_obs_is_saved=true (optional, for Endless Mode v7.1)
   */
  private handleObservationsByClaudeId = this.wrapHandler(async (req: Request, res: Response): Promise<void> => {
    const { claudeSessionId, tool_name, tool_input, tool_response, cwd, toolUseId } = req.body;
    const waitForCompletion = req.query.wait_until_obs_is_saved === 'true';

    logger.info('HTTP', 'Observation request received', {
      claudeSessionId,
      tool_name,
      waitForCompletion,
      queryParam: req.query.wait_until_obs_is_saved
    });

    if (!claudeSessionId) {
      return this.badRequest(res, 'Missing claudeSessionId');
    }

    const store = this.dbManager.getSessionStore();

    // Get or create session
    const sessionDbId = store.createSDKSession(claudeSessionId, '', '');
    const promptNumber = store.getPromptCounter(sessionDbId);

    // Privacy check: skip if user prompt was entirely private
    const userPrompt = PrivacyCheckValidator.checkUserPromptPrivacy(
      store,
      claudeSessionId,
      promptNumber,
      'observation',
      sessionDbId,
      { tool_name }
    );
    if (!userPrompt) {
      res.json({ status: 'skipped', reason: 'private' });
      return;
    }

    // Strip memory tags from tool_input and tool_response
    let cleanedToolInput = '{}';
    let cleanedToolResponse = '{}';

    try {
      cleanedToolInput = tool_input !== undefined
        ? stripMemoryTagsFromJson(JSON.stringify(tool_input))
        : '{}';
    } catch (error) {
      cleanedToolInput = '{"error": "Failed to serialize tool_input"}';
    }

    try {
      cleanedToolResponse = tool_response !== undefined
        ? stripMemoryTagsFromJson(JSON.stringify(tool_response))
        : '{}';
    } catch (error) {
      cleanedToolResponse = '{"error": "Failed to serialize tool_response"}';
    }

    // Queue observation
    this.sessionManager.queueObservation(sessionDbId, {
      tool_name,
      tool_input: cleanedToolInput,
      tool_response: cleanedToolResponse,
      prompt_number: promptNumber,
      cwd: cwd || '',
      tool_use_id: toolUseId  // Pass tool_use_id for Endless Mode correlation
    });

    // Ensure SDK agent is running
    this.ensureGeneratorRunning(sessionDbId, 'observation');

    if (!waitForCompletion) {
      // Async mode (current behavior)
      logger.info('HTTP', 'Using async mode (not waiting)', {
        sessionId: sessionDbId
      });
      this.eventBroadcaster.broadcastObservationQueued(sessionDbId);
      res.json({ status: 'queued' });
      return;
    }

    // SYNCHRONOUS MODE: Wait for SDK response to be processed (Endless Mode v7.1)
    logger.info('HTTP', 'Entering synchronous wait mode', {
      sessionId: sessionDbId
    });
    try {
      const observation = await this.sessionManager.waitForNextObservation(
        sessionDbId,
        90000  // 90 second timeout (safety margin within 120s hook timeout)
      );
      logger.info('HTTP', 'Wait completed, sending response', {
        sessionId: sessionDbId,
        hasObservation: observation !== null
      });

      // Handle both observation and no-observation responses
      if (observation === null) {
        // SDK returned <no_observation> or plain text - not stored
        res.json({
          status: 'completed',
          observation: null,
          message: 'SDK response received but no observation was created'
        });
      } else {
        // Observation was created and stored
        res.json({
          status: 'completed',
          observation: {
            id: observation.id,
            type: observation.type,
            title: observation.title,
            subtitle: observation.subtitle,
            narrative: observation.narrative,
            concepts: observation.concepts,
            files_read: observation.files_read,
            files_modified: observation.files_modified,
            created_at_epoch: observation.created_at_epoch
          }
        });
      }
    } catch (error: any) {
      // Timeout or processing error
      res.status(408).json({
        status: 'timeout',
        error: error.message
      });
    }
  });

  /**
   * Queue summarize by claudeSessionId (summary-hook uses this)
   * POST /api/sessions/summarize
   * Body: { claudeSessionId, last_user_message, last_assistant_message }
   *
   * Checks privacy, queues summarize request for SDK agent
   */
  private handleSummarizeByClaudeId = this.wrapHandler((req: Request, res: Response): void => {
    const { claudeSessionId, last_user_message, last_assistant_message } = req.body;

    if (!claudeSessionId) {
      return this.badRequest(res, 'Missing claudeSessionId');
    }

    const store = this.dbManager.getSessionStore();

    // Get or create session
    const sessionDbId = store.createSDKSession(claudeSessionId, '', '');
    const promptNumber = store.getPromptCounter(sessionDbId);

    // Privacy check: skip if user prompt was entirely private
    const userPrompt = PrivacyCheckValidator.checkUserPromptPrivacy(
      store,
      claudeSessionId,
      promptNumber,
      'summarize',
      sessionDbId
    );
    if (!userPrompt) {
      res.json({ status: 'skipped', reason: 'private' });
      return;
    }

    // Queue summarize
    this.sessionManager.queueSummarize(sessionDbId, last_user_message || '', last_assistant_message);

    // Ensure SDK agent is running
    this.ensureGeneratorRunning(sessionDbId, 'summarize');

    // Broadcast summarize queued event
    this.eventBroadcaster.broadcastSummarizeQueued();

    res.json({ status: 'queued' });
  });

  /**
   * Complete session by claudeSessionId (cleanup-hook uses this)
   * POST /api/sessions/complete
   * Body: { claudeSessionId }
   *
   * Marks session complete, stops SDK agent, broadcasts status
   */
  private handleSessionCompleteByClaudeId = this.wrapHandler(async (req: Request, res: Response): Promise<void> => {
    const { claudeSessionId } = req.body;

    if (!claudeSessionId) {
      return this.badRequest(res, 'Missing claudeSessionId');
    }

    const found = await this.completionHandler.completeByClaudeId(claudeSessionId);

    if (!found) {
      // No active session - nothing to clean up (may have already been completed)
      res.json({ success: true, message: 'No active session found' });
      return;
    }

    res.json({ success: true });
  });
}
