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

export async function handle_get_context_timeline(args: any, context: HandlerContext) {
  const { search, store, chromaClient } = context;
  const silentDebug = (...msg: any[]) => {
    if (process.env.DEBUG === 'true') {
      logger.debug('SEARCH', msg.join(' '));
    }
  };
  
      try {
        const { anchor, depth_before = 10, depth_after = 10, project } = args;
        let anchorEpoch: number;
        let anchorId: string | number = anchor;

        // Resolve anchor and get timeline data
        let timeline;
        if (typeof anchor === 'number') {
          // Observation ID - use ID-based boundary detection
          const obs = store.getObservationById(anchor);
          if (!obs) {
            return {
              content: [{
                type: 'text' as const,
                text: `Observation #${anchor} not found`
              }],
              isError: true
            };
          }
          anchorEpoch = obs.created_at_epoch;
          timeline = store.getTimelineAroundObservation(anchor, anchorEpoch, depth_before, depth_after, project);
        } else if (typeof anchor === 'string') {
          // Session ID or ISO timestamp
          if (anchor.startsWith('S') || anchor.startsWith('#S')) {
            const sessionId = anchor.replace(/^#?S/, '');
            const sessionNum = parseInt(sessionId, 10);
            const sessions = store.getSessionSummariesByIds([sessionNum]);
            if (sessions.length === 0) {
              return {
                content: [{
                  type: 'text' as const,
                  text: `Session #${sessionNum} not found`
                }],
                isError: true
              };
            }
            anchorEpoch = sessions[0].created_at_epoch;
            anchorId = `S${sessionNum}`;
            timeline = store.getTimelineAroundTimestamp(anchorEpoch, depth_before, depth_after, project);
          } else {
            // ISO timestamp
            const date = new Date(anchor);
            if (isNaN(date.getTime())) {
              return {
                content: [{
                  type: 'text' as const,
                  text: `Invalid timestamp: ${anchor}`
                }],
                isError: true
              };
            }
            anchorEpoch = date.getTime(); // Keep as milliseconds
            timeline = store.getTimelineAroundTimestamp(anchorEpoch, depth_before, depth_after, project);
          }
        } else {
          return {
            content: [{
              type: 'text' as const,
              text: 'Invalid anchor: must be observation ID (number), session ID (e.g., "S123"), or ISO timestamp'
            }],
            isError: true
          };
        }

        // Combine, sort, and filter timeline items
        const items: TimelineItem[] = [
          ...timeline.observations.map(obs => ({ type: 'observation' as const, data: obs, epoch: obs.created_at_epoch })),
          ...timeline.sessions.map(sess => ({ type: 'session' as const, data: sess, epoch: sess.created_at_epoch })),
          ...timeline.prompts.map(prompt => ({ type: 'prompt' as const, data: prompt, epoch: prompt.created_at_epoch }))
        ];
        items.sort((a, b) => a.epoch - b.epoch);
        const filteredItems = filterTimelineByDepth(items, anchorId, anchorEpoch, depth_before, depth_after);

        if (filteredItems.length === 0) {
          const anchorDate = new Date(anchorEpoch).toLocaleString();
          return {
            content: [{
              type: 'text' as const,
              text: `No context found around ${anchorDate} (${depth_before} records before, ${depth_after} records after)`
            }]
          };
        }

        // Helper functions matching context-hook.ts
        function formatDate(epochMs: number): string {
          const date = new Date(epochMs);
          return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        }

        function formatTime(epochMs: number): string {
          const date = new Date(epochMs);
          return date.toLocaleString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }

        function formatDateTime(epochMs: number): string {
          const date = new Date(epochMs);
          return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }

        function estimateTokens(text: string | null): number {
          if (!text) return 0;
          return Math.ceil(text.length / 4);
        }

        // Format results matching context-hook.ts exactly
        const lines: string[] = [];

        // Header
        lines.push(`# Timeline around anchor: ${anchorId}`);
        lines.push(`**Window:** ${depth_before} records before → ${depth_after} records after | **Items:** ${filteredItems.length}`);
        lines.push('');

        // Legend
        lines.push(`**Legend:** 🎯 session-request | 🔴 bugfix | 🟣 feature | 🔄 refactor | ✅ change | 🔵 discovery | 🧠 decision`);
        lines.push('');

        // Group by day
        const dayMap = new Map<string, TimelineItem[]>();
        for (const item of filteredItems) {
          const day = formatDate(item.epoch);
          if (!dayMap.has(day)) {
            dayMap.set(day, []);
          }
          dayMap.get(day)!.push(item);
        }

        // Sort days chronologically
        const sortedDays = Array.from(dayMap.entries()).sort((a, b) => {
          const aDate = new Date(a[0]).getTime();
          const bDate = new Date(b[0]).getTime();
          return aDate - bDate;
        });

        // Render each day
        for (const [day, dayItems] of sortedDays) {
          lines.push(`### ${day}`);
          lines.push('');

          let currentFile: string | null = null;
          let lastTime = '';
          let tableOpen = false;

          for (const item of dayItems) {
            const isAnchor = (
              (typeof anchorId === 'number' && item.type === 'observation' && item.data.id === anchorId) ||
              (typeof anchorId === 'string' && anchorId.startsWith('S') && item.type === 'session' && `S${item.data.id}` === anchorId)
            );

            if (item.type === 'session') {
              // Close any open table
              if (tableOpen) {
                lines.push('');
                tableOpen = false;
                currentFile = null;
                lastTime = '';
              }

              // Render session
              const sess = item.data;
              const title = sess.request || 'Session summary';
              const link = `claude-mem://session-summary/${sess.id}`;
              const marker = isAnchor ? ' ← **ANCHOR**' : '';

              lines.push(`**🎯 #S${sess.id}** ${title} (${formatDateTime(item.epoch)}) [→](${link})${marker}`);
              lines.push('');
            } else if (item.type === 'prompt') {
              // Close any open table
              if (tableOpen) {
                lines.push('');
                tableOpen = false;
                currentFile = null;
                lastTime = '';
              }

              // Render prompt
              const prompt = item.data;
              const truncated = prompt.prompt.length > 100 ? prompt.prompt.substring(0, 100) + '...' : prompt.prompt;

              lines.push(`**💬 User Prompt #${prompt.prompt_number}** (${formatDateTime(item.epoch)})`);
              lines.push(`> ${truncated}`);
              lines.push('');
            } else if (item.type === 'observation') {
              // Render observation in table
              const obs = item.data;
              const file = 'General'; // Simplified for timeline view

              // Check if we need a new file section
              if (file !== currentFile) {
                // Close previous table
                if (tableOpen) {
                  lines.push('');
                }

                // File header
                lines.push(`**${file}**`);
                lines.push(`| ID | Time | T | Title | Tokens |`);
                lines.push(`|----|------|---|-------|--------|`);

                currentFile = file;
                tableOpen = true;
                lastTime = '';
              }

              // Map observation type to emoji
              let icon = '•';
              switch (obs.type) {
                case 'bugfix': icon = '🔴'; break;
                case 'feature': icon = '🟣'; break;
                case 'refactor': icon = '🔄'; break;
                case 'change': icon = '✅'; break;
                case 'discovery': icon = '🔵'; break;
                case 'decision': icon = '🧠'; break;
              }

              const time = formatTime(item.epoch);
              const title = obs.title || 'Untitled';
              const tokens = estimateTokens(obs.narrative);

              const showTime = time !== lastTime;
              const timeDisplay = showTime ? time : '″';
              lastTime = time;

              const anchorMarker = isAnchor ? ' ← **ANCHOR**' : '';
              lines.push(`| #${obs.id} | ${timeDisplay} | ${icon} | ${title}${anchorMarker} | ~${tokens} |`);
            }
          }

          // Close final table if open
          if (tableOpen) {
            lines.push('');
          }
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
            text: `Timeline query failed: ${error.message}`
          }],
          isError: true
        };
      }
}