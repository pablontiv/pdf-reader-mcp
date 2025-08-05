import { promises as fs } from 'fs';
import path from 'path';
import { getConfig } from '../config/server-config.js';

export class ValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export async function validateFilePath(filePath: string): Promise<void> {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('File path must be a non-empty string', 'INVALID_PATH');
  }

  // Check for security violations in path
  const hasDirectoryTraversal = filePath.includes('..') || filePath.includes('~');
  // eslint-disable-next-line no-control-regex
  const hasControlChars = /[\x00-\x1f\x7f-\x9f]/.test(filePath);
  const hasNTFSStreams = filePath.includes(':') && process.platform === 'win32' && !path.isAbsolute(filePath);
  
  // Check for Windows reserved names
  const basename = path.basename(filePath, path.extname(filePath));
  const windowsReserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'LPT1', 'LPT2'];
  const hasReservedName = windowsReserved.includes(basename.toUpperCase());
  
  // Check for encoded directory traversal attempts
  let hasEncodedTraversal = false;
  try {
    const decodedPath = decodeURIComponent(filePath);
    hasEncodedTraversal = decodedPath.includes('..') || decodedPath.includes('~');
  } catch (error) {
    hasEncodedTraversal = true; // Invalid URI encoding is suspicious
  }

  // Check for absolute paths to sensitive system directories
  const isSensitiveAbsolutePath = path.isAbsolute(filePath) && (
    filePath.toLowerCase().includes('/etc/') ||
    filePath.toLowerCase().includes('/root/') ||
    filePath.toLowerCase().includes('/proc/') ||
    filePath.toLowerCase().includes('/dev/') ||
    filePath.toLowerCase().includes('c:\\windows\\') ||
    filePath.toLowerCase().includes('/var/log/') ||
    filePath.toLowerCase().includes('/sys/')
  );

  // Throw generic security error for any violation
  if (hasDirectoryTraversal || hasControlChars || hasNTFSStreams || hasReservedName || hasEncodedTraversal || isSensitiveAbsolutePath) {
    throw new ValidationError('Invalid file path', 'SECURITY_VIOLATION');
  }

  const resolvedPath = path.resolve(filePath);
  
  try {
    const stats = await fs.stat(resolvedPath);
    
    if (!stats.isFile()) {
      throw new ValidationError('Path does not point to a file', 'NOT_A_FILE');
    }

    const config = getConfig();
    if (stats.size > config.maxFileSize) {
      throw new ValidationError(
        `File size ${stats.size} exceeds maximum allowed size ${config.maxFileSize}`,
        'FILE_TOO_LARGE'
      );
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('File not found or inaccessible', 'FILE_NOT_FOUND');
  }
}

export async function validatePDFFile(filePath: string): Promise<void> {
  await validateFilePath(filePath);
  
  try {
    const buffer = await fs.readFile(filePath);
    
    if (buffer.length < 4) {
      throw new ValidationError('File is too small to be a valid PDF', 'INVALID_PDF');
    }

    const header = buffer.subarray(0, 4).toString();
    if (header !== '%PDF') {
      throw new ValidationError('File does not appear to be a PDF (invalid magic number)', 'INVALID_PDF');
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Error reading PDF file', 'READ_ERROR');
  }
}

export function parsePageRange(pageRange: string, totalPages: number): number[] {
  if (!pageRange || pageRange.toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: number[] = [];
  const parts = pageRange.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
      
      if (isNaN(start) || isNaN(end) || start < 1 || end < start || end > totalPages) {
        throw new ValidationError(`Invalid page range: ${trimmed}`, 'INVALID_PAGE_RANGE');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    } else {
      const pageNum = parseInt(trimmed);
      
      if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
        throw new ValidationError(`Invalid page number: ${trimmed}`, 'INVALID_PAGE_NUMBER');
      }
      
      pages.push(pageNum);
    }
  }

  return Array.from(new Set(pages)).sort((a, b) => a - b);
}