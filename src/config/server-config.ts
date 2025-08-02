export interface ServerConfig {
  maxFileSize: number;
  processingTimeout: number;
  maxMemoryUsage: number;
  concurrentProcessingLimit: number;
  tempDirectory?: string;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export const defaultConfig: ServerConfig = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  processingTimeout: 60000, // 60 seconds
  maxMemoryUsage: 500 * 1024 * 1024, // 500MB
  concurrentProcessingLimit: 10,
  logLevel: 'info'
};

export const getConfig = (): ServerConfig => {
  return {
    ...defaultConfig,
    maxFileSize: process.env.PDF_MAX_FILE_SIZE ? 
      parseInt(process.env.PDF_MAX_FILE_SIZE) : defaultConfig.maxFileSize,
    processingTimeout: process.env.PDF_PROCESSING_TIMEOUT ?
      parseInt(process.env.PDF_PROCESSING_TIMEOUT) : defaultConfig.processingTimeout,
    maxMemoryUsage: process.env.PDF_MAX_MEMORY_USAGE ?
      parseInt(process.env.PDF_MAX_MEMORY_USAGE) : defaultConfig.maxMemoryUsage,
    logLevel: (process.env.LOG_LEVEL as ServerConfig['logLevel']) || defaultConfig.logLevel
  };
};