#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { z } from "zod";

// Configuration
const WORKER_URL = process.env.CLAUDE_MEM_WORKER_URL || "http://localhost:37777";
const TIMEOUT_MS = 10000;

// Tool Definitions
const SEARCH_TOOL: Tool = {
  name: "search_memory",
  description: "Search project history and past work using Claude-Mem.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query (e.g., 'how did we fix the login bug?').",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 5).",
      },
    },
    required: ["query"],
  },
};

const CONTEXT_TOOL: Tool = {
  name: "get_recent_context",
  description: "Retrieve recent context for the current project.",
  inputSchema: {
    type: "object",
    properties: {
      project: {
        type: "string",
        description: "The name of the project to retrieve context for.",
      },
    },
    required: ["project"],
  },
};

// Server Implementation
const server = new Server(
  {
    name: "claude-mem-gemini",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [SEARCH_TOOL, CONTEXT_TOOL],
  };
});

// Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_memory") {
      const query = String(args?.query || "");
      const limit = Number(args?.limit) || 5;

      const response = await axios.get(`${WORKER_URL}/api/search`, {
        params: { q: query, limit },
        timeout: TIMEOUT_MS,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    if (name === "get_recent_context") {
      const project = String(args?.project || "");

      const response = await axios.get(`${WORKER_URL}/api/context/inject`, {
        params: { project },
        timeout: TIMEOUT_MS,
      });

      return {
        content: [
          {
            type: "text",
            text: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    const errorMessage = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;

    return {
      content: [
        {
          type: "text",
          text: `Error calling tool '${name}': ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start Server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
