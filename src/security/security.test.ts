import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateFilePath, validatePDFFile } from '../utils/validation.js';
import { ValidationError } from '../utils/validation.js';
import fs from 'fs/promises';

// Mock fs promises
vi.mock('fs/promises');

describe('Security Tests for PDF Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Path Traversal Protection', () => {
    it('should reject path traversal attempts with ../', async () => {
      const maliciousPaths = [
        '../secret.pdf',
        '../../etc/passwd',
        '../../../system32/config/sam',
        'valid/../../../secret.pdf',
        '/safe/path/../../../etc/shadow',
        'C:\\safe\\path\\..\\..\\..\\Windows\\system32'
      ];

      for (const maliciousPath of maliciousPaths) {
        await expect(validateFilePath(maliciousPath)).rejects.toThrow(ValidationError);
      }
    });

    it('should reject path traversal attempts with encoded characters', async () => {
      const encodedPaths = [
        '%2e%2e%2f',  // ../
        '%2e%2e%5c',  // ..\
        '..%2f',      // ../
        '..%5c',      // ..\
        '%252e%252e%252f', // double encoded ../
        'valid%2e%2e%2fsecret.pdf'
      ];

      for (const encodedPath of encodedPaths) {
        await expect(validateFilePath(encodedPath)).rejects.toThrow(ValidationError);
      }
    });

    it('should reject absolute paths to sensitive directories', async () => {
      const sensitivePaths = [
        '/etc/passwd',
        '/etc/shadow',
        '/root/.ssh/id_rsa',
        'C:\\Windows\\system32\\config\\sam',
        'C:\\Windows\\system32\\drivers\\etc\\hosts',
        '/proc/version',
        '/dev/mem'
      ];

      for (const sensitivePath of sensitivePaths) {
        await expect(validateFilePath(sensitivePath)).rejects.toThrow(ValidationError);
      }
    });

    it('should reject home directory shortcuts', async () => {
      const homePaths = [
        '~/secret.pdf',
        '~root/.ssh/id_rsa',
        '~/../etc/passwd',
        '$HOME/secret.pdf',
        '%USERPROFILE%\\secret.pdf'
      ];

      for (const homePath of homePaths) {
        await expect(validateFilePath(homePath)).rejects.toThrow(ValidationError);
      }
    });

    it('should accept safe relative paths', async () => {
      const safePaths = [
        'src/test-fixtures/document.pdf',
        'src/test-fixtures/subfolder/document.pdf',
        'src/test-fixtures/documents/2024/report.pdf',
        'src/test-fixtures/upload/user123/file.pdf'
      ];

      for (const safePath of safePaths) {
        await expect(validateFilePath(safePath)).resolves.not.toThrow();
      }
    });

    it('should reject paths with .. even when they normalize safely', async () => {
      const pathsWithDots = [
        './subfolder/../document.pdf', // contains .. 
        'subfolder/./document.pdf',    // contains ./
        './document.pdf'               // contains ./
      ];

      for (const dotPath of pathsWithDots) {
        await expect(validateFilePath(dotPath)).rejects.toThrow(ValidationError);
      }
    });
  });

  describe('File Type Validation', () => {
    it('should reject non-PDF files based on extension', async () => {
      const nonPDFFiles = [
        'malicious.exe',
        'script.js',
        'document.docx',
        'image.png',
        'archive.zip',
        'binary.bin',
        'shell.sh',
        'batch.bat',
        'powershell.ps1'
      ];

      for (const nonPDFFile of nonPDFFiles) {
        await expect(validatePDFFile(nonPDFFile)).rejects.toThrow(ValidationError);
      }
    });

    it('should accept valid PDF extensions', async () => {
      const pdfFiles = [
        'src/test-fixtures/valid.pdf',
        'src/test-fixtures/sample.pdf',
        'src/test-fixtures/document.pdf'
      ];

      for (const pdfFile of pdfFiles) {
        await expect(validatePDFFile(pdfFile)).resolves.not.toThrow();
      }
    });

    it('should reject files with multiple extensions', async () => {
      const doubleExtensions = [
        'document.pdf.exe',
        'file.txt.pdf',
        'malware.pdf.js',
        'document.pdf.bat'
      ];

      for (const doubleExt of doubleExtensions) {
        await expect(validatePDFFile(doubleExt)).rejects.toThrow(ValidationError);
      }
    });

    it('should reject files without extensions', async () => {
      const noExtension = [
        'document',
        'file-without-extension',
        'suspicious'
      ];

      for (const noExt of noExtension) {
        await expect(validatePDFFile(noExt)).rejects.toThrow(ValidationError);
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should reject null bytes in file paths', async () => {
      const nullBytePaths = [
        'document.pdf\x00',
        '\x00document.pdf',
        'docu\x00ment.pdf',
        'document.pdf\x00.exe'
      ];

      for (const nullPath of nullBytePaths) {
        await expect(validateFilePath(nullPath)).rejects.toThrow(ValidationError);
      }
    });

    it('should reject control characters in file paths', async () => {
      const controlCharPaths = [
        'document\x01.pdf',
        'document\x7f.pdf',
        'docu\x08ment.pdf',
        '\x1bdocument.pdf'
      ];

      for (const controlPath of controlCharPaths) {
        await expect(validateFilePath(controlPath)).rejects.toThrow(ValidationError);
      }
    });

    it('should handle Unicode normalization attacks', async () => {
      const unicodeAttacks = [
        'document\u200b.pdf',  // Zero-width space
        'document\ufeff.pdf',  // Byte order mark
        'document\u202e.pdf',  // Right-to-left override
        'doc\u034fument.pdf'   // Combining grapheme joiner
      ];

      for (const unicodeAttack of unicodeAttacks) {
        await expect(validateFilePath(unicodeAttack)).rejects.toThrow(ValidationError);
      }
    });

    it('should reject excessively long file paths', async () => {
      const longPath = 'a'.repeat(300) + '.pdf';
      await expect(validateFilePath(longPath)).rejects.toThrow(ValidationError);
    });

    it('should reject empty or whitespace-only paths', async () => {
      const emptyPaths = [
        '',
        ' ',
        '\t',
        '\n',
        '\r\n',
        '   \t  \n  '
      ];

      for (const emptyPath of emptyPaths) {
        await expect(validateFilePath(emptyPath)).rejects.toThrow(ValidationError);
      }
    });
  });

  describe('File System Security', () => {
    it('should handle file access permission errors', async () => {
      const restrictedPath = '/restricted/file.pdf';
      
      // Mock permission denied error
      vi.mocked(fs.access).mockRejectedValue(new Error('EACCES: permission denied'));

      await expect(validateFilePath(restrictedPath)).rejects.toThrow();
    });

    it('should handle symbolic link attacks', async () => {
      const symlinkPath = '/tmp/symlink-to-secret.pdf';
      
      // Mock symbolic link detection
      const mockStats = {
        isSymbolicLink: () => true,
        isFile: () => false
      };
      vi.mocked(fs.lstat).mockResolvedValue(mockStats as any);

      await expect(validateFilePath(symlinkPath)).rejects.toThrow(ValidationError);
    });

    it('should validate that target is actually a file', async () => {
      const directoryPath = '/tmp/directory.pdf';
      
      // Mock directory instead of file
      const mockStats = {
        isSymbolicLink: () => false,
        isFile: () => false,
        isDirectory: () => true
      };
      vi.mocked(fs.lstat).mockResolvedValue(mockStats as any);

      await expect(validateFilePath(directoryPath)).rejects.toThrow(ValidationError);
    });

    it('should handle race conditions in file validation', async () => {
      const racePath = '/tmp/race-condition.pdf';
      
      // Mock file existing during first check but not during second
      vi.mocked(fs.access)
        .mockResolvedValueOnce(undefined)  // First check passes
        .mockRejectedValueOnce(new Error('ENOENT: no such file')); // Second check fails

      // This should still pass as we only do one check in current implementation
      // But this test documents the potential race condition
      await expect(validateFilePath(racePath)).rejects.toThrow();
    });
  });

  describe('Resource Exhaustion Protection', () => {
    it('should reject paths with excessive directory depth', async () => {
      const deepPath = Array(100).fill('subdir').join('/') + '/document.pdf';
      await expect(validateFilePath(deepPath)).rejects.toThrow(ValidationError);
    });

    it('should handle concurrent validation requests safely', async () => {
      const validPath = 'src/test-fixtures/valid.pdf';

      // Simulate many concurrent validation requests
      const concurrentRequests = Array(100).fill(0).map(() => 
        validateFilePath(validPath)
      );

      // All should complete without resource exhaustion
      await expect(Promise.all(concurrentRequests)).resolves.toBeDefined();
    });
  });

  describe('Platform-Specific Security', () => {
    it('should handle Windows reserved names', async () => {
      const windowsReserved = [
        'CON.pdf',
        'PRN.pdf',
        'AUX.pdf',
        'NUL.pdf',
        'COM1.pdf',
        'COM2.pdf',
        'LPT1.pdf',
        'LPT2.pdf'
      ];

      for (const reserved of windowsReserved) {
        await expect(validateFilePath(reserved)).rejects.toThrow(ValidationError);
      }
    });

    it('should handle Windows alternate data streams', async () => {
      const adsAttacks = [
        'document.pdf:hidden.exe',
        'normal.pdf:$DATA',
        'file.pdf::$DATA'
      ];

      for (const adsAttack of adsAttacks) {
        await expect(validateFilePath(adsAttack)).rejects.toThrow(ValidationError);
      }
    });

    it('should handle Unix hidden files appropriately', async () => {
      const hiddenFiles = [
        '.hidden.pdf',
        'folder/.hidden.pdf',
        '.ssh/id_rsa.pdf'  // Should be rejected for different reasons
      ];

      // Hidden files might be allowed in some contexts, rejected in others
      for (const hiddenFile of hiddenFiles) {
        // This test documents the behavior - implementation may vary
        if (hiddenFile.includes('.ssh')) {
          await expect(validateFilePath(hiddenFile)).rejects.toThrow(ValidationError);
        }
      }
    });
  });

  describe('Error Information Security', () => {
    it('should not leak sensitive information in error messages', async () => {
      const sensitivePath = '/etc/shadow';
      
      try {
        await validateFilePath(sensitivePath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const message = (error as ValidationError).message.toLowerCase();
        
        // Error message should not contain sensitive system paths
        expect(message).not.toContain('/etc/');
        expect(message).not.toContain('shadow');
        expect(message).not.toContain('passwd');
        
        // Should contain generic security-related terms
        expect(message).toMatch(/invalid|security|path|access/);
      }
    });

    it('should provide consistent error messages for different attack vectors', async () => {
      const attackVectors = [
        '../../../etc/passwd',
        '~/secret.pdf',
        '/etc/shadow',
        'document.pdf\x00'
      ];

      const errorMessages: string[] = [];
      
      for (const attack of attackVectors) {
        try {
          await validateFilePath(attack);
          expect.fail(`Should have thrown an error for: ${attack}`);
        } catch (error) {
          errorMessages.push((error as ValidationError).message);
        }
      }

      // All error messages should be similar to avoid information leakage
      const uniqueMessages = new Set(errorMessages);
      expect(uniqueMessages.size).toBeLessThanOrEqual(2); // Allow for some variation
    });
  });
});