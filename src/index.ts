#!/usr/bin/env node

// Note: pdf-parse library may output "Warning: Indexing all PDF objects" to stderr
// This is a harmless informational message from the native PDF parsing library

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { extractTextTool, handleExtractText } from './tools/extract-text.js';
import { extractMetadataTool, handleExtractMetadata } from './tools/extract-metadata.js';
import { extractPagesTool, handleExtractPages } from './tools/extract-pages.js';
import { validatePDFTool, handleValidatePDF } from './tools/validate-pdf.js';

class PDFExtractionServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'pdf-reader-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        extractTextTool,
        extractMetadataTool,
        extractPagesTool,
        validatePDFTool,
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'extract_pdf_text':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await handleExtractText(args), null, 2),
                },
              ],
            };

          case 'extract_pdf_metadata':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await handleExtractMetadata(args), null, 2),
                },
              ],
            };

          case 'extract_pdf_pages':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await handleExtractPages(args), null, 2),
                },
              ],
            };

          case 'validate_pdf':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await handleValidatePDF(args), null, 2),
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        try {
          const parsedError = JSON.parse(errorMessage);
          throw new Error(`MCP Error ${parsedError.code}: ${parsedError.message}`);
        } catch {
          throw new Error(`Tool execution failed: ${errorMessage}`);
        }
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('PDF Extraction MCP Server running on stdio');
  }
}

async function main() {
  const server = new PDFExtractionServer();
  await server.run();
}

// Run the server if this file is executed directly
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});