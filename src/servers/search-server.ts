import { logger } from '../../utils/logger.js';
/**
 * Claude-mem MCP Search Server
 * Exposes SessionSearch capabilities as MCP tools with search_result formatting
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { basename } from 'path';
import { SessionSearch } from '../services/sqlite/SessionSearch.js';
import { SessionStore } from '../services/sqlite/SessionStore.js';
import { ObservationSearchResult, SessionSummarySearchResult, UserPromptSearchResult } from '../services/sqlite/types.js';
import { VECTOR_DB_DIR } from '../shared/paths.js';
import { silentDebug } from '../utils/silent-debug.js';
import {
  formatObservationIndex,
  formatObservationResult,
  formatSessionIndex,
  formatSessionResult,
  formatUserPromptIndex,
  formatUserPromptResult,
  formatSearchTips,
  filterTimelineByDepth,
  type TimelineItem
} from './search-server/formatters/index.js';
import { normalizeParams } from './search-server/utils/normalize-params.js';
import { queryChroma } from './search-server/utils/query-chroma.js';
import { handle_search } from './handlers/search.js';
import { handle_timeline } from './handlers/timeline.js';
import { handle_decisions } from './handlers/decisions.js';
import { handle_changes } from './handlers/changes.js';
import { handle_how_it_works } from './handlers/how_it_works.js';
import { handle_search_observations } from './handlers/search_observations.js';
import { handle_search_sessions } from './handlers/search_sessions.js';
import { handle_find_by_concept } from './handlers/find_by_concept.js';
import { handle_find_by_file } from './handlers/find_by_file.js';
import { handle_find_by_type } from './handlers/find_by_type.js';
import { handle_get_recent_context } from './handlers/get_recent_context.js';
import { handle_search_user_prompts } from './handlers/search_user_prompts.js';
import { handle_get_context_timeline } from './handlers/get_context_timeline.js';
import { handle_get_timeline_by_query } from './handlers/get_timeline_by_query.js';


// Initialize search instances
let search: SessionSearch;
let store: SessionStore;
let chromaClient: Client | null = null;

try {
  search = new SessionSearch();
  store = new SessionStore();
} catch (error: any) {
  silentDebug('[search-server] Failed to initialize search', { error: error.message });
  process.exit(1);
}

/**
 * Common filter schema (accepts simple strings that get normalized to arrays)
 */
const filterSchema = z.object({
  project: z.string().optional().describe('Filter by project name'),
  type: z.union([
    z.enum(['decision', 'bugfix', 'feature', 'refactor', 'discovery', 'change']),
    z.array(z.enum(['decision', 'bugfix', 'feature', 'refactor', 'discovery', 'change']))
  ]).optional().describe('Filter by observation type (single value or comma-separated list)'),
  concepts: z.union([z.string(), z.array(z.string())]).optional().describe('Filter by concept tags (single value or comma-separated list)'),
  files: z.union([z.string(), z.array(z.string())]).optional().describe('Filter by file paths (single value or comma-separated list for partial match)'),
  dateStart: z.union([z.string(), z.number()]).optional().describe('Start date (ISO string or epoch)'),
  dateEnd: z.union([z.string(), z.number()]).optional().describe('End date (ISO string or epoch)'),
  dateRange: z.object({
    start: z.union([z.string(), z.number()]).optional().describe('Start date (ISO string or epoch)'),
    end: z.union([z.string(), z.number()]).optional().describe('End date (ISO string or epoch)')
  }).optional().describe('Filter by date range (use dateStart/dateEnd instead for simpler URLs)'),
  limit: z.number().min(1).max(100).default(20).describe('Maximum number of results'),
  offset: z.number().min(0).default(0).describe('Number of results to skip'),
  orderBy: z.enum(['relevance', 'date_desc', 'date_asc']).default('date_desc').describe('Sort order')
});

