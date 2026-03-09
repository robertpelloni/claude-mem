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

export async function handle_find_by_file(args: any, context: HandlerContext) {
  const { search, store, chromaClient } = context;
  const silentDebug = (...msg: any[]) => {
    if (process.env.DEBUG === 'true') {
      logger.debug('SEARCH', msg.join(' '));
    }
  };
  
      try {
        const normalized = normalizeParams(args);
        const { filePath, format = 'index', ...filters } = normalized;
        let observations: ObservationSearchResult[] = [];
        let sessions: SessionSummarySearchResult[] = [];

        // Metadata-first, semantic-enhanced search for observations
        if (chromaClient) {
          try {
            silentDebug('[search-server] Using metadata-first + semantic ranking for file search');

            // Step 1: SQLite metadata filter (get all results with this file)
            const metadataResults = search.findByFile(filePath, filters);
            silentDebug(`[search-server] Found ${metadataResults.observations.length} observations, ${metadataResults.sessions.length} sessions for file "${filePath}"`);

            // Sessions: Keep as-is (already summarized, no semantic ranking needed)
            sessions = metadataResults.sessions;

            // Observations: Apply semantic ranking
            if (metadataResults.observations.length > 0) {
              // Step 2: Chroma semantic ranking (rank by relevance to file path)
              const ids = metadataResults.observations.map(obs => obs.id);
              const chromaResults = await queryChroma(chromaClient, filePath, Math.min(ids.length, 100));

              // Intersect: Keep only IDs that passed metadata filter, in semantic rank order
              const rankedIds: number[] = [];
              for (const chromaId of chromaResults.ids) {
                if (ids.includes(chromaId) && !rankedIds.includes(chromaId)) {
                  rankedIds.push(chromaId);
                }
              }

              silentDebug(`[search-server] Chroma ranked ${rankedIds.length} observations by semantic relevance`);

              // Step 3: Hydrate in semantic rank order
              if (rankedIds.length > 0) {
                observations = store.getObservationsByIds(rankedIds, { limit: filters.limit || 20 });
                // Restore semantic ranking order
                observations.sort((a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id));
              }
            }
          } catch (chromaError: any) {
            silentDebug('[search-server] Chroma ranking failed, using SQLite order:', chromaError.message);
            // Fall through to SQLite fallback
          }
        }

        // Fall back to SQLite-only if Chroma unavailable or failed
        if (observations.length === 0 && sessions.length === 0) {
          silentDebug('[search-server] Using SQLite-only file search');
          const results = search.findByFile(filePath, filters);
          observations = results.observations;
          sessions = results.sessions;
        }

        const totalResults = observations.length + sessions.length;

        if (totalResults === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No results found for file "${filePath}"`
            }]
          };
        }

        let combinedText: string;
        if (format === 'index') {
          const header = `Found ${totalResults} result(s) for file "${filePath}":\n\n`;
          const formattedResults: string[] = [];

          // Add observations
          observations.forEach((obs, i) => {
            formattedResults.push(formatObservationIndex(obs, i));
          });

          // Add sessions
          sessions.forEach((session, i) => {
            formattedResults.push(formatSessionIndex(session, i + observations.length));
          });

          combinedText = header + formattedResults.join('\n\n') + formatSearchTips();
        } else {
          const formattedResults: string[] = [];

          // Add observations
          observations.forEach((obs) => {
            formattedResults.push(formatObservationResult(obs));
          });

          // Add sessions
          sessions.forEach((session) => {
            formattedResults.push(formatSessionResult(session));
          });

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