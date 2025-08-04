import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the project root directory
function getProjectRoot(): string {
  // For CommonJS environments, use __dirname
  if (typeof __dirname !== 'undefined') {
    // Walk up from src/utils/ to project root
    return join(__dirname, '..', '..');
  }
  
  // For ES modules, use import.meta.url
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    // Walk up from src/utils/ to project root
    return join(currentDir, '..', '..');
  }
  
  // Fallback: use process.cwd() and find the nearest package.json
  let currentDir = process.cwd();
  const { existsSync } = require('fs');
  
  while (currentDir !== dirname(currentDir)) {
    if (existsSync(join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }
  
  // Last resort: use current working directory
  return process.cwd();
}

/**
 * Resolves a path relative to the project root
 * @param relativePath Path relative to project root (e.g., 'src/test-fixtures/sample.pdf')
 * @returns Absolute path to the file
 */
export function getTestFixturePath(relativePath: string): string {
  const projectRoot = getProjectRoot();
  return join(projectRoot, relativePath);
}

/**
 * Common test fixture paths
 */
export const TestFixtures = {
  SAMPLE_PDF: () => getTestFixturePath('src/test-fixtures/sample.pdf'),
  VALID_PDF: () => getTestFixturePath('src/test-fixtures/valid.pdf'),
  INVALID_PDF: () => getTestFixturePath('src/test-fixtures/invalid.pdf'),
  DOCUMENT_PDF: () => getTestFixturePath('src/test-fixtures/document.pdf'),
  COMPLEX_PDF: () => getTestFixturePath('src/test-fixtures/complex.pdf'),
  MULTIPAGE_PDF: () => getTestFixturePath('src/test-fixtures/multipage.pdf'),
  VERSION_SPACE_PDF: () => getTestFixturePath('test/data/05-versions-space.pdf'),
};