import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { validatePDFTool, handleValidatePDF } from './validate-pdf.js';
import { PDFProcessor } from '../services/pdf-processor.js';
import { ValidatePDFParamsSchema } from '../types/mcp-types.js';
import { ValidationError } from '../utils/validation.js';

// Mock PDFProcessor
vi.mock('../services/pdf-processor.js');

describe('Validate PDF Tool', () => {
  let mockPDFProcessor: {
    validatePDF: Mock;
  };

  beforeEach(() => {
    mockPDFProcessor = {
      validatePDF: vi.fn()
    };
    (PDFProcessor as any).mockImplementation(() => mockPDFProcessor);
  });

  describe('Tool Definition', () => {
    it('should have correct MCP tool structure', () => {
      expect(validatePDFTool.name).toBe('validate_pdf');
      expect(validatePDFTool.description).toBe('Validate PDF file integrity and readability');
      expect(validatePDFTool.inputSchema).toBeDefined();
      expect(validatePDFTool.inputSchema.type).toBe('object');
      expect(validatePDFTool.inputSchema.required).toEqual(['file_path']);
    });

    it('should define correct input schema properties', () => {
      const { properties } = validatePDFTool.inputSchema;
      
      expect(properties?.file_path).toEqual({
        type: 'string',
        description: 'Path to the PDF file to validate'
      });
    });

    it('should follow MCP tool interface standards', () => {
      expect(validatePDFTool).toHaveProperty('name');
      expect(validatePDFTool).toHaveProperty('description');
      expect(validatePDFTool).toHaveProperty('inputSchema');
      
      // Verify JSON Schema compliance
      expect(validatePDFTool.inputSchema.type).toBe('object');
      expect(validatePDFTool.inputSchema).toHaveProperty('properties');
      expect(validatePDFTool.inputSchema).toHaveProperty('required');
    });
  });

  describe('Handler Function', () => {
    const mockValidationResult = {
      is_valid: true,
      pdf_version: '1.4',
      is_encrypted: false,
      is_readable: true,
      file_size_bytes: 1048576,
      page_count: 10,
      security_restrictions: {
        printing_allowed: true,
        copying_allowed: true,
        modification_allowed: true,
        annotation_allowed: true
      }
    };

    it('should validate PDF successfully', async () => {
      mockPDFProcessor.validatePDF.mockResolvedValue(mockValidationResult);

      const args = { file_path: '/test/sample.pdf' };
      const result = await handleValidatePDF(args);

      expect(PDFProcessor).toHaveBeenCalled();
      expect(mockPDFProcessor.validatePDF).toHaveBeenCalledWith('/test/sample.pdf');
      expect(result).toEqual(mockValidationResult);
    });

    it('should handle encrypted PDF files', async () => {
      const encryptedResult = {
        ...mockValidationResult,
        is_encrypted: true,
        is_readable: false,
        security_restrictions: {
          printing_allowed: false,
          copying_allowed: false,
          modification_allowed: false,
          annotation_allowed: false
        }
      };
      
      mockPDFProcessor.validatePDF.mockResolvedValue(encryptedResult);

      const args = { file_path: '/test/encrypted.pdf' };
      const result = await handleValidatePDF(args);

      expect(result.is_encrypted).toBe(true);
      expect(result.is_readable).toBe(false);
      expect(result.security_restrictions.printing_allowed).toBe(false);
    });

    it('should handle corrupted PDF files', async () => {
      const corruptedResult = {
        is_valid: false,
        pdf_version: 'unknown',
        is_encrypted: false,
        is_readable: false,
        file_size_bytes: 12345,
        page_count: 0,
        errors: ['Invalid PDF header', 'Corrupted xref table']
      };
      
      mockPDFProcessor.validatePDF.mockResolvedValue(corruptedResult);

      const args = { file_path: '/test/corrupted.pdf' };
      const result = await handleValidatePDF(args);

      expect(result.is_valid).toBe(false);
      expect(result.is_readable).toBe(false);
      expect(result.page_count).toBe(0);
      expect(result.errors).toBeDefined();
    });

    it('should validate input parameters using Zod schema', async () => {
      const invalidArgs = { file_path: null };
      
      await expect(handleValidatePDF(invalidArgs)).rejects.toThrow();
    });

    it('should handle missing file_path parameter', async () => {
      const invalidArgs = {};
      
      await expect(handleValidatePDF(invalidArgs)).rejects.toThrow();
    });

    it('should handle processing errors with MCP error format', async () => {
      const processingError = new Error('PDF validation failed');
      mockPDFProcessor.validatePDF.mockRejectedValue(processingError);

      const args = { file_path: '/test/sample.pdf' };
      
      try {
        await handleValidatePDF(args);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        
        // Verify MCP error format
        const errorData = JSON.parse((error as Error).message);
        expect(errorData).toHaveProperty('code');
        expect(errorData).toHaveProperty('message');
        expect(errorData).toHaveProperty('data');
        expect(errorData.data).toHaveProperty('error_type');
      }
    });

    it('should handle file access errors', async () => {
      const fileError = new Error('EACCES: permission denied');
      mockPDFProcessor.validatePDF.mockRejectedValue(fileError);

      const args = { file_path: '/restricted/file.pdf' };
      
      await expect(handleValidatePDF(args)).rejects.toThrow();
    });

    it('should handle validation errors for invalid file types', async () => {
      const validationError = new ValidationError('Not a PDF file', 'INVALID_FILE_TYPE');
      mockPDFProcessor.validatePDF.mockRejectedValue(validationError);

      const args = { file_path: '/test/document.txt' };
      
      await expect(handleValidatePDF(args)).rejects.toThrow();
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
        expect(() => ValidatePDFParamsSchema.parse(params)).not.toThrow();
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
        expect(() => ValidatePDFParamsSchema.parse(params)).toThrow();
      });
    });

    it('should reject empty file paths', () => {
      const invalidParams = { file_path: '' };
      
      expect(() => ValidatePDFParamsSchema.parse(invalidParams)).toThrow();
    });

    it('should handle edge cases', () => {
      const edgeCases = [
        { file_path: ' ' }, // whitespace only
        { file_path: '\t' }, // tab character
        { file_path: '\n' } // newline character
      ];

      edgeCases.forEach(params => {
        expect(() => ValidatePDFParamsSchema.parse(params)).toThrow();
      });
    });
  });

  describe('Security and Safety Tests', () => {
    it('should handle path traversal attempts safely', async () => {
      const maliciousPath = '../../../etc/passwd';
      const validationError = new ValidationError('Path traversal detected', 'SECURITY_VIOLATION');
      mockPDFProcessor.validatePDF.mockRejectedValue(validationError);

      const args = { file_path: maliciousPath };
      
      await expect(handleValidatePDF(args)).rejects.toThrow();
    });

    it('should handle extremely large file size reporting', async () => {
      const largeFileResult = {
        ...mockValidationResult,
        file_size_bytes: Number.MAX_SAFE_INTEGER
      };
      
      mockPDFProcessor.validatePDF.mockResolvedValue(largeFileResult);

      const args = { file_path: '/test/huge.pdf' };
      const result = await handleValidatePDF(args);

      expect(result.file_size_bytes).toBe(Number.MAX_SAFE_INTEGER);
      expect(typeof result.file_size_bytes).toBe('number');
    });

    it('should handle PDF with unusual characteristics', async () => {
      const unusualResult = {
        is_valid: true,
        pdf_version: '2.0',
        is_encrypted: true,
        is_readable: true, // encrypted but readable (password-protected but no password needed)
        file_size_bytes: 0, // empty but valid PDF
        page_count: 0,
        security_restrictions: {
          printing_allowed: true,
          copying_allowed: false,
          modification_allowed: false,
          annotation_allowed: true
        }
      };
      
      mockPDFProcessor.validatePDF.mockResolvedValue(unusualResult);

      const args = { file_path: '/test/unusual.pdf' };
      const result = await handleValidatePDF(args);

      expect(result.is_valid).toBe(true);
      expect(result.page_count).toBe(0);
      expect(result.file_size_bytes).toBe(0);
    });
  });

  describe('Integration with MCP Standards', () => {
    it('should follow MCP error handling standards', async () => {
      const testError = new Error('Test validation error');
      mockPDFProcessor.validatePDF.mockRejectedValue(testError);

      const args = { file_path: '/test/sample.pdf' };
      
      try {
        await handleValidatePDF(args);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const errorData = JSON.parse((error as Error).message);
        
        // Verify MCP error structure
        expect(errorData).toHaveProperty('code');
        expect(errorData).toHaveProperty('message');
        expect(errorData).toHaveProperty('data');
        expect(errorData.data).toHaveProperty('error_type');
        expect(errorData.data.file_path).toBe('/test/sample.pdf');
      }
    });

    it('should handle unknown argument types gracefully', async () => {
      const args = 'invalid string argument';
      
      await expect(handleValidatePDF(args)).rejects.toThrow();
    });

    it('should provide comprehensive validation results', async () => {
      mockPDFProcessor.validatePDF.mockResolvedValue(mockValidationResult);

      const args = { file_path: '/test/comprehensive.pdf' };
      const result = await handleValidatePDF(args);

      // Verify all expected fields are present
      expect(result).toHaveProperty('is_valid');
      expect(result).toHaveProperty('pdf_version');
      expect(result).toHaveProperty('is_encrypted');
      expect(result).toHaveProperty('is_readable');
      expect(result).toHaveProperty('file_size_bytes');
      
      // Verify data types
      expect(typeof result.is_valid).toBe('boolean');
      expect(typeof result.pdf_version).toBe('string');
      expect(typeof result.is_encrypted).toBe('boolean');
      expect(typeof result.is_readable).toBe('boolean');
      expect(typeof result.file_size_bytes).toBe('number');
    });
  });
});