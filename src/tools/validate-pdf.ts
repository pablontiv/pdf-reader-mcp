import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ValidatePDFParamsSchema } from '../types/mcp-types.js';
import { ValidationResult } from '../types/pdf-types.js';
import { PDFProcessor } from '../services/pdf-processor.js';
import { handleError } from '../utils/error-handling.js';

export const validatePDFTool: Tool = {
  name: 'validate_pdf',
  description: 'Validate PDF file integrity and readability',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the PDF file to validate'
      }
    },
    required: ['file_path']
  }
};

export async function handleValidatePDF(args: unknown): Promise<ValidationResult> {
  try {
    const params = ValidatePDFParamsSchema.parse(args);
    const processor = new PDFProcessor();
    
    return await processor.validatePDF(params.file_path);
  } catch (error) {
    const mcpError = handleError(error, typeof args === 'object' && args !== null && 'file_path' in args ? String(args.file_path) : undefined);
    throw new Error(JSON.stringify(mcpError));
  }
}