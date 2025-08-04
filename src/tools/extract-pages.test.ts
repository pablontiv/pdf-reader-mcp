import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { extractPagesTool, handleExtractPages } from './extract-pages.js';
import { TextExtractor } from '../services/text-extractor.js';
import { ExtractPagesParamsSchema } from '../types/mcp-types.js';
import { ValidationError } from '../utils/validation.js';
import { TestFixtures } from '../utils/test-helpers.js';

// Mock TextExtractor
vi.mock('../services/text-extractor.js');

describe('Extract Pages Tool', () => {
  let mockTextExtractor: {
    extractFromPages: Mock;
  };

  beforeEach(() => {
    mockTextExtractor = {
      extractFromPages: vi.fn()
    };
    (TextExtractor as any).mockImplementation(() => mockTextExtractor);
  });

  describe('Tool Definition', () => {
    it('should have correct MCP tool structure', () => {
      expect(extractPagesTool.name).toBe('extract_pdf_pages');
      expect(extractPagesTool.description).toBe('Extract content from specific pages or page ranges of PDF documents');
      expect(extractPagesTool.inputSchema).toBeDefined();
      expect(extractPagesTool.inputSchema.type).toBe('object');
      expect(extractPagesTool.inputSchema.required).toEqual(['file_path', 'page_range']);
    });

    it('should define correct input schema properties', () => {
      const { properties } = extractPagesTool.inputSchema;
      
      expect(properties?.file_path).toEqual({
        type: 'string',
        description: 'Path to the PDF file to extract pages from'
      });
      
      expect(properties?.page_range).toEqual({
        type: 'string',
        description: 'Page range to extract (e.g., "1-3", "2,4,6", or "all")'
      });
      
      expect(properties?.output_format).toEqual({
        type: 'string',
        description: 'Output format: "text" for plain text, "structured" for formatted text',
        enum: ['text', 'structured'],
        default: 'text'
      });
    });

    it('should follow MCP tool interface standards', () => {
      expect(extractPagesTool).toHaveProperty('name');
      expect(extractPagesTool).toHaveProperty('description');
      expect(extractPagesTool).toHaveProperty('inputSchema');
      
      // Verify JSON Schema compliance
      expect(extractPagesTool.inputSchema.type).toBe('object');
      expect(extractPagesTool.inputSchema).toHaveProperty('properties');
      expect(extractPagesTool.inputSchema).toHaveProperty('required');
    });
  });

  describe('Handler Function', () => {
    const mockPagesResult = {
      pages: [
        {
          page_number: 1,
          content: 'First page content here...',
          word_count: 245
        },
        {
          page_number: 2,
          content: 'Second page content here...',
          word_count: 312
        }
      ],
      total_pages_extracted: 2
    };

    it('should extract pages successfully with required parameters', async () => {
      mockTextExtractor.extractFromPages.mockResolvedValue(mockPagesResult);

      const args = {
        file_path: TestFixtures.SAMPLE_PDF(),
        page_range: '1-2'
      };
      
      const result = await handleExtractPages(args);

      expect(TextExtractor).toHaveBeenCalled();
      expect(mockTextExtractor.extractFromPages).toHaveBeenCalledWith(
        TestFixtures.SAMPLE_PDF(),
        '1-2',
        'text' // default output_format
      );
      
      expect(result).toEqual(mockPagesResult);
    });

    it('should handle structured output format', async () => {
      mockTextExtractor.extractFromPages.mockResolvedValue(mockPagesResult);

      const args = {
        file_path: TestFixtures.SAMPLE_PDF(),
        page_range: '1,3,5',
        output_format: 'structured' as const
      };
      
      await handleExtractPages(args);
      
      expect(mockTextExtractor.extractFromPages).toHaveBeenCalledWith(
        TestFixtures.SAMPLE_PDF(),
        '1,3,5',
        'structured'
      );
    });

    it('should handle "all" page range', async () => {
      mockTextExtractor.extractFromPages.mockResolvedValue({
        ...mockPagesResult,
        total_pages_extracted: 10
      });

      const args = {
        file_path: TestFixtures.SAMPLE_PDF(),
        page_range: 'all'
      };
      
      const result = await handleExtractPages(args);
      
      expect(mockTextExtractor.extractFromPages).toHaveBeenCalledWith(
        TestFixtures.SAMPLE_PDF(),
        'all',
        'text'
      );
      
      expect(result.total_pages_extracted).toBe(10);
    });

    it('should validate input parameters using Zod schema', async () => {
      const invalidArgs = {
        file_path: TestFixtures.SAMPLE_PDF(),
        page_range: 123 // wrong type
      };
      
      await expect(handleExtractPages(invalidArgs)).rejects.toThrow();
    });

    it('should require both file_path and page_range', async () => {
      const missingPageRange = { file_path: TestFixtures.SAMPLE_PDF() };
      const missingFilePath = { page_range: '1-3' };
      
      await expect(handleExtractPages(missingPageRange)).rejects.toThrow();
      await expect(handleExtractPages(missingFilePath)).rejects.toThrow();
    });

    it('should handle processing errors with MCP error format', async () => {
      const processingError = new Error('Page extraction failed');
      mockTextExtractor.extractFromPages.mockRejectedValue(processingError);

      const args = {
        file_path: TestFixtures.SAMPLE_PDF(),
        page_range: '1-3'
      };
      
      try {
        await handleExtractPages(args);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        
        // Verify MCP error format
        const errorData = JSON.parse((error as Error).message);
        expect(errorData).toHaveProperty('code');
        expect(errorData).toHaveProperty('message');
        expect(errorData).toHaveProperty('data');
      }
    });

    it('should handle validation errors for invalid page ranges', async () => {
      const validationError = new ValidationError('Invalid page range', 'INVALID_PAGE_RANGE');
      mockTextExtractor.extractFromPages.mockRejectedValue(validationError);

      const args = {
        file_path: TestFixtures.SAMPLE_PDF(),
        page_range: '0-5' // invalid range
      };
      
      await expect(handleExtractPages(args)).rejects.toThrow();
    });
  });

  describe('Parameter Validation', () => {
    it('should accept valid page range formats', () => {
      const validParams = [
        { file_path: '/test.pdf', page_range: 'all' },
        { file_path: '/test.pdf', page_range: '1' },
        { file_path: '/test.pdf', page_range: '1-5' },
        { file_path: '/test.pdf', page_range: '1,3,5' },
        { file_path: '/test.pdf', page_range: '1-2,4,6-8' }
      ];

      validParams.forEach(params => {
        expect(() => ExtractPagesParamsSchema.parse(params)).not.toThrow();
      });
    });

    it('should accept valid output formats', () => {
      const validParams = [
        { file_path: '/test.pdf', page_range: '1-3', output_format: 'text' },
        { file_path: '/test.pdf', page_range: '1-3', output_format: 'structured' }
      ];

      validParams.forEach(params => {
        expect(() => ExtractPagesParamsSchema.parse(params)).not.toThrow();
      });
    });

    it('should reject invalid output formats', () => {
      const invalidParams = {
        file_path: '/test.pdf',
        page_range: '1-3',
        output_format: 'invalid'
      };
      
      expect(() => ExtractPagesParamsSchema.parse(invalidParams)).toThrow();
    });

    it('should apply default values correctly', () => {
      const minimalParams = {
        file_path: '/test.pdf',
        page_range: '1-3'
      };
      
      const parsed = ExtractPagesParamsSchema.parse(minimalParams);
      expect(parsed.output_format).toBe('text');
    });

    it('should reject empty required fields', () => {
      const invalidParams = [
        { file_path: '', page_range: '1-3' },
        { file_path: '/test.pdf', page_range: '' },
        { file_path: '', page_range: '' }
      ];

      invalidParams.forEach(params => {
        expect(() => ExtractPagesParamsSchema.parse(params)).toThrow();
      });
    });
  });

  describe('Integration with MCP Standards', () => {
    it('should handle complex page extraction scenarios', async () => {
      const complexResult = {
        pages: [
          { page_number: 1, content: 'Page 1', word_count: 100 },
          { page_number: 5, content: 'Page 5', word_count: 150 },
          { page_number: 7, content: 'Page 7', word_count: 200 },
          { page_number: 8, content: 'Page 8', word_count: 175 }
        ],
        total_pages_extracted: 4
      };
      
      mockTextExtractor.extractFromPages.mockResolvedValue(complexResult);

      const args = {
        file_path: TestFixtures.COMPLEX_PDF(),
        page_range: '1,5,7-8',
        output_format: 'structured' as const
      };
      
      const result = await handleExtractPages(args);
      
      expect(result.pages).toHaveLength(4);
      expect(result.total_pages_extracted).toBe(4);
      expect(result.pages[0].page_number).toBe(1);
      expect(result.pages[1].page_number).toBe(5);
    });

    it('should preserve MCP error context in file path', async () => {
      const testError = new Error('Test error');
      mockTextExtractor.extractFromPages.mockRejectedValue(testError);

      const args = {
        file_path: TestFixtures.SAMPLE_PDF(),
        page_range: '1-3'
      };
      
      try {
        await handleExtractPages(args);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const errorData = JSON.parse((error as Error).message);
        expect(errorData.data.file_path).toBe(TestFixtures.SAMPLE_PDF());
      }
    });
  });
});