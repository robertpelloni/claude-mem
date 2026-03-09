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

export async function handle_how_it_works(args: any, context: HandlerContext) {
  const { search, store, chromaClient } = context;
  const silentDebug = (...msg: any[]) => {
    if (process.env.DEBUG === 'true') {
      logger.debug('SEARCH', msg.join(' '));
    }
  };
  
      try {
        const normalized = normalizeParams(args);
        const { format = 'index', ...filters } = normalized;
        let results: ObservationSearchResult[] = [];

        // Search for how-it-works concept observations
        if (chromaClient) {
          try {
            silentDebug('[search-server] Using metadata-first + semantic ranking for how-it-works');
            const metadataResults = search.findByConcept('how-it-works', filters);

            if (metadataResults.length > 0) {
              const ids = metadataResults.map(obs => obs.id);
              const chromaResults = await queryChroma(chromaClient, 'how it works architecture', Math.min(ids.length, 100));

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
          } catch (chromaError: any) {
            silentDebug('[search-server] Chroma ranking failed, using SQLite order:', chromaError.message);
          }
        }

        if (results.length === 0) {
          results = search.findByConcept('how-it-works', filters);
        }

        if (results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No "how it works" observations found'
            }]
          };
        }

        let combinedText: string;
        if (format === 'index') {
          const header = `Found ${results.length} "how it works" observation(s):\n\n`;
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