import { logger } from '../../../utils/logger.js';
import { HandlerContext } from '../types.js';
import {
  formatObservationResult,
  formatObservationIndex,
  formatSessionResult,
  formatSessionIndex,
  formatUserPromptResult,
  formatUserPromptIndex,
  formatSearchTips,
  formatTimelineItem,
  formatObservation,
  formatSession,
  formatPrompt,
  type FormattedResult,
  type FormattedObservation,
  type FormattedSession,
  type FormattedPrompt,
  type TimelineItem
} from '../formatters/index.js';
import { normalizeParams } from '../utils/normalize-params.js';
import { queryChroma } from '../utils/query-chroma.js';
import { type ObservationSearchResult, type SessionSummarySearchResult, type UserPromptSearchResult } from '../../../services/sqlite/types.js';
import { basename } from 'path';
import { z } from 'zod';

export async function handle_get_recent_context(args: any, context: HandlerContext) {
  const { search, store, chromaClient } = context;
  const silentDebug = (...msg: any[]) => {
    if (process.env.DEBUG === 'true') {
      logger.debug('SEARCH', msg.join(' '));
    }
  };
  
      try {
        const project = args.project || basename(process.cwd());
        const limit = args.limit || 3;

        const sessions = store.getRecentSessionsWithStatus(project, limit);

        if (sessions.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `# Recent Session Context\n\nNo previous sessions found for project "${project}".`
            }]
          };
        }

        const lines: string[] = [];
        lines.push('# Recent Session Context');
        lines.push('');
        lines.push(`Showing last ${sessions.length} session(s) for **${project}**:`);
        lines.push('');

        for (const session of sessions) {
          if (!session.sdk_session_id) continue;

          lines.push('---');
          lines.push('');

          if (session.has_summary) {
            const summary = store.getSummaryForSession(session.sdk_session_id);
            if (summary) {
              const promptLabel = summary.prompt_number ? ` (Prompt #${summary.prompt_number})` : '';
              lines.push(`**Summary${promptLabel}**`);
              lines.push('');

              if (summary.request) lines.push(`**Request:** ${summary.request}`);
              if (summary.completed) lines.push(`**Completed:** ${summary.completed}`);
              if (summary.learned) lines.push(`**Learned:** ${summary.learned}`);
              if (summary.next_steps) lines.push(`**Next Steps:** ${summary.next_steps}`);

              // Handle files_read
              if (summary.files_read) {
                try {
                  const filesRead = JSON.parse(summary.files_read);
                  if (Array.isArray(filesRead) && filesRead.length > 0) {
                    lines.push(`**Files Read:** ${filesRead.join(', ')}`);
                  }
                } catch {
                  if (summary.files_read.trim()) {
                    lines.push(`**Files Read:** ${summary.files_read}`);
                  }
                }
              }

              // Handle files_edited
              if (summary.files_edited) {
                try {
                  const filesEdited = JSON.parse(summary.files_edited);
                  if (Array.isArray(filesEdited) && filesEdited.length > 0) {
                    lines.push(`**Files Edited:** ${filesEdited.join(', ')}`);
                  }
                } catch {
                  if (summary.files_edited.trim()) {
                    lines.push(`**Files Edited:** ${summary.files_edited}`);
                  }
                }
              }

              const date = new Date(summary.created_at).toLocaleString();
              lines.push(`**Date:** ${date}`);
            }
          } else if (session.status === 'active') {
            lines.push('**In Progress**');
            lines.push('');

            if (session.user_prompt) {
              lines.push(`**Request:** ${session.user_prompt}`);
            }

            const observations = store.getObservationsForSession(session.sdk_session_id);
            if (observations.length > 0) {
              lines.push('');
              lines.push(`**Observations (${observations.length}):**`);
              for (const obs of observations) {
                lines.push(`- ${obs.title}`);
              }
            } else {
              lines.push('');
              lines.push('*No observations yet*');
            }

            lines.push('');
            lines.push('**Status:** Active - summary pending');

            const date = new Date(session.started_at).toLocaleString();
            lines.push(`**Date:** ${date}`);
          } else {
            lines.push(`**${session.status.charAt(0).toUpperCase() + session.status.slice(1)}**`);
            lines.push('');

            if (session.user_prompt) {
              lines.push(`**Request:** ${session.user_prompt}`);
            }

            lines.push('');
            lines.push(`**Status:** ${session.status} - no summary available`);

            const date = new Date(session.started_at).toLocaleString();
            lines.push(`**Date:** ${date}`);
          }

          lines.push('');
        }

        return {
          content: [{
            type: 'text' as const,
            text: lines.join('\n')
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text' as const,
            text: `Failed to get recent context: ${error.message}`
          }],
          isError: true
        };
      }
}