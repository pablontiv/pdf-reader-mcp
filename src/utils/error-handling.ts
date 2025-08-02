import { MCPError } from '../types/pdf-types.js';
import { ValidationError } from './validation.js';

export function createMCPError(
  code: number,
  message: string,
  errorType: string,
  filePath?: string,
  details?: string
): MCPError {
  return {
    code,
    message,
    data: {
      error_type: errorType,
      file_path: filePath,
      details
    }
  };
}

export function handleError(error: unknown, filePath?: string): MCPError {
  if (error instanceof ValidationError) {
    switch (error.code) {
      case 'INVALID_PATH':
      case 'SECURITY_VIOLATION':
        return createMCPError(-32602, error.message, 'VALIDATION_ERROR', filePath);
      case 'FILE_NOT_FOUND':
        return createMCPError(-32603, error.message, 'FILE_ERROR', filePath);
      case 'FILE_TOO_LARGE':
        return createMCPError(-32604, error.message, 'SIZE_ERROR', filePath);
      case 'INVALID_PDF':
        return createMCPError(-32605, error.message, 'FORMAT_ERROR', filePath);
      default:
        return createMCPError(-32603, error.message, 'VALIDATION_ERROR', filePath);
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('ENOENT')) {
      return createMCPError(-32603, 'File not found', 'FILE_ERROR', filePath);
    }
    if (error.message.includes('EACCES')) {
      return createMCPError(-32603, 'Permission denied', 'PERMISSION_ERROR', filePath);
    }
    if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
      return createMCPError(-32604, 'Too many open files', 'RESOURCE_ERROR', filePath);
    }
    
    return createMCPError(-32603, error.message, 'PROCESSING_ERROR', filePath, error.stack);
  }

  return createMCPError(-32603, 'Unknown error occurred', 'UNKNOWN_ERROR', filePath);
}

export class ProcessingTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Processing timeout after ${timeout}ms`);
    this.name = 'ProcessingTimeoutError';
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ProcessingTimeoutError(timeoutMs)), timeoutMs);
    })
  ]);
}