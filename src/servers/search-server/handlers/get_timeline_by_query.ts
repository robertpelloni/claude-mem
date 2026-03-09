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

export async function handle_get_timeline_by_query(args: any, context: HandlerContext) {
  const { search, store, chromaClient } = context;
  const silentDebug = (...msg: any[]) => {
    if (process.env.DEBUG === 'true') {
      logger.debug('SEARCH', msg.join(' '));
    }
  };
  
      try {
        const { query, mode = 'auto', depth_before = 10, depth_after = 10, limit = 5, project } = args;

        // Step 1: Search for observations
        let results: ObservationSearchResult[] = [];

        // Use hybrid search if available
        if (chromaClient) {
          try {
            silentDebug('[search-server] Using hybrid semantic search for timeline query');
            const chromaResults = await queryChroma(chromaClient, query, 100);
            silentDebug(`[search-server] Chroma returned ${chromaResults.ids.length} semantic matches`);

            if (chromaResults.ids.length > 0) {
              // Filter by recency (90 days)
              const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
              const recentIds = chromaResults.ids.filter((_id, idx) => {
                const meta = chromaResults.metadatas[idx];
                return meta && meta.created_at_epoch > ninetyDaysAgo;
              });

              silentDebug(`[search-server] ${recentIds.length} results within 90-day window`);

              if (recentIds.length > 0) {
                results = store.getObservationsByIds(recentIds, { orderBy: 'date_desc', limit: mode === 'auto' ? 1 : limit });
                silentDebug(`[search-server] Hydrated ${results.length} observations from SQLite`);
              }
            }
          } catch (chromaError: any) {
            silentDebug('[search-server] Chroma query failed - no results (FTS5 fallback removed):', chromaError.message);
          }
        }

        if (results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No observations found matching "${query}". Try a different search query.`
            }]
          };
        }

        // Step 2: Handle based on mode
        if (mode === 'interactive') {
          // Return formatted index of top results for LLM to choose from
          const lines: string[] = [];
          lines.push(`# Timeline Anchor Search Results`);
          lines.push('');
          lines.push(`Found ${results.length} observation(s) matching "${query}"`);
          lines.push('');
          lines.push(`To get timeline context around any of these observations, use the \`get_context_timeline\` tool with the observation ID as the anchor.`);
          lines.push('');
          lines.push(`**Top ${results.length} matches:**`);
          lines.push('');

          for (let i = 0; i < results.length; i++) {
            const obs = results[i];
            const title = obs.title || `Observation #${obs.id}`;
            const date = new Date(obs.created_at_epoch).toLocaleString();
            const type = obs.type ? `[${obs.type}]` : '';

            lines.push(`${i + 1}. **${type} ${title}**`);
            lines.push(`   - ID: ${obs.id}`);
            lines.push(`   - Date: ${date}`);
            if (obs.subtitle) {
              lines.push(`   - ${obs.subtitle}`);
            }
            lines.push(`   - Source: claude-mem://observation/${obs.id}`);
            lines.push('');
          }

          return {
            content: [{
              type: 'text' as const,
              text: lines.join('\n')
            }]
          };
        } else {
          // Auto mode: Use top result as timeline anchor
          const topResult = results[0];
          silentDebug(`[search-server] Auto mode: Using observation #${topResult.id} as timeline anchor`);

          // Get timeline around this observation
          const timeline = store.getTimelineAroundObservation(
            topResult.id,
            topResult.created_at_epoch,
            depth_before,
            depth_after,
            project
          );

          // Combine, sort, and filter timeline items
          const items: TimelineItem[] = [
            ...timeline.observations.map(obs => ({ type: 'observation' as const, data: obs, epoch: obs.created_at_epoch })),
            ...timeline.sessions.map(sess => ({ type: 'session' as const, data: sess, epoch: sess.created_at_epoch })),
            ...timeline.prompts.map(prompt => ({ type: 'prompt' as const, data: prompt, epoch: prompt.created_at_epoch }))
          ];
          items.sort((a, b) => a.epoch - b.epoch);
          const filteredItems = filterTimelineByDepth(items, topResult.id, 0, depth_before, depth_after);

          if (filteredItems.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: `Found observation #${topResult.id} matching "${query}", but no timeline context available (${depth_before} records before, ${depth_after} records after).`
              }]
            };
          }

          // Helper functions (reused from get_context_timeline)
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

          // Format timeline (reused from get_context_timeline)
          const lines: string[] = [];

          // Header
          lines.push(`# Timeline for query: "${query}"`);
          lines.push(`**Anchor:** Observation #${topResult.id} - ${topResult.title || 'Untitled'}`);
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
              const isAnchor = (item.type === 'observation' && item.data.id === topResult.id);

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

                lines.push(`**🎯 #S${sess.id}** ${title} (${formatDateTime(item.epoch)}) [→](${link})`);
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
        }
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