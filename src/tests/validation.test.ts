import { describe, it, expect } from 'vitest';
import { validateFilePath, validatePDFFile, parsePageRange, ValidationError } from '../utils/validation.js';

describe('Validation Utils', () => {
  describe('parsePageRange', () => {
    it('should parse "all" to full range', () => {
      const result = parsePageRange('all', 10);
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should parse single page', () => {
      const result = parsePageRange('5', 10);
      expect(result).toEqual([5]);
    });

    it('should parse page range', () => {
      const result = parsePageRange('2-5', 10);
      expect(result).toEqual([2, 3, 4, 5]);
    });

    it('should parse comma-separated pages', () => {
      const result = parsePageRange('1,3,5', 10);
      expect(result).toEqual([1, 3, 5]);
    });

    it('should parse mixed ranges and pages', () => {
      const result = parsePageRange('1-2,5,7-8', 10);
      expect(result).toEqual([1, 2, 5, 7, 8]);
    });

    it('should throw error for invalid page range', () => {
      expect(() => parsePageRange('0-5', 10)).toThrow(ValidationError);
      expect(() => parsePageRange('5-15', 10)).toThrow(ValidationError);
      expect(() => parsePageRange('invalid', 10)).toThrow(ValidationError);
    });

    it('should handle duplicate pages', () => {
      const result = parsePageRange('1,1,2,2', 10);
      expect(result).toEqual([1, 2]);
    });
  });

  describe('validateFilePath', () => {
    it('should throw error for empty path', async () => {
      await expect(validateFilePath('')).rejects.toThrow(ValidationError);
    });

    it('should throw error for path traversal', async () => {
      await expect(validateFilePath('../secret.pdf')).rejects.toThrow(ValidationError);
      await expect(validateFilePath('~/documents/test.pdf')).rejects.toThrow(ValidationError);
    });
  });
});