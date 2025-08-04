import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { extractMetadataTool, handleExtractMetadata } from './extract-metadata.js';
import { MetadataParser } from '../services/metadata-parser.js';
import { ExtractMetadataParamsSchema } from '../types/mcp-types.js';
import { ValidationError } from '../utils/validation.js';
import { TestFixtures, getTestFixturePath } from '../utils/test-helpers.js';

// Mock MetadataParser
vi.mock('../services/metadata-parser.js');

describe('Extract Metadata Tool', () => {
  let mockMetadataParser: {
    parseMetadata: Mock;
  };

  beforeEach(() => {
    mockMetadataParser = {
      parseMetadata: vi.fn()
    };
    (MetadataParser as any).mockImplementation(() => mockMetadataParser);
  });

  describe('Tool Definition', () => {
    it('should have correct MCP tool structure', () => {
      expect(extractMetadataTool.name).toBe('extract_pdf_metadata');
      expect(extractMetadataTool.description).toBe('Extract metadata and document information from PDF files');
      expect(extractMetadataTool.inputSchema).toBeDefined();
      expect(extractMetadataTool.inputSchema.type).toBe('object');
      expect(extractMetadataTool.inputSchema.required).toEqual(['file_path']);
    });

    it('should define correct input schema properties', () => {
      const { properties } = extractMetadataTool.inputSchema;
      
      expect(properties?.file_path).toEqual({
        type: 'string',
        description: 'Path to the PDF file to extract metadata from'
      });
    });

    it('should follow MCP tool interface standards', () => {
      // Verify the tool follows MCP specification
      expect(extractMetadataTool).toHaveProperty('name');
      expect(extractMetadataTool).toHaveProperty('description');
      expect(extractMetadataTool).toHaveProperty('inputSchema');
      
      // Verify input schema follows JSON Schema specification
      expect(extractMetadataTool.inputSchema.type).toBe('object');
      expect(extractMetadataTool.inputSchema).toHaveProperty('properties');
      expect(extractMetadataTool.inputSchema).toHaveProperty('required');
    });
  });

  describe('Handler Function', () => {
    const mockMetadata = {
      title: 'Sample Document',
      author: 'John Doe',
      subject: 'Technical Documentation',
      creator: 'Microsoft Word',
      producer: 'Adobe Acrobat',
      creation_date: '2024-01-15T10:30:00.000Z',
      modification_date: '2024-01-16T14:20:00.000Z',
      page_count: 10,
      pdf_version: '1.4',
      file_size_bytes: 1048576
    };

    it('should extract metadata successfully', async () => {
      mockMetadataParser.parseMetadata.mockResolvedValue(mockMetadata);

      const args = { file_path: TestFixtures.SAMPLE_PDF() };
      const result = await handleExtractMetadata(args);

      expect(MetadataParser).toHaveBeenCalled();
      expect(mockMetadataParser.parseMetadata).toHaveBeenCalledWith(TestFixtures.SAMPLE_PDF());
      expect(result).toEqual(mockMetadata);
    });

    it('should validate input parameters using Zod schema', async () => {
      const invalidArgs = { file_path: null };
      
      await expect(handleExtractMetadata(invalidArgs)).rejects.toThrow();
    });

    it('should handle missing file_path parameter', async () => {
      const invalidArgs = {};
      
      await expect(handleExtractMetadata(invalidArgs)).rejects.toThrow();
    });

    it('should handle processing errors with MCP error format', async () => {
      const processingError = new Error('Metadata extraction failed');
      mockMetadataParser.parseMetadata.mockRejectedValue(processingError);

      const args = { file_path: TestFixtures.SAMPLE_PDF() };
      
      try {
        await handleExtractMetadata(args);
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

    it('should handle validation errors appropriately', async () => {
      const validationError = new ValidationError('Invalid file format', 'INVALID_FORMAT');
      mockMetadataParser.parseMetadata.mockRejectedValue(validationError);

      const args = { file_path: 'src/test-fixtures/invalid.txt' };
      
      await expect(handleExtractMetadata(args)).rejects.toThrow();
    });

    it('should handle file not found errors', async () => {
      const fileError = new Error('ENOENT: no such file or directory');
      mockMetadataParser.parseMetadata.mockRejectedValue(fileError);

      const args = { file_path: getTestFixturePath('src/test-fixtures/nonexistent.pdf') };
      
      await expect(handleExtractMetadata(args)).rejects.toThrow();
    });
  });

  describe('Parameter Validation', () => {
    it('should accept valid file paths', () => {
      const validParams = [
        { file_path: '/absolute/path/document.pdf' },
        { file_path: 'C:\\Windows\\path\\document.pdf' },
        { file_path: './relative/path/document.pdf' },
        { file_path: 'simple-filename.pdf' }
      ];

      validParams.forEach(params => {
        expect(() => ExtractMetadataParamsSchema.parse(params)).not.toThrow();
      });
    });

    it('should reject invalid parameter types', () => {
      const invalidParams = [
        { file_path: 123 },
        { file_path: true },
        { file_path: [] },
        { file_path: {} }
      ];

      invalidParams.forEach(params => {
        expect(() => ExtractMetadataParamsSchema.parse(params)).toThrow();
      });
    });

    it('should reject empty file paths', () => {
      const invalidParams = { file_path: '' };
      
      expect(() => ExtractMetadataParamsSchema.parse(invalidParams)).toThrow();
    });
  });

  describe('Integration with MCP Standards', () => {
    it('should follow MCP error handling standards', async () => {
      const testError = new Error('Test error');
      mockMetadataParser.parseMetadata.mockRejectedValue(testError);

      const args = { file_path: TestFixtures.SAMPLE_PDF() };
      
      try {
        await handleExtractMetadata(args);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const errorData = JSON.parse((error as Error).message);
        
        // Verify MCP error structure
        expect(errorData).toHaveProperty('code');
        expect(errorData).toHaveProperty('message');
        expect(errorData).toHaveProperty('data');
        expect(errorData.data).toHaveProperty('error_type');
      }
    });

    it('should handle unknown argument types gracefully', async () => {
      const args = 'invalid string argument';
      
      await expect(handleExtractMetadata(args)).rejects.toThrow();
    });
  });
});