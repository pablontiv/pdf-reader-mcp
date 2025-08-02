import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ExtractPagesParamsSchema } from '../types/mcp-types.js';
import { ExtractPagesResult } from '../types/pdf-types.js';
import { TextExtractor } from '../services/text-extractor.js';
import { handleError } from '../utils/error-handling.js';

export const extractPagesTool: Tool = {
  name: 'extract_pdf_pages',
  description: 'Extract content from specific pages or page ranges of PDF documents',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the PDF file to extract pages from'
      },
      page_range: {
        type: 'string',
        description: 'Page range to extract (e.g., "1-3", "2,4,6", or "all")'
      },
      output_format: {
        type: 'string',
        enum: ['text', 'structured'],
        description: 'Output format: "text" for plain text, "structured" for formatted text',
        default: 'text'
      }
    },
    required: ['file_path', 'page_range']
  }
};

export async function handleExtractPages(args: unknown): Promise<ExtractPagesResult> {
  try {
    const params = ExtractPagesParamsSchema.parse(args);
    const extractor = new TextExtractor();
    
    return await extractor.extractFromPages(
      params.file_path,
      params.page_range,
      params.output_format
    );
  } catch (error) {
    const mcpError = handleError(error, typeof args === 'object' && args !== null && 'file_path' in args ? String(args.file_path) : undefined);
    throw new Error(JSON.stringify(mcpError));
  }
}