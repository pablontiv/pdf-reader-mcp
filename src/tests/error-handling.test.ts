import { describe, it, expect } from 'vitest';
import { handleError, createMCPError, ProcessingTimeoutError, withTimeout } from '../utils/error-handling.js';
import { ValidationError } from '../utils/validation.js';

describe('Error Handling', () => {
  describe('createMCPError', () => {
    it('should create proper MCP error structure', () => {
      const error = createMCPError(-32603, 'Test error', 'TEST_ERROR', '/path/to/file', 'Additional details');
      
      expect(error).toEqual({
        code: -32603,
        message: 'Test error',
        data: {
          error_type: 'TEST_ERROR',
          file_path: '/path/to/file',
          details: 'Additional details'
        }
      });
    });
  });

  describe('handleError', () => {
    it('should handle ValidationError correctly', () => {
      const validationError = new ValidationError('Invalid file', 'INVALID_FILE');
      const result = handleError(validationError, '/test/path');
      
      expect(result.code).toBe(-32603);
      expect(result.message).toBe('Invalid file');
      expect(result.data?.error_type).toBe('VALIDATION_ERROR');
      expect(result.data?.file_path).toBe('/test/path');
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error');
      const result = handleError(error);
      
      expect(result.code).toBe(-32603);
      expect(result.message).toBe('Generic error');
      expect(result.data?.error_type).toBe('PROCESSING_ERROR');
    });

    it('should handle unknown error', () => {
      const result = handleError('unknown');
      
      expect(result.code).toBe(-32603);
      expect(result.message).toBe('Unknown error occurred');
      expect(result.data?.error_type).toBe('UNKNOWN_ERROR');
    });
  });

  describe('withTimeout', () => {
    it('should resolve promise within timeout', async () => {
      const fastPromise = Promise.resolve('success');
      const result = await withTimeout(fastPromise, 1000);
      expect(result).toBe('success');
    });

    it('should reject with timeout error', async () => {
      const slowPromise = new Promise(resolve => setTimeout(resolve, 1000));
      await expect(withTimeout(slowPromise, 100)).rejects.toThrow(ProcessingTimeoutError);
    });
  });
});