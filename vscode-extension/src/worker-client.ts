/**
 * Worker Client for VSCode Extension
 * Communicates with borg-extension worker service via HTTP
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Constants
const HEALTH_CHECK_TIMEOUT_MS = 1000;
const DEFAULT_WORKER_PORT = 37777;

/**
 * Get the worker port number
 * Priority: ~/.borg-extension/settings.json > env var > default
 */
export function getWorkerPort(): number {
  try {
    const settingsPath = path.join(os.homedir(), '.borg-extension', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      const port = parseInt(settings.env?.CLAUDE_MEM_WORKER_PORT, 10);
      if (!isNaN(port)) return port;
    }
  } catch {
    // Fall through to env var or default
  }
  return parseInt(process.env.CLAUDE_MEM_WORKER_PORT || String(DEFAULT_WORKER_PORT), 10);
}

/**
 * Check if worker is responsive by trying the health endpoint
 */
export async function isWorkerHealthy(): Promise<boolean> {
  try {
    const port = getWorkerPort();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: controller.signal
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Session data stored per conversation
 */
export interface SessionData {
  sessionDbId: number;
  conversationId: string;
  project: string;
  promptNumber: number;
}

/**
 * Initialize a new session
 */
export async function initSession(
  contentSessionId: string,
  project: string,
  userPrompt: string
): Promise<{ sessionDbId: number; promptNumber: number }> {
  const port = getWorkerPort();

  const response = await fetch(`http://127.0.0.1:${port}/api/sessions/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentSessionId, project, prompt: userPrompt }),
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to initialize session: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Record an observation (tool usage)
 */
export async function recordObservation(
  contentSessionId: string,
  toolName: string,
  toolInput: string,
  toolResponse: string,
  cwd?: string
): Promise<void> {
  const port = getWorkerPort();

  const response = await fetch(`http://127.0.0.1:${port}/api/sessions/observations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSessionId,
      tool_name: toolName,
      tool_input: toolInput,
      tool_response: toolResponse,
      cwd: cwd || ''
    }),
    signal: AbortSignal.timeout(2000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to record observation: ${response.status} ${errorText}`);
  }
}

/**
 * Generate session summary
 */
export async function generateSummary(
  contentSessionId: string,
  lastUserMessage?: string
): Promise<void> {
  const port = getWorkerPort();

  const response = await fetch(`http://127.0.0.1:${port}/api/sessions/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentSessionId,
      last_assistant_message: lastUserMessage || ''
    }),
    signal: AbortSignal.timeout(2000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate summary: ${response.status} ${errorText}`);
  }
}

/**
 * Mark session as complete
 */
export async function completeSession(contentSessionId: string): Promise<void> {
  const port = getWorkerPort();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/sessions/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentSessionId }),
      signal: AbortSignal.timeout(1000)
    });

    if (!response.ok) {
      console.warn(`Failed to complete session: ${response.status}`);
    }
  } catch (err) {
    // Non-critical - worker might be down
    console.warn('Failed to notify worker of session completion:', err);
  }
}

/**
 * Get session status
 */
export async function getSessionStatus(sessionDbId: number): Promise<any> {
  const port = getWorkerPort();

  const response = await fetch(`http://127.0.0.1:${port}/sessions/${sessionDbId}/status`, {
    method: 'GET',
    signal: AbortSignal.timeout(1000)
  });

  if (!response.ok) {
    throw new Error(`Failed to get session status: ${response.status}`);
  }

  return response.json();
}

/**
 * Open the viewer UI
 */
export function getViewerUrl(): string {
  const port = getWorkerPort();
  return `http://localhost:${port}`;
}