// Define tool schemas
const tools = [
  {
    name: 'search',
    description: 'Unified search across all memory types (observations, sessions, and user prompts) using vector-first semantic search (ChromaDB). Returns combined results from all document types. IMPORTANT: Always use index format first (default) to get an overview with minimal token usage, then use format: "full" only for specific items of interest.',
    inputSchema: z.object({
      query: z.string().optional().describe('Natural language search query for semantic ranking via ChromaDB vector search. Optional - omit for date-filtered queries only (Chroma cannot filter by date, requires direct SQLite).'),
      format: z.enum(['index', 'full']).default('index').describe('Output format: "index" for titles/dates only (default, RECOMMENDED for initial search), "full" for complete details (use only after reviewing index results)'),
      type: z.enum(['observations', 'sessions', 'prompts']).optional().describe('Filter by document type (observations, sessions, or prompts). Omit to search all types.'),
      obs_type: z.string().optional().describe('Filter observations by type (single value or comma-separated list: decision,bugfix,feature,refactor,discovery,change). Only applies when type="observations"'),
      concepts: z.string().optional().describe('Filter by concept tags (single value or comma-separated list). Only applies when type="observations"'),
      files: z.string().optional().describe('Filter by file paths (single value or comma-separated list for partial match). Only applies when type="observations"'),
      project: z.string().optional().describe('Filter by project name'),
      dateStart: z.union([z.string(), z.number()]).optional().describe('Start date for filtering (ISO string or epoch timestamp)'),
      dateEnd: z.union([z.string(), z.number()]).optional().describe('End date for filtering (ISO string or epoch timestamp)'),
      limit: z.number().min(1).max(100).default(20).describe('Maximum number of results'),
      offset: z.number().min(0).default(0).describe('Number of results to skip'),
      orderBy: z.enum(['relevance', 'date_desc', 'date_asc']).default('date_desc').describe('Sort order')
    }),
    handler: async (args: any) => handle_search(args, { search, store, chromaClient })
  },
  {
    name: 'timeline',
    description: 'Get a unified timeline of context around a specific point in time OR search query. Supports two modes: (1) anchor-based: provide observation ID, session ID, or timestamp to center timeline around; (2) query-based: provide natural language query to find relevant observation and center timeline around it. All record types (observations, sessions, prompts) are interleaved chronologically.',
    inputSchema: z.object({
      anchor: z.union([
        z.number(),
        z.string()
      ]).optional().describe('Anchor point: observation ID (number), session ID (e.g., "S123"), or ISO timestamp. Use this OR query, not both.'),
      query: z.string().optional().describe('Natural language search query to find relevant observation as anchor. Use this OR anchor, not both.'),
      depth_before: z.number().min(0).max(50).default(10).describe('Number of records to retrieve before anchor (default: 10)'),
      depth_after: z.number().min(0).max(50).default(10).describe('Number of records to retrieve after anchor (default: 10)'),
      project: z.string().optional().describe('Filter by project name')
    }),
    handler: async (args: any) => handle_timeline(args, { search, store, chromaClient })
  },
  {
    name: 'decisions',
    description: 'Semantic shortcut to find decision-type observations. Returns observations where important architectural, technical, or process decisions were made. Supports optional semantic search query to filter decisions by relevance.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search query to filter decisions semantically'),
      format: z.enum(['index', 'full']).default('index').describe('Output format: "index" for titles/dates only (default), "full" for complete details'),
      project: z.string().optional().describe('Filter by project name'),
      dateStart: z.union([z.string(), z.number()]).optional().describe('Start date for filtering (ISO string or epoch timestamp)'),
      dateEnd: z.union([z.string(), z.number()]).optional().describe('End date for filtering (ISO string or epoch timestamp)'),
      limit: z.number().min(1).max(100).default(20).describe('Maximum number of results'),
      offset: z.number().min(0).default(0).describe('Number of results to skip'),
      orderBy: z.enum(['relevance', 'date_desc', 'date_asc']).default('date_desc').describe('Sort order')
    }),
    handler: async (args: any) => handle_decisions(args, { search, store, chromaClient })
  },
  {
    name: 'changes',
    description: 'Semantic shortcut to find change-related observations. Returns observations documenting what changed in the codebase, system behavior, or project state. Searches for type="change" OR concept="change" OR concept="what-changed".',
    inputSchema: z.object({
      format: z.enum(['index', 'full']).default('index').describe('Output format: "index" for titles/dates only (default), "full" for complete details'),
      project: z.string().optional().describe('Filter by project name'),
      dateStart: z.union([z.string(), z.number()]).optional().describe('Start date for filtering (ISO string or epoch timestamp)'),
      dateEnd: z.union([z.string(), z.number()]).optional().describe('End date for filtering (ISO string or epoch timestamp)'),
      limit: z.number().min(1).max(100).default(20).describe('Maximum number of results'),
      offset: z.number().min(0).default(0).describe('Number of results to skip'),
      orderBy: z.enum(['relevance', 'date_desc', 'date_asc']).default('date_desc').describe('Sort order')
    }),
    handler: async (args: any) => handle_changes(args, { search, store, chromaClient })
  },
  {
    name: 'how_it_works',
    description: 'Semantic shortcut to find "how it works" explanations. Returns observations documenting system architecture, component interactions, data flow, and technical mechanisms. Searches for concept="how-it-works".',
    inputSchema: z.object({
      format: z.enum(['index', 'full']).default('index').describe('Output format: "index" for titles/dates only (default), "full" for complete details'),
      project: z.string().optional().describe('Filter by project name'),
      dateStart: z.union([z.string(), z.number()]).optional().describe('Start date for filtering (ISO string or epoch timestamp)'),
      dateEnd: z.union([z.string(), z.number()]).optional().describe('End date for filtering (ISO string or epoch timestamp)'),
      limit: z.number().min(1).max(100).default(20).describe('Maximum number of results'),
      offset: z.number().min(0).default(0).describe('Number of results to skip'),
      orderBy: z.enum(['relevance', 'date_desc', 'date_asc']).default('date_desc').describe('Sort order')
    }),
    handler: async (args: any) => handle_how_it_works(args, { search, store, chromaClient })
  },
  {
    name: 'search_observations',
    description: 'DEPRECATED: Use the unified "search" tool instead. Search observations using vector-first semantic search (ChromaDB). IMPORTANT: Always use index format first (default) to get an overview with minimal token usage, then use format: "full" only for specific items of interest.',
    inputSchema: z.object({
      query: z.string().describe('Natural language search query for semantic ranking via ChromaDB vector search'),
      format: z.enum(['index', 'full']).default('index').describe('Output format: "index" for titles/dates only (default, RECOMMENDED for initial search), "full" for complete details (use only after reviewing index results)'),
      ...filterSchema.shape
    }),
    handler: async (args: any) => handle_search_observations(args, { search, store, chromaClient })
  },
  {
    name: 'search_sessions',
    description: 'DEPRECATED: Use the unified "search" tool instead. Search session summaries using vector-first semantic search (ChromaDB). IMPORTANT: Always use index format first (default) to get an overview with minimal token usage, then use format: "full" only for specific items of interest.',
    inputSchema: z.object({
      query: z.string().describe('Natural language search query for semantic ranking via ChromaDB vector search'),
      format: z.enum(['index', 'full']).default('index').describe('Output format: "index" for titles/dates only (default, RECOMMENDED for initial search), "full" for complete details (use only after reviewing index results)'),
      project: z.string().optional().describe('Filter by project name'),
      dateStart: z.union([z.string(), z.number()]).optional().describe('Start date for filtering (ISO string or epoch timestamp)'),
      dateEnd: z.union([z.string(), z.number()]).optional().describe('End date for filtering (ISO string or epoch timestamp)'),
      limit: z.number().min(1).max(100).default(20).describe('Maximum number of results'),
      offset: z.number().min(0).default(0).describe('Number of results to skip'),
      orderBy: z.enum(['relevance', 'date_desc', 'date_asc']).default('date_desc').describe('Sort order')
    }),
    handler: async (args: any) => handle_search_sessions(args, { search, store, chromaClient })
  },
  {
    name: 'find_by_concept',
    description: 'Find observations tagged with a specific concept. Available concepts: "discovery", "problem-solution", "what-changed", "how-it-works", "pattern", "gotcha", "change". IMPORTANT: Always use index format first (default) to get an overview with minimal token usage, then use format: "full" only for specific items of interest.',
    inputSchema: z.object({
      concept: z.string().describe('Concept tag to search for. Available: discovery, problem-solution, what-changed, how-it-works, pattern, gotcha, change'),
      format: z.enum(['index', 'full']).default('index').describe('Output format: "index" for titles/dates only (default, RECOMMENDED for initial search), "full" for complete details (use only after reviewing index results)'),
      project: z.string().optional().describe('Filter by project name'),
      dateStart: z.union([z.string(), z.number()]).optional().describe('Start date for filtering (ISO string or epoch timestamp)'),
      dateEnd: z.union([z.string(), z.number()]).optional().describe('End date for filtering (ISO string or epoch timestamp)'),
      limit: z.number().min(1).max(100).default(20).describe('Maximum results. IMPORTANT: Start with 3-5 to avoid exceeding MCP token limits, even in index mode.'),
      offset: z.number().min(0).default(0).describe('Number of results to skip'),
      orderBy: z.enum(['relevance', 'date_desc', 'date_asc']).default('date_desc').describe('Sort order')
    }),
    handler: async (args: any) => handle_find_by_concept(args, { search, store, chromaClient })
  },
  {
    name: 'find_by_file',
    description: 'Find observations and sessions that reference a specific file path. IMPORTANT: Always use index format first (default) to get an overview with minimal token usage, then use format: "full" only for specific items of interest.',
    inputSchema: z.object({
      filePath: z.string().describe('File path to search for (supports partial matching)'),
      format: z.enum(['index', 'full']).default('index').describe('Output format: "index" for titles/dates only (default, RECOMMENDED for initial search), "full" for complete details (use only after reviewing index results)'),
      project: z.string().optional().describe('Filter by project name'),
      dateStart: z.union([z.string(), z.number()]).optional().describe('Start date for filtering (ISO string or epoch timestamp)'),
      dateEnd: z.union([z.string(), z.number()]).optional().describe('End date for filtering (ISO string or epoch timestamp)'),
      limit: z.number().min(1).max(100).default(20).describe('Maximum results. IMPORTANT: Start with 3-5 to avoid exceeding MCP token limits, even in index mode.'),
      offset: z.number().min(0).default(0).describe('Number of results to skip'),
      orderBy: z.enum(['relevance', 'date_desc', 'date_asc']).default('date_desc').describe('Sort order')
    }),
    handler: async (args: any) => handle_find_by_file(args, { search, store, chromaClient })
  },
  {
    name: 'find_by_type',
    description: 'Find observations of a specific type (decision, bugfix, feature, refactor, discovery, change). IMPORTANT: Always use index format first (default) to get an overview with minimal token usage, then use format: "full" only for specific items of interest.',
    inputSchema: z.object({
      type: z.string().describe('Observation type(s) to filter by (single value or comma-separated list: decision,bugfix,feature,refactor,discovery,change)'),
      format: z.enum(['index', 'full']).default('index').describe('Output format: "index" for titles/dates only (default, RECOMMENDED for initial search), "full" for complete details (use only after reviewing index results)'),
      project: z.string().optional().describe('Filter by project name'),
      dateStart: z.union([z.string(), z.number()]).optional().describe('Start date for filtering (ISO string or epoch timestamp)'),
      dateEnd: z.union([z.string(), z.number()]).optional().describe('End date for filtering (ISO string or epoch timestamp)'),
      limit: z.number().min(1).max(100).default(20).describe('Maximum results. IMPORTANT: Start with 3-5 to avoid exceeding MCP token limits, even in index mode.'),
      offset: z.number().min(0).default(0).describe('Number of results to skip'),
      orderBy: z.enum(['relevance', 'date_desc', 'date_asc']).default('date_desc').describe('Sort order')
    }),
    handler: async (args: any) => handle_find_by_type(args, { search, store, chromaClient })
  },
  {
    name: 'get_recent_context',
    description: 'Get recent session context including summaries and observations for a project',
    inputSchema: z.object({
      project: z.string().optional().describe('Project name (defaults to current working directory basename)'),
      limit: z.number().min(1).max(10).default(3).describe('Number of recent sessions to retrieve')
    }),
    handler: async (args: any) => handle_get_recent_context(args, { search, store, chromaClient })
  },
  {
    name: 'search_user_prompts',
    description: 'DEPRECATED: Use the unified "search" tool instead. Search raw user prompts using vector-first semantic search (ChromaDB). Use this to find what the user actually said/requested across all sessions. IMPORTANT: Always use index format first (default) to get an overview with minimal token usage, then use format: "full" only for specific items of interest.',
    inputSchema: z.object({
      query: z.string().describe('Natural language search query for semantic ranking via ChromaDB vector search'),
      format: z.enum(['index', 'full']).default('index').describe('Output format: "index" for truncated prompts/dates (default, RECOMMENDED for initial search), "full" for complete prompt text (use only after reviewing index results)'),
      project: z.string().optional().describe('Filter by project name'),
      dateStart: z.union([z.string(), z.number()]).optional().describe('Start date for filtering (ISO string or epoch timestamp)'),
      dateEnd: z.union([z.string(), z.number()]).optional().describe('End date for filtering (ISO string or epoch timestamp)'),
      limit: z.number().min(1).max(100).default(20).describe('Maximum number of results'),
      offset: z.number().min(0).default(0).describe('Number of results to skip'),
      orderBy: z.enum(['relevance', 'date_desc', 'date_asc']).default('date_desc').describe('Sort order')
    }),
    handler: async (args: any) => handle_search_user_prompts(args, { search, store, chromaClient })
  },
  {
    name: 'get_context_timeline',
    description: 'Get a unified timeline of context (observations, sessions, and prompts) around a specific point in time. All record types are interleaved chronologically. Useful for understanding "what was happening when X occurred". Returns depth_before records before anchor + anchor + depth_after records after (total: depth_before + 1 + depth_after mixed records).',
    inputSchema: z.object({
      anchor: z.union([
        z.number().describe('Observation ID to center timeline around'),
        z.string().describe('Session ID (format: S123) or ISO timestamp to center timeline around')
      ]).describe('Anchor point: observation ID, session ID (e.g., "S123"), or ISO timestamp'),
      depth_before: z.number().min(0).max(50).default(10).describe('Number of records to retrieve before anchor, not including anchor (default: 10)'),
      depth_after: z.number().min(0).max(50).default(10).describe('Number of records to retrieve after anchor, not including anchor (default: 10)'),
      project: z.string().optional().describe('Filter by project name')
    }),
    handler: async (args: any) => handle_get_context_timeline(args, { search, store, chromaClient })
  },
  {
    name: 'get_timeline_by_query',
    description: 'Search for observations using natural language and get timeline context around the best match. Two modes: "auto" (default) automatically uses top result as timeline anchor; "interactive" returns top matches for you to choose from. This combines search + timeline into a single operation for faster context discovery.',
    inputSchema: z.object({
      query: z.string().describe('Natural language search query to find relevant observations'),
      mode: z.enum(['auto', 'interactive']).default('auto').describe('auto: Automatically use top search result as timeline anchor. interactive: Show top N search results for manual anchor selection.'),
      depth_before: z.number().min(0).max(50).default(10).describe('Number of timeline records before anchor (default: 10)'),
      depth_after: z.number().min(0).max(50).default(10).describe('Number of timeline records after anchor (default: 10)'),
      limit: z.number().min(1).max(20).default(5).describe('For interactive mode: number of top search results to display (default: 5)'),
      project: z.string().optional().describe('Filter by project name')
    }),
    handler: async (args: any) => handle_get_timeline_by_query(args, { search, store, chromaClient })
  }
];

