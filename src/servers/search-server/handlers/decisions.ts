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

export async function handle_decisions(args: any, context: HandlerContext) {
  const { search, store, chromaClient } = context;
  const silentDebug = (...msg: any[]) => {
    if (process.env.DEBUG === 'true') {
      logger.debug('SEARCH', msg.join(' '));
    }
  };
  
      try {
        const normalized = normalizeParams(args);
        const { query, format = 'index', ...filters } = normalized;
        let results: ObservationSearchResult[] = [];

        // Search for decision-type observations
        if (chromaClient) {
          try {
            if (query) {
              // Semantic search filtered to decision type
              silentDebug('[search-server] Using Chroma semantic search with type=decision filter');
              const chromaResults = await queryChroma(chromaClient, query, Math.min((filters.limit || 20) * 2, 100), { type: 'decision' });
              const obsIds = chromaResults.ids;

              if (obsIds.length > 0) {
                results = store.getObservationsByIds(obsIds, { ...filters, type: 'decision' });
                // Preserve Chroma ranking order
                results.sort((a, b) => obsIds.indexOf(a.id) - obsIds.indexOf(b.id));
              }
            } else {
              // No query: get all decisions, rank by "decision" keyword
              silentDebug('[search-server] Using metadata-first + semantic ranking for decisions');
              const metadataResults = search.findByType('decision', filters);

              if (metadataResults.length > 0) {
                const ids = metadataResults.map(obs => obs.id);
                const chromaResults = await queryChroma(chromaClient, 'decision', Math.min(ids.length, 100));

                const rankedIds: number[] = [];
                for (const chromaId of chromaResults.ids) {
                  if (ids.includes(chromaId) && !rankedIds.includes(chromaId)) {
                    rankedIds.push(chromaId);
                  }
                }

                if (rankedIds.length > 0) {
                  results = store.getObservationsByIds(rankedIds, { limit: filters.limit || 20 });
                  results.sort((a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id));
                }
              }
            }
          } catch (chromaError: any) {
            silentDebug('[search-server] Chroma search failed, using SQLite fallback:', chromaError.message);
          }
        }

        if (results.length === 0) {
          results = search.findByType('decision', filters);
        }

        if (results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No decision observations found'
            }]
          };
        }

        let combinedText: string;
        if (format === 'index') {
          const header = `Found ${results.length} decision(s):\n\n`;
          const formattedResults = results.map((obs, i) => formatObservationIndex(obs, i));
          combinedText = header + formattedResults.join('\n\n');
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