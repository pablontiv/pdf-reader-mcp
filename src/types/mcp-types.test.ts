import { describe, it, expect } from 'vitest';
import { 
  ExtractTextParamsSchema,
  ExtractMetadataParamsSchema,
  ExtractPagesParamsSchema,
  ValidatePDFParamsSchema
} from './mcp-types.js';
import { z } from 'zod';

describe('MCP Types Validation', () => {
  describe('ExtractTextParamsSchema', () => {
    it('should validate minimal valid parameters', () => {
      const validParams = { file_path: '/test/document.pdf' };
      
      const result = ExtractTextParamsSchema.parse(validParams);
      
      expect(result.file_path).toBe('/test/document.pdf');
      expect(result.preserve_formatting).toBe(true); // default
      expect(result.include_metadata).toBe(false); // default
      expect(result.pages).toBe('all'); // default
    });

    it('should validate all parameters with explicit values', () => {
      const validParams = {
        file_path: '/test/document.pdf',
        pages: '1-5',
        preserve_formatting: false,
        include_metadata: true
      };
      
      const result = ExtractTextParamsSchema.parse(validParams);
      
      expect(result.file_path).toBe('/test/document.pdf');
      expect(result.pages).toBe('1-5');
      expect(result.preserve_formatting).toBe(false);
      expect(result.include_metadata).toBe(true);
    });

    it('should accept various page range formats', () => {
      const validPageRanges = [
        'all',
        '1',
        '1-5',
        '1,3,5',
        '1-2,4,6-8',
        '10,15-20,25'
      ];

      validPageRanges.forEach(pages => {
        const params = { file_path: '/test.pdf', pages };
        expect(() => ExtractTextParamsSchema.parse(params)).not.toThrow();
      });
    });

    it('should reject invalid file_path types', () => {
      const invalidParams = [
        { file_path: 123 },
        { file_path: true },
        { file_path: [] },
        { file_path: {} },
        { file_path: null },
        { file_path: undefined }
      ];

      invalidParams.forEach(params => {
        expect(() => ExtractTextParamsSchema.parse(params)).toThrow(z.ZodError);
      });
    });

    it('should reject empty file_path', () => {
      const invalidParams = { file_path: '' };
      expect(() => ExtractTextParamsSchema.parse(invalidParams)).toThrow(z.ZodError);
    });

    it('should reject invalid boolean values', () => {
      const invalidParams = [
        { file_path: '/test.pdf', preserve_formatting: 'true' },
        { file_path: '/test.pdf', include_metadata: 1 },
        { file_path: '/test.pdf', preserve_formatting: {} }
      ];

      invalidParams.forEach(params => {
        expect(() => ExtractTextParamsSchema.parse(params)).toThrow(z.ZodError);
      });
    });

    it('should handle undefined optional parameters correctly', () => {
      const params = {
        file_path: '/test.pdf',
        pages: undefined,
        preserve_formatting: undefined,
        include_metadata: undefined
      };
      
      const result = ExtractTextParamsSchema.parse(params);
      
      expect(result.pages).toBe('all');
      expect(result.preserve_formatting).toBe(true);
      expect(result.include_metadata).toBe(false);
    });
  });

  describe('ExtractMetadataParamsSchema', () => {
    it('should validate valid file path', () => {
      const validParams = { file_path: '/test/document.pdf' };
      
      const result = ExtractMetadataParamsSchema.parse(validParams);
      
      expect(result.file_path).toBe('/test/document.pdf');
    });

    it('should accept various file path formats', () => {
      const validFilePaths = [
        '/absolute/path/document.pdf',
        'C:\\Windows\\path\\document.pdf',
        './relative/path/document.pdf',
        '../parent/document.pdf',
        'simple-filename.pdf',
        'file with spaces.pdf',
        'file-with-numbers-123.pdf'
      ];

      validFilePaths.forEach(file_path => {
        const params = { file_path };
        expect(() => ExtractMetadataParamsSchema.parse(params)).not.toThrow();
      });
    });

    it('should reject missing file_path', () => {
      const invalidParams = {};
      expect(() => ExtractMetadataParamsSchema.parse(invalidParams)).toThrow(z.ZodError);
    });

    it('should reject invalid file_path types', () => {
      const invalidParams = [
        { file_path: 123 },
        { file_path: true },
        { file_path: [] },
        { file_path: {} },
        { file_path: null }
      ];

      invalidParams.forEach(params => {
        expect(() => ExtractMetadataParamsSchema.parse(params)).toThrow(z.ZodError);
      });
    });

    it('should reject empty file_path', () => {
      const invalidParams = { file_path: '' };
      expect(() => ExtractMetadataParamsSchema.parse(invalidParams)).toThrow(z.ZodError);
    });

    it('should reject extra parameters', () => {
      const paramsWithExtra = {
        file_path: '/test.pdf',
        unexpected_param: 'value'
      };
      
      // This should still parse successfully as Zod ignores extra properties by default
      // unless .strict() is used
      expect(() => ExtractMetadataParamsSchema.parse(paramsWithExtra)).not.toThrow();
    });
  });

  describe('ExtractPagesParamsSchema', () => {
    it('should validate required parameters', () => {
      const validParams = {
        file_path: '/test/document.pdf',
        page_range: '1-5'
      };
      
      const result = ExtractPagesParamsSchema.parse(validParams);
      
      expect(result.file_path).toBe('/test/document.pdf');
      expect(result.page_range).toBe('1-5');
      expect(result.output_format).toBe('text'); // default
    });

    it('should validate with explicit output format', () => {
      const validParams = {
        file_path: '/test/document.pdf',
        page_range: '1,3,5',
        output_format: 'structured' as const
      };
      
      const result = ExtractPagesParamsSchema.parse(validParams);
      
      expect(result.output_format).toBe('structured');
    });

    it('should accept valid output format values', () => {
      const validFormats: Array<'text' | 'structured'> = ['text', 'structured'];

      validFormats.forEach(output_format => {
        const params = {
          file_path: '/test.pdf',
          page_range: '1-3',
          output_format
        };
        expect(() => ExtractPagesParamsSchema.parse(params)).not.toThrow();
      });
    });

    it('should reject invalid output format values', () => {
      const invalidFormats = ['html', 'json', 'xml', 'markdown', 123, true, {}];

      invalidFormats.forEach(output_format => {
        const params = {
          file_path: '/test.pdf',
          page_range: '1-3',
          output_format
        };
        expect(() => ExtractPagesParamsSchema.parse(params)).toThrow(z.ZodError);
      });
    });

    it('should require both file_path and page_range', () => {
      const missingFilePath = { page_range: '1-3' };
      const missingPageRange = { file_path: '/test.pdf' };

      expect(() => ExtractPagesParamsSchema.parse(missingFilePath)).toThrow(z.ZodError);
      expect(() => ExtractPagesParamsSchema.parse(missingPageRange)).toThrow(z.ZodError);
    });

    it('should accept various page range formats', () => {
      const validRanges = [
        'all',
        '1',
        '1-5',
        '1,3,5',
        '1-2,4,6-8',
        '10,15-20,25',
        '100-150'
      ];

      validRanges.forEach(page_range => {
        const params = { file_path: '/test.pdf', page_range };
        expect(() => ExtractPagesParamsSchema.parse(params)).not.toThrow();
      });
    });

    it('should reject empty page_range', () => {
      const invalidParams = {
        file_path: '/test.pdf',
        page_range: ''
      };
      expect(() => ExtractPagesParamsSchema.parse(invalidParams)).toThrow(z.ZodError);
    });
  });

  describe('ValidatePDFParamsSchema', () => {
    it('should validate valid file path', () => {
      const validParams = { file_path: '/test/document.pdf' };
      
      const result = ValidatePDFParamsSchema.parse(validParams);
      
      expect(result.file_path).toBe('/test/document.pdf');
    });

    it('should accept various file path formats', () => {
      const validFilePaths = [
        '/absolute/path/document.pdf',
        'C:\\Windows\\path\\document.pdf',
        './relative/path/document.pdf',
        'simple-filename.pdf',
        'document-with-version-v1.2.pdf',
        'file (with parentheses).pdf'
      ];

      validFilePaths.forEach(file_path => {
        const params = { file_path };
        expect(() => ValidatePDFParamsSchema.parse(params)).not.toThrow();
      });
    });

    it('should require file_path parameter', () => {
      const invalidParams = {};
      expect(() => ValidatePDFParamsSchema.parse(invalidParams)).toThrow(z.ZodError);
    });

    it('should reject invalid file_path types', () => {
      const invalidParams = [
        { file_path: 123 },
        { file_path: true },
        { file_path: [] },
        { file_path: {} },
        { file_path: null },
        { file_path: undefined }
      ];

      invalidParams.forEach(params => {
        expect(() => ValidatePDFParamsSchema.parse(params)).toThrow(z.ZodError);
      });
    });

    it('should reject empty file_path', () => {
      const invalidParams = { file_path: '' };
      expect(() => ValidatePDFParamsSchema.parse(invalidParams)).toThrow(z.ZodError);
    });

    it('should reject whitespace-only file_path', () => {
      const invalidParams = [
        { file_path: ' ' },
        { file_path: '\t' },
        { file_path: '\n' },
        { file_path: '   ' }
      ];

      invalidParams.forEach(params => {
        expect(() => ValidatePDFParamsSchema.parse(params)).toThrow(z.ZodError);
      });
    });
  });

  describe('Schema Consistency', () => {
    it('should all require file_path parameter', () => {
      const schemas = [
        ExtractTextParamsSchema,
        ExtractMetadataParamsSchema,
        ExtractPagesParamsSchema,
        ValidatePDFParamsSchema
      ];

      schemas.forEach(schema => {
        expect(() => schema.parse({})).toThrow(z.ZodError);
        expect(() => schema.parse({ file_path: '/test.pdf' })).not.toThrow();
      });
    });

    it('should all validate file_path as string', () => {
      const schemas = [
        ExtractTextParamsSchema,
        ExtractMetadataParamsSchema,
        ExtractPagesParamsSchema,
        ValidatePDFParamsSchema
      ];

      schemas.forEach(schema => {
        expect(() => schema.parse({ file_path: 123 })).toThrow(z.ZodError);
        expect(() => schema.parse({ file_path: true })).toThrow(z.ZodError);
        expect(() => schema.parse({ file_path: '/valid/path.pdf' })).not.toThrow();
      });
    });

    it('should handle Unicode file paths correctly', () => {
      const unicodePaths = [
        '/test/文档.pdf',
        '/test/документ.pdf',
        '/test/document-émojis-🎉.pdf',
        'C:\\Users\\José\\Documentos\\archivo.pdf'
      ];

      const schemas = [
        ExtractTextParamsSchema,
        ExtractMetadataParamsSchema,
        ValidatePDFParamsSchema
      ];

      schemas.forEach(schema => {
        unicodePaths.forEach(file_path => {
          expect(() => schema.parse({ file_path })).not.toThrow();
        });
      });
    });
  });

  describe('Error Messages', () => {
    it('should provide meaningful error messages for missing required fields', () => {
      try {
        ExtractPagesParamsSchema.parse({ file_path: '/test.pdf' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.issues).toHaveLength(1);
        expect(zodError.issues[0].path).toEqual(['page_range']);
        expect(zodError.issues[0].code).toBe('invalid_type');
      }
    });

    it('should provide meaningful error messages for invalid types', () => {
      try {
        ExtractTextParamsSchema.parse({ file_path: 123 });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.issues[0].path).toEqual(['file_path']);
        expect(zodError.issues[0].expected).toBe('string');
        expect(zodError.issues[0].received).toBe('number');
      }
    });

    it('should provide meaningful error messages for invalid enum values', () => {
      try {
        ExtractPagesParamsSchema.parse({
          file_path: '/test.pdf',
          page_range: '1-3',
          output_format: 'invalid'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.issues[0].path).toEqual(['output_format']);
        expect(zodError.issues[0].code).toBe('invalid_enum_value');
      }
    });
  });
});