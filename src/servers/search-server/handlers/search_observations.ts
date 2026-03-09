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

export async function handle_search_observations(args: any, context: HandlerContext) {
  const { search, store, chromaClient } = context;
  const silentDebug = (...msg: any[]) => {
    if (process.env.DEBUG === 'true') {
      logger.debug('SEARCH', msg.join(' '));
    }
  };
  
      try {
        const normalized = normalizeParams(args);
        const { query, format = 'index', ...options } = normalized;
        let results: ObservationSearchResult[] = [];

        // Vector-first search via ChromaDB
        if (chromaClient) {
          try {
            silentDebug('[search-server] Using hybrid semantic search (Chroma + SQLite)');

            // Step 1: Chroma semantic search (top 100)
            const chromaResults = await queryChroma(chromaClient, query, 100);
            silentDebug(`[search-server] Chroma returned ${chromaResults.ids.length} semantic matches`);

            if (chromaResults.ids.length > 0) {
              // Step 2: Filter by recency (90 days)
              const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
              const recentIds = chromaResults.ids.filter((_id, idx) => {
                const meta = chromaResults.metadatas[idx];
                return meta && meta.created_at_epoch > ninetyDaysAgo;
              });

              silentDebug(`[search-server] ${recentIds.length} results within 90-day window`);

              // Step 3: Hydrate from SQLite in temporal order
              if (recentIds.length > 0) {
                const limit = options.limit || 20;
                results = store.getObservationsByIds(recentIds, { orderBy: 'date_desc', limit });
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
              text: `No observations found matching "${query}"`
            }]
          };
        }

        // Format based on requested format
        let combinedText: string;
        if (format === 'index') {
          const header = `Found ${results.length} observation(s) matching "${query}":\n\n`;
          const formattedResults = results.map((obs, i) => formatObservationIndex(obs, i));
          combinedText = header + formattedResults.join('\n\n') + formatSearchTips();
        } else {
          const formattedResults = results.map((obs) => formatObservationResult(obs));
          combinedText = formattedResults.join('\n\n---\n\n');
        }

        return {
          content: [{
            type: 'text' as const,
            text: combinedText
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text' as const,
            text: `Search failed: ${error.message}`
          }],
          isError: true
        };
      }
}