/**
 * Create and start the MCP server
 */
const server = new Server(
  {
    name: 'borg-extension-search',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools/list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema) as any
    }))
  };
});

// Register tools/call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find(t => t.name === request.params.name);

  if (!tool) {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  try {
    return await tool.handler(request.params.arguments || {});
  } catch (error: any) {
    return {
      content: [{
        type: 'text' as const,
        text: `Tool execution failed: ${error.message}`
      }],
      isError: true
    };
  }
});

// Cleanup function to properly terminate all child processes
async function cleanup() {
  silentDebug('[search-server] Shutting down...');
  
  // Close Chroma client (terminates uvx/python processes)
  if (chromaClient) {
    try {
      await chromaClient.close();
      silentDebug('[search-server] Chroma client closed');
    } catch (error: any) {
      silentDebug('[search-server] Error closing Chroma client:', error.message);
    }
  }
  
  // Close database connections
  if (search) {
    try {
      search.close();
      silentDebug('[search-server] SessionSearch closed');
    } catch (error: any) {
      silentDebug('[search-server] Error closing SessionSearch:', error.message);
    }
  }
  
  if (store) {
    try {
      store.close();
      silentDebug('[search-server] SessionStore closed');
    } catch (error: any) {
      silentDebug('[search-server] Error closing SessionStore:', error.message);
    }
  }
  
  silentDebug('[search-server] Shutdown complete');
  process.exit(0);
}

