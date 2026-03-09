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

export async function handle_find_by_type(args: any, context: HandlerContext) {
  const { search, store, chromaClient } = context;
  const silentDebug = (...msg: any[]) => {
    if (process.env.DEBUG === 'true') {
      logger.debug('SEARCH', msg.join(' '));
    }
  };
  
      try {
        const normalized = normalizeParams(args);
        const { type, format = 'index', ...filters } = normalized;
        const typeStr = Array.isArray(type) ? type.join(', ') : type;
        let results: ObservationSearchResult[] = [];

        // Metadata-first, semantic-enhanced search
        if (chromaClient) {
          try {
            silentDebug('[search-server] Using metadata-first + semantic ranking for type search');

            // Step 1: SQLite metadata filter (get all IDs with this type)
            const metadataResults = search.findByType(type, filters);
            silentDebug(`[search-server] Found ${metadataResults.length} observations with type "${typeStr}"`);

            if (metadataResults.length > 0) {
              // Step 2: Chroma semantic ranking (rank by relevance to type)
              const ids = metadataResults.map(obs => obs.id);
              const chromaResults = await queryChroma(typeStr, Math.min(ids.length, 100));

              // Intersect: Keep only IDs that passed metadata filter, in semantic rank order
              const rankedIds: number[] = [];
              for (const chromaId of chromaResults.ids) {
                if (ids.includes(chromaId) && !rankedIds.includes(chromaId)) {
                  rankedIds.push(chromaId);
                }
              }

              silentDebug(`[search-server] Chroma ranked ${rankedIds.length} results by semantic relevance`);

              // Step 3: Hydrate in semantic rank order
              if (rankedIds.length > 0) {
                results = store.getObservationsByIds(rankedIds, { limit: filters.limit || 20 });
                // Restore semantic ranking order
                results.sort((a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id));
              }
            }
          } catch (chromaError: any) {
            silentDebug('[search-server] Chroma ranking failed, using SQLite order:', chromaError.message);
            // Fall through to SQLite fallback
          }
        }

        // Fall back to SQLite-only if Chroma unavailable or failed
        if (results.length === 0) {
          silentDebug('[search-server] Using SQLite-only type search');
          results = search.findByType(type, filters);
        }

        if (results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No observations found with type "${typeStr}"`
            }]
          };
        }

        // Format based on requested format
        let combinedText: string;
        if (format === 'index') {
          const header = `Found ${results.length} observation(s) with type "${typeStr}":\n\n`;
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