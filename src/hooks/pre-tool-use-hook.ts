/**
 * Pre-Tool-Use Hook
 *
 * Tracks tool execution start timestamps for Endless Mode.
 * Sends tool_use_id and timestamp to worker for observation correlation.
 */

import { stdin } from 'process';
import { createHookResponse } from './hook-response.js';
import { logger } from '../utils/logger.js';
import { ensureWorkerRunning, getWorkerPort } from '../shared/worker-utils.js';
import { getDebtWarningsForFiles } from './context-injection.js';
import * as path from 'path';

export interface PreToolUseInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  tool_name: string;
  tool_input: any;
  tool_use_id: string;
  [key: string]: any;
}

/**
 * Pre-Tool-Use Hook Main Logic
 * Non-blocking: sends timestamp to worker and returns immediately
 */
async function preToolUseHook(input?: PreToolUseInput): Promise<void> {
  if (!input) {
    throw new Error('preToolUseHook requires input');
  }

  const { session_id, tool_use_id, tool_name, tool_input, cwd } = input;

  // Ensure worker is running
  await ensureWorkerRunning();

  const port = getWorkerPort();

  logger.debug('HOOK', `PreToolUse: ${tool_name}`, {
    toolUseId: tool_use_id,
    workerPort: port
  });

  try {
    // Send to worker - non-blocking, just record the timestamp
    const response = await fetch(`http://127.0.0.1:${port}/api/sessions/pre-tool-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claudeSessionId: session_id,
        toolUseId: tool_use_id,
        timestamp: Date.now()
      }),
      signal: AbortSignal.timeout(2000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.failure('HOOK', 'Failed to send pre-tool-use tracking', {
        status: response.status
      }, errorText);
      // Don't throw - this is tracking only, don't block tool execution
    } else {
      logger.debug('HOOK', 'Pre-tool-use tracking sent successfully', {
        toolUseId: tool_use_id
      });
    }
  } catch (error: any) {
    // Don't throw - tracking failure should not block tool execution
    logger.debug('HOOK', 'Pre-tool-use tracking failed (non-critical)', {
      error: error.message
    });
  }

  // **Phase D: Historical Debt Warnings**
  // Proactively fetch historical bug/decision observations when modifying or inspecting files
  let debtWarningContext: string | undefined = undefined;

  try {
    const filesTargeted: string[] = [];
    const nameList = ['Replace', 'Write', 'Edit', 'Insert', 'View', 'multi_replace_file_content', 'replace_file_content', 'write_to_file', 'view_file', 'view_file_outline'];

    if (nameList.includes(tool_name) || tool_name.toLowerCase().includes('file')) {
      if (tool_input?.file_path) filesTargeted.push(tool_input.file_path);
      if (tool_input?.path) filesTargeted.push(tool_input.path);
      if (tool_input?.absolute_path) filesTargeted.push(tool_input.absolute_path);
      if (tool_input?.target_file) filesTargeted.push(tool_input.target_file);
      if (tool_input?.AbsolutePath) filesTargeted.push(tool_input.AbsolutePath);
      if (tool_input?.TargetFile) filesTargeted.push(tool_input.TargetFile);
    }

    if (filesTargeted.length > 0) {
      const project = cwd ? path.basename(cwd) : 'unknown-project';
      const warning = getDebtWarningsForFiles(filesTargeted, project, cwd);
      if (warning) {
        debtWarningContext = warning;
        logger.debug('HOOK', 'Injected Historical Debt Warning into PreToolUse', { files: filesTargeted.join(', ') });
      }
    }
  } catch (err: any) {
    logger.debug('HOOK', 'Failed to generate debt warnings', { error: err.message });
  }

  if (debtWarningContext) {
    console.log(createHookResponse('PreToolUse', true, { context: debtWarningContext }));
  } else {
    console.log(createHookResponse('PreToolUse', true));
  }
}

// Entry Point
let input = '';
stdin.on('data', (chunk) => input += chunk);
stdin.on('end', async () => {
  const parsed = input ? JSON.parse(input) : undefined;
  await preToolUseHook(parsed);
});
