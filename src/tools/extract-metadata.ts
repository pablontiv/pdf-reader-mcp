import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ExtractMetadataParamsSchema } from '../types/mcp-types.js';
import { PDFMetadata } from '../types/pdf-types.js';
import { MetadataParser } from '../services/metadata-parser.js';
import { handleError } from '../utils/error-handling.js';

export const extractMetadataTool: Tool = {
  name: 'extract_pdf_metadata',
  description: 'Extract metadata and document information from PDF files',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the PDF file to extract metadata from'
      }
    },
    required: ['file_path']
  }
};

export async function handleExtractMetadata(args: unknown): Promise<PDFMetadata> {
  try {
    const params = ExtractMetadataParamsSchema.parse(args);
    const parser = new MetadataParser();
    
    return await parser.parseMetadata(params.file_path);
  } catch (error) {
    const mcpError = handleError(error, typeof args === 'object' && args !== null && 'file_path' in args ? String(args.file_path) : undefined);
    throw new Error(JSON.stringify(mcpError));
  }
}