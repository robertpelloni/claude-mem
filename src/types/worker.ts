/**
 * Shared types for Worker Service architecture
 */

import type { Response } from 'express';
import type { SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';

// ============================================================================
// Active Session Types
// ============================================================================

/**
 * Provider-agnostic conversation message for shared history
 * Used to maintain context across Claude↔Gemini provider switches
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ActiveSession {
  sessionDbId: number;
  contentSessionId: string;      // User's Claude Code session being observed
  memorySessionId: string | null; // Memory agent's session ID for resume
  project: string;
  userPrompt: string;
  pendingMessages: PendingMessage[];  // Deprecated: now using persistent store, kept for compatibility
  abortController: AbortController;
  generatorPromise: Promise<void> | null;
  lastPromptNumber: number;
  startTime: number;
  cumulativeInputTokens: number;   // Track input tokens for discovery cost
  cumulativeOutputTokens: number;  // Track output tokens for discovery cost
  earliestPendingTimestamp: number | null;  // Original timestamp of earliest pending message (for accurate observation timestamps)
  conversationHistory: ConversationMessage[];  // Shared conversation history for provider switching
  currentProvider: 'claude' | 'gemini' | 'openrouter' | null;  // Track which provider is currently running
  consecutiveRestarts: number;  // Track consecutive restart attempts to prevent infinite loops
  forceInit?: boolean;  // Force fresh SDK session (skip resume)
  idleTimedOut?: boolean;  // Set when session exits due to idle timeout (prevents restart loop)
  lastGeneratorActivity: number;  // Timestamp of last generator progress (for stale detection, Issue #1099)
  processingMessageIds: number[];
}

export interface PendingMessage {
  type: 'observation' | 'summarize';
  tool_name?: string;
  tool_input?: any;
  tool_response?: any;
  prompt_number?: number;
  cwd?: string;
  last_assistant_message?: string;
}

/**
 * PendingMessage with database ID for completion tracking.
 * The _persistentId is used to mark the message as processed after SDK success.
 * The _originalTimestamp is the epoch when the message was first queued (for accurate observation timestamps).
 */
export interface PendingMessageWithId extends PendingMessage {
  _persistentId: number;
  _originalTimestamp: number;
}

export interface ObservationData {
  tool_name: string;
  tool_input: any;
  tool_response: any;
  prompt_number: number;
  cwd?: string;
}

// ============================================================================
// SSE Types
// ============================================================================

export interface SSEEvent {
  type: string;
  timestamp?: number;
  [key: string]: any;
}

// Note: express typing required
export type SSEClient = Response;

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  offset: number;
  limit: number;
}

export interface PaginationParams {
  offset: number;
  limit: number;
  project?: string;
}

// ============================================================================
// Settings Types
// ============================================================================

export interface ViewerSettings {
  sidebarOpen: boolean;
  selectedProject: string | null;
  theme: 'light' | 'system' | 'dark';
}

// ============================================================================
// Parsed Types
// ============================================================================

export interface ParsedObservation {
  type: string;
  title: string;
  subtitle: string | null;
  text: string;
  concepts: string[];
  files: string[];
}

export interface ParsedSummary {
  request: string | null;
  investigated: string | null;
  learned: string | null;
  completed: string | null;
  next_steps: string | null;
  notes: string | null;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface DatabaseStats {
  totalObservations: number;
  totalSessions: number;
  totalPrompts: number;
  totalSummaries: number;
  projectCounts: Record<string, {
    observations: number;
    sessions: number;
    prompts: number;
    summaries: number;
  }>;
}

// Re-export SDK type for convenience downstream
export type { SDKUserMessage };
