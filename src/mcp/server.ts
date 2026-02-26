#!/usr/bin/env node

/**
 * MCP Server for Keyword Research Tool
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ahrefsOrganicKeywordsByUrl } from './tools/ahrefs-organic.js';
import { googleAdsHistoricalMetrics } from './tools/google-ads-metrics.js';
import { clusterAndScore } from './tools/cluster-score.js';
import { buildReport } from './tools/build-report.js';
import logger from '../utils/logger.js';

const server = new Server(
  {
    name: 'kw-research-dental',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'ahrefsOrganicKeywordsByUrl',
        description:
          'Fetch organic keywords for a URL from Ahrefs API. Returns keywords with position, traffic, and volume data.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to analyze (must match URL in Ahrefs database)',
            },
            country: {
              type: 'string',
              description: 'Country code (default: es)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of keywords to fetch (default: 100)',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'googleAdsHistoricalMetrics',
        description:
          'Get historical metrics for keywords from Google Ads Keyword Planner. Returns volume, CPC, and competition data.',
        inputSchema: {
          type: 'object',
          properties: {
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of keywords to get metrics for (max 1000)',
            },
            geo: {
              type: 'string',
              description: 'Country code for targeting (default: ES)',
            },
            lang: {
              type: 'string',
              description: 'Language code (default: es)',
            },
          },
          required: ['keywords'],
        },
      },
      {
        name: 'clusterAndScore',
        description:
          'Analyze keywords: classify dental treatments, detect intent (local + commercial), calculate scores (0-100), and cluster by treatment.',
        inputSchema: {
          type: 'object',
          properties: {
            keywords: {
              type: 'array',
              description: 'Array of keyword objects to analyze',
            },
          },
          required: ['keywords'],
        },
      },
      {
        name: 'buildReport',
        description:
          'Generate reports in multiple formats (CSV, JSON, Markdown) from analyzed keywords and clusters.',
        inputSchema: {
          type: 'object',
          properties: {
            keywords: {
              type: 'array',
              description: 'Array of analyzed keywords',
            },
            clusters: {
              type: 'array',
              description: 'Array of keyword clusters',
            },
            url: {
              type: 'string',
              description: 'Original URL analyzed',
            },
            country: {
              type: 'string',
              description: 'Country code (default: ES)',
            },
          },
          required: ['keywords', 'clusters', 'url'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    logger.info(`MCP tool called: ${name}`, args);

    switch (name) {
      case 'ahrefsOrganicKeywordsByUrl': {
        const result = await ahrefsOrganicKeywordsByUrl(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'googleAdsHistoricalMetrics': {
        const result = await googleAdsHistoricalMetrics(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'clusterAndScore': {
        const result = await clusterAndScore(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'buildReport': {
        const result = await buildReport(args as any);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ success: true, ...result }, null, 2) },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error(`MCP tool error: ${name}`, error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP Server started');
}

main().catch((error) => {
  logger.error('MCP Server failed to start', error);
  process.exit(1);
});
