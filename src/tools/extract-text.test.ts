import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { extractTextTool, handleExtractText } from './extract-text.js';
import { PDFProcessor } from '../services/pdf-processor.js';
import { ExtractTextParamsSchema } from '../types/mcp-types.js';
import { ValidationError } from '../utils/validation.js';
import { TestFixtures } from '../utils/test-helpers.js';

// Mock PDFProcessor
vi.mock('../services/pdf-processor.js');

describe('Extract Text Tool', () => {
  let mockPDFProcessor: {
    extractText: Mock;
  };

  beforeEach(() => {
    mockPDFProcessor = {
      extractText: vi.fn()
    };
    (PDFProcessor as any).mockImplementation(() => mockPDFProcessor);
  });

  describe('Tool Definition', () => {
    it('should have correct MCP tool structure', () => {
      expect(extractTextTool.name).toBe('extract_pdf_text');
      expect(extractTextTool.description).toBeDefined();
      expect(extractTextTool.inputSchema).toBeDefined();
      expect(extractTextTool.inputSchema.type).toBe('object');
      expect(extractTextTool.inputSchema.required).toContain('file_path');
    });

    it('should define correct input schema properties', () => {
      const { properties } = extractTextTool.inputSchema;
      
      expect(properties?.file_path).toEqual({
        type: 'string',
        description: 'Path to the PDF file to extract text from'
      });
      
      expect(properties?.preserve_formatting).toEqual({
        type: 'boolean',
        description: 'Whether to preserve text formatting and structure',
        default: true
      });
      
      expect(properties?.include_metadata).toEqual({
        type: 'boolean',
        description: 'Whether to include document metadata in the response',
        default: false
      });
    });
  });

  describe('Handler Function', () => {
    const mockProcessorResult = {
      text: 'Sample PDF text content',
      pageCount: 3,
      processingTimeMs: 150,
      metadata: {
        title: 'Test Document',
        author: 'Test Author',
        page_count: 3,
        pdf_version: '1.4',
        file_size_bytes: 1024
      }
    };

    it('should extract text successfully with minimal parameters', async () => {
      mockPDFProcessor.extractText.mockResolvedValue(mockProcessorResult);

      const args = { file_path: TestFixtures.SAMPLE_PDF() };
      const result = await handleExtractText(args);

      expect(PDFProcessor).toHaveBeenCalled();
      expect(mockPDFProcessor.extractText).toHaveBeenCalledWith(
        TestFixtures.SAMPLE_PDF(),
        true // default preserve_formatting
      );
      
      expect(result).toEqual({
        text: 'Sample PDF text content',
        page_count: 3,
        processing_time_ms: 150
        // metadata should not be included by default
      });
    });

    it('should include metadata when requested', async () => {
      mockPDFProcessor.extractText.mockResolvedValue(mockProcessorResult);

      const args = {
        file_path: TestFixtures.SAMPLE_PDF(),
        include_metadata: true
      };
      
      const result = await handleExtractText(args);
      
      expect(result.metadata).toEqual(mockProcessorResult.metadata);
    });

    it('should pass formatting preferences correctly', async () => {
      mockPDFProcessor.extractText.mockResolvedValue(mockProcessorResult);

      const args = {
        file_path: TestFixtures.SAMPLE_PDF(),
        preserve_formatting: false
      };
      
      await handleExtractText(args);
      
      expect(mockPDFProcessor.extractText).toHaveBeenCalledWith(
        TestFixtures.SAMPLE_PDF(),
        false
      );
    });

    it('should validate input parameters using Zod schema', async () => {
      const invalidArgs = { file_path: 123 }; // wrong type
      
      await expect(handleExtractText(invalidArgs)).rejects.toThrow();
    });

    it('should handle processing errors with MCP error format', async () => {
      const processingError = new Error('PDF processing failed');
      mockPDFProcessor.extractText.mockRejectedValue(processingError);

      const args = { file_path: TestFixtures.SAMPLE_PDF() };
      
      await expect(handleExtractText(args)).rejects.toThrow();
    });

    it('should handle validation errors appropriately', async () => {
      const validationError = new ValidationError('Invalid file path', 'INVALID_PATH');
      mockPDFProcessor.extractText.mockRejectedValue(validationError);

      const args = { file_path: TestFixtures.INVALID_PDF() };
      
      await expect(handleExtractText(args)).rejects.toThrow();
    });
  });

  describe('Parameter Validation', () => {
    it('should accept valid page range formats', () => {
      const validParams = [
        { file_path: TestFixtures.VALID_PDF(), pages: 'all' },
        { file_path: TestFixtures.VALID_PDF(), pages: '1-5' },
        { file_path: TestFixtures.VALID_PDF(), pages: '1,3,5' },
        { file_path: TestFixtures.VALID_PDF(), pages: '1-2,4,6-8' }
      ];

      validParams.forEach(params => {
        expect(() => ExtractTextParamsSchema.parse(params)).not.toThrow();
      });
    });

    it('should require file_path parameter', () => {
      const invalidParams = { preserve_formatting: true };
      
      expect(() => ExtractTextParamsSchema.parse(invalidParams)).toThrow();
    });

    it('should apply default values correctly', () => {
      const minimalParams = { file_path: TestFixtures.VALID_PDF() };
      const parsed = ExtractTextParamsSchema.parse(minimalParams);
      
      expect(parsed.preserve_formatting).toBe(true);
      expect(parsed.include_metadata).toBe(false);
      expect(parsed.pages).toBe('all');
    });
  });
});