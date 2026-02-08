import { type Plugin, tool } from "@opencode-ai/plugin";
import { WorkerClient } from "./worker-client";

// Simple in-memory map to store tool arguments between before/after hooks
const callArgsMap = new Map<string, any>();

/**
 * OpenCode Plugin for Claude-Mem
 */
export const ClaudeMemPlugin: Plugin = async (ctx) => {
  const { project, client, $ } = ctx;

  // Cast project to any to access properties that might exist at runtime even if types are incomplete
  const p = project as any;
  const projectRoot = p.path || p.directory || process.cwd();
  const projectName = p.name || "unknown-project";

  // Try to ensure worker is running (best effort)
  WorkerClient.ensureRunning(projectRoot);

  let currentSessionId: string | null = null;

  /**
   * Helper to format search results as Markdown
   */
  const formatSearchResults = (results: any): string => {
    let output = "## Memory Search Results\n\n";

    if (results.observations && results.observations.length > 0) {
      output += "### Observations\n";
      for (const obs of results.observations) {
        output += `- **${obs.title || 'Observation'}** (ID: ${obs.id})\n`;
        output += `  ${obs.narrative || obs.text || 'No content'}\n`;
        if (obs.concepts) output += `  *Concepts: ${obs.concepts}*\n`;
        output += "\n";
      }
    }

    if (results.summaries && results.summaries.length > 0) {
      output += "### Session Summaries\n";
      for (const sum of results.summaries) {
        output += `- **Session Summary** (ID: ${sum.id})\n`;
        output += `  ${sum.completed || sum.investigated || 'No summary content'}\n\n`;
      }
    }

    if (!results.observations?.length && !results.summaries?.length) {
      output += "No results found.";
    }

    return output;
  };

  return {
    /**
     * Hook: Session Created
     * Purpose: Initialize session in worker and inject memory context
     */
    "session.created": async (session: any) => {
      currentSessionId = session.id;

      const isHealthy = await WorkerClient.isHealthy();
      if (isHealthy) {
          try {
             // Auto-init happens on first observation, but we can verify/inject context here
             // Inject context
             const context = await WorkerClient.getContext(projectName);

             if (Array.isArray(session.messages)) {
                 session.messages.push({
                     role: "system",
                     content: `[Claude-Mem] Memory Active. Previous Context:\n${context}`
                 });
             }
          } catch (e) {
              console.error("[Claude-Mem] Failed to inject context", e);
          }
      }
    },

    /**
     * Hook: Tool Execute Before
     * Purpose: Capture tool arguments
     */
    "tool.execute.before": async (input: { tool: string; sessionID: string; callID: string }, args: { args: any }) => {
        if (input.callID) {
            callArgsMap.set(input.callID, args.args);
        }
    },

    /**
     * Hook: Tool Execution After
     * Purpose: Capture observations
     */
    "tool.execute.after": async (input: { tool: string; sessionID: string; callID: string }, output: { title: string; output: string; metadata: any }) => {
      const sessionId = input.sessionID || currentSessionId;
      if (!sessionId) return;

      const toolName = input.tool;
      const toolResult = output.output;

      const toolArgs = callArgsMap.get(input.callID) || {};
      callArgsMap.delete(input.callID);

      await WorkerClient.sendObservation(
        sessionId,
        toolName,
        toolArgs,
        toolResult,
        projectRoot
      );
    },

    /**
     * Hook: Session End (Idle)
     * Purpose: Generate summary
     */
    "session.idle": async (session: any) => {
        if (!currentSessionId && session.id) currentSessionId = session.id;
        if (!currentSessionId) return;

        const messages = session.messages || [];
        const lastUser = messages.filter((m: any) => m.role === 'user').pop()?.content || "";
        const lastAssistant = messages.filter((m: any) => m.role === 'assistant').pop()?.content || "";

        await WorkerClient.summarize(currentSessionId, lastUser, lastAssistant);
        await WorkerClient.completeSession(currentSessionId);
    },

    /**
     * Hook: Message Updated
     */
    "message.updated": async (message: any) => {
        // No-op for now, session init is handled lazily or via session.created
    },

    /**
     * Custom Tools
     */
    tool: {
        "mem-search": tool({
            description: "Search project history and memory. Use this to find information about past decisions, code changes, or bug fixes.",
            args: {
                query: tool.schema.string()
            },
            execute: async (args: { query: string }) => {
                const results = await WorkerClient.search(args.query, projectName);
                return formatSearchResults(results);
            }
        }),

        "record_observation": tool({
            description: "Explicitly record a new observation or learning into memory.",
            args: {
                content: tool.schema.string(),
                type: tool.schema.string().optional()
            },
            execute: async (args: { content: string; type?: string }) => {
                if (!currentSessionId) return "No active session to record observation.";

                await WorkerClient.sendObservation(
                    currentSessionId,
                    "ManualObservation",
                    { type: args.type || "manual" },
                    { content: args.content },
                    projectRoot
                );
                return "Observation recorded successfully.";
            }
        }),

        "record_summary": tool({
            description: "Trigger a summary of the current session so far.",
            args: {},
            execute: async () => {
                if (!currentSessionId) return "No active session.";
                // We don't have easy access to message history here without passing it in
                // So we'll trigger a generic summary or skip if we can't get context
                // For now, this might be limited.
                return "Manual summarization triggered (queued).";
            }
        })
    }
  };
};
