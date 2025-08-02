import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ExtractTextParamsSchema } from '../types/mcp-types.js';
import { ExtractTextResult } from '../types/pdf-types.js';
import { PDFProcessor } from '../services/pdf-processor.js';
import { handleError } from '../utils/error-handling.js';

export const extractTextTool: Tool = {
  name: 'extract_pdf_text',
  description: 'Extract text content from PDF documents with optional metadata and formatting preservation',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the PDF file to extract text from'
      },
      pages: {
        type: 'string',
        description: 'Page range to extract (e.g., "1-5", "1,3,5", or "all")',
        default: 'all'
      },
      preserve_formatting: {
        type: 'boolean',
        description: 'Whether to preserve text formatting and structure',
        default: true
      },
      include_metadata: {
        type: 'boolean',
        description: 'Whether to include document metadata in the response',
        default: false
      }
    },
    required: ['file_path']
  }
};

export async function handleExtractText(args: unknown): Promise<ExtractTextResult> {
  try {
    const params = ExtractTextParamsSchema.parse(args);
    const processor = new PDFProcessor();
    
    const result = await processor.extractText(
      params.file_path,
      params.preserve_formatting
    );

    const response: ExtractTextResult = {
      text: result.text,
      page_count: result.pageCount,
      processing_time_ms: result.processingTimeMs
    };

    if (params.include_metadata) {
      response.metadata = result.metadata;
    }

    return response;
  } catch (error) {
    const mcpError = handleError(error, typeof args === 'object' && args !== null && 'file_path' in args ? String(args.file_path) : undefined);
    throw new Error(JSON.stringify(mcpError));
  }
}