// Register cleanup handlers for graceful shutdown
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Start the server
async function main() {
  // Start the MCP server FIRST (critical - must start before blocking operations)
  const transport = new StdioServerTransport();
  await server.connect(transport);
  silentDebug('[search-server] Claude-mem search server started');

  // Initialize Chroma client in background (non-blocking)
  setTimeout(async () => {
    try {
      silentDebug('[search-server] Initializing Chroma client...');
      const chromaTransport = new StdioClientTransport({
        command: 'uvx',
        args: ['chroma-mcp', '--client-type', 'persistent', '--data-dir', VECTOR_DB_DIR],
        stderr: 'ignore'
      });

      const client = new Client({
        name: 'borg-extension-search-chroma-client',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      await client.connect(chromaTransport);
      chromaClient = client;
      silentDebug('[search-server] Chroma client connected successfully');
    } catch (error: any) {
      silentDebug('[search-server] Failed to initialize Chroma client:', error.message);
      silentDebug('[search-server] Vector search unavailable - text queries will return empty results (FTS5 fallback removed)');
      silentDebug('[search-server] Install UVX/Python to enable vector search: https://docs.astral.sh/uv/getting-started/installation/');
      chromaClient = null;
    }
  }, 0);
}

main().catch((error) => {
  silentDebug('[search-server] Fatal error:', error);
  process.exit(1);
});
