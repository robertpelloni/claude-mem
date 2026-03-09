/**
 * Standard hook response for all hooks.
 * Tells Claude Code to continue processing and suppress the hook's output.
 *
 * Note: SessionStart uses context-hook.ts which constructs its own response
 * with hookSpecificOutput for context injection.
 */
export const STANDARD_HOOK_RESPONSE = JSON.stringify({
  continue: true,
  suppressOutput: true
});

export interface HookResponseOptions {
  context?: string;
}

export function createHookResponse(
  eventName: string,
  continueExecution: boolean,
  options?: HookResponseOptions
): string {
  const base = {
    continue: continueExecution,
    suppressOutput: true
  };

  if (options?.context) {
    return JSON.stringify({
      ...base,
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext: options.context
      }
    });
  }

  return JSON.stringify(base);
}
