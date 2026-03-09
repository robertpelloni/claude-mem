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

export async function handle_search(args: any, context: HandlerContext) {
  const { search, store, chromaClient } = context;
  const silentDebug = (...msg: any[]) => {
    if (process.env.DEBUG === 'true') {
      logger.debug('SEARCH', msg.join(' '));
    }
  };
  
      try {
        // Normalize URL-friendly params to internal format
        const normalized = normalizeParams(args);
        const { query, format = 'index', type, obs_type, concepts, files, ...options } = normalized;
        let observations: ObservationSearchResult[] = [];
        let sessions: SessionSummarySearchResult[] = [];
        let prompts: UserPromptSearchResult[] = [];

        // Determine which types to query based on type filter
        const searchObservations = !type || type === 'observations';
        const searchSessions = !type || type === 'sessions';
        const searchPrompts = !type || type === 'prompts';

        // PATH 1: FILTER-ONLY (no query text) - Skip Chroma/FTS5, use direct SQLite filtering
        // This path enables date filtering which Chroma cannot do (requires direct SQLite access)
        if (!query) {
          silentDebug(`[search-server] Filter-only query (no query text), using direct SQLite filtering (enables date filters)`);
          const obsOptions = { ...options, type: obs_type, concepts, files };
          if (searchObservations) {
            observations = search.searchObservations(undefined, obsOptions);
          }
          if (searchSessions) {
            sessions = search.searchSessions(undefined, options);
          }
          if (searchPrompts) {
            prompts = search.searchUserPrompts(undefined, options);
          }
        }
        // PATH 2: CHROMA SEMANTIC SEARCH (query text + Chroma available)
        else if (chromaClient) {
          let chromaSucceeded = false;
          try {
            silentDebug(`[search-server] Using ChromaDB semantic search (type filter: ${type || 'all'})`);

            // Build Chroma where filter for doc_type
            let whereFilter: Record<string, any> | undefined;
            if (type === 'observations') {
              whereFilter = { doc_type: 'observation' };
            } else if (type === 'sessions') {
              whereFilter = { doc_type: 'session_summary' };
            } else if (type === 'prompts') {
              whereFilter = { doc_type: 'user_prompt' };
            }

            // Step 1: Chroma semantic search with optional type filter
            const chromaResults = await queryChroma(chromaClient, query, 100, whereFilter);
            chromaSucceeded = true; // Chroma didn't throw error
            silentDebug(`[search-server] ChromaDB returned ${chromaResults.ids.length} semantic matches`);

            if (chromaResults.ids.length > 0) {
              // Step 2: Filter by recency (90 days)
              const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
              const recentMetadata = chromaResults.metadatas.map((meta, idx) => ({
                id: chromaResults.ids[idx],
                meta,
                isRecent: meta && meta.created_at_epoch > ninetyDaysAgo
              })).filter(item => item.isRecent);

              silentDebug(`[search-server] ${recentMetadata.length} results within 90-day window`);

              // Step 3: Categorize IDs by document type
              const obsIds: number[] = [];
              const sessionIds: number[] = [];
              const promptIds: number[] = [];

              for (const item of recentMetadata) {
                const docType = item.meta?.doc_type;
                if (docType === 'observation' && searchObservations) {
                  obsIds.push(item.id);
                } else if (docType === 'session_summary' && searchSessions) {
                  sessionIds.push(item.id);
                } else if (docType === 'user_prompt' && searchPrompts) {
                  promptIds.push(item.id);
                }
              }

              silentDebug(`[search-server] Categorized: ${obsIds.length} obs, ${sessionIds.length} sessions, ${promptIds.length} prompts`);

              // Step 4: Hydrate from SQLite with additional filters
              if (obsIds.length > 0) {
                // Apply obs_type, concepts, files filters if provided
                const obsOptions = { ...options, type: obs_type, concepts, files };
                observations = store.getObservationsByIds(obsIds, obsOptions);
              }
              if (sessionIds.length > 0) {
                sessions = store.getSessionSummariesByIds(sessionIds, { orderBy: 'date_desc', limit: options.limit });
              }
              if (promptIds.length > 0) {
                prompts = store.getUserPromptsByIds(promptIds, { orderBy: 'date_desc', limit: options.limit });
              }

              silentDebug(`[search-server] Hydrated ${observations.length} obs, ${sessions.length} sessions, ${prompts.length} prompts from SQLite`);
            } else {
              // Chroma returned 0 results - this is the correct answer, don't fall back to FTS5
              silentDebug(`[search-server] ChromaDB found no matches (this is final - NOT falling back to FTS5)`);
            }
          } catch (chromaError: any) {
            silentDebug('[search-server] ChromaDB failed - returning empty results (FTS5 fallback removed):', chromaError.message);
            silentDebug('[search-server] Install UVX/Python to enable vector search: https://docs.astral.sh/uv/getting-started/installation/');
            // Return empty results - no fallback
            observations = [];
            sessions = [];
            prompts = [];
          }
        }
        // ChromaDB not initialized - return empty results (no fallback)
        else {
          silentDebug(`[search-server] ChromaDB not initialized - returning empty results (FTS5 fallback removed)`);
          silentDebug(`[search-server] Install UVX/Python to enable vector search: https://docs.astral.sh/uv/getting-started/installation/`);
          observations = [];
          sessions = [];
          prompts = [];
        }

        const totalResults = observations.length + sessions.length + prompts.length;

        if (totalResults === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No results found matching "${query}"`
            }]
          };
        }

        // Combine all results with timestamps for unified sorting
        interface CombinedResult {
          type: 'observation' | 'session' | 'prompt';
          data: any;
          epoch: number;
        }

        const allResults: CombinedResult[] = [
          ...observations.map(obs => ({ type: 'observation' as const, data: obs, epoch: obs.created_at_epoch })),
          ...sessions.map(sess => ({ type: 'session' as const, data: sess, epoch: sess.created_at_epoch })),
          ...prompts.map(prompt => ({ type: 'prompt' as const, data: prompt, epoch: prompt.created_at_epoch }))
        ];

        // Sort by date (most recent first)
        if (options.orderBy === 'date_desc') {
          allResults.sort((a, b) => b.epoch - a.epoch);
        } else if (options.orderBy === 'date_asc') {
          allResults.sort((a, b) => a.epoch - b.epoch);
        }

        // Apply limit across all types
        const limitedResults = allResults.slice(0, options.limit || 20);

        // Format based on requested format
        let combinedText: string;
        if (format === 'index') {
          const header = `Found ${totalResults} result(s) matching "${query}" (${observations.length} obs, ${sessions.length} sessions, ${prompts.length} prompts):\n\n`;
          const formattedResults = limitedResults.map((item, i) => {
            if (item.type === 'observation') {
              return formatObservationIndex(item.data, i);
            } else if (item.type === 'session') {
              return formatSessionIndex(item.data, i);
            } else {
              return formatUserPromptIndex(item.data, i);
            }
          });
          combinedText = header + formattedResults.join('\n\n') + formatSearchTips();
        } else {
          const formattedResults = limitedResults.map(item => {
            if (item.type === 'observation') {
              return formatObservationResult(item.data);
            } else if (item.type === 'session') {
              return formatSessionResult(item.data);
            } else {
              return formatUserPromptResult(item.data);
            }
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