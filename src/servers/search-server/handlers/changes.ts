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

export async function handle_changes(args: any, context: HandlerContext) {
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

        // Search for change-type observations and change-related concepts
        if (chromaClient) {
          try {
            silentDebug('[search-server] Using hybrid search for change-related observations');

            // Get all observations with type="change" or concepts containing change
            const typeResults = search.findByType('change', filters);
            const conceptChangeResults = search.findByConcept('change', filters);
            const conceptWhatChangedResults = search.findByConcept('what-changed', filters);

            // Combine and deduplicate
            const allIds = new Set<number>();
            [...typeResults, ...conceptChangeResults, ...conceptWhatChangedResults].forEach(obs => allIds.add(obs.id));

            if (allIds.size > 0) {
              const idsArray = Array.from(allIds);
              const chromaResults = await queryChroma(chromaClient, 'what changed', Math.min(idsArray.length, 100));

              const rankedIds: number[] = [];
              for (const chromaId of chromaResults.ids) {
                if (idsArray.includes(chromaId) && !rankedIds.includes(chromaId)) {
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
          const typeResults = search.findByType('change', filters);
          const conceptResults = search.findByConcept('change', filters);
          const whatChangedResults = search.findByConcept('what-changed', filters);

          const allIds = new Set<number>();
          [...typeResults, ...conceptResults, ...whatChangedResults].forEach(obs => allIds.add(obs.id));

          results = Array.from(allIds).map(id =>
            typeResults.find(obs => obs.id === id) ||
            conceptResults.find(obs => obs.id === id) ||
            whatChangedResults.find(obs => obs.id === id)
          ).filter(Boolean) as ObservationSearchResult[];

          results.sort((a, b) => b.created_at_epoch - a.created_at_epoch);
          results = results.slice(0, filters.limit || 20);
        }

        if (results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: 'No change-related observations found'
            }]
          };
        }

        let combinedText: string;
        if (format === 'index') {
          const header = `Found ${results.length} change-related observation(s):\n\n`;
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