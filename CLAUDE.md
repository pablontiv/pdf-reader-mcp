# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for PDF content extraction and processing. It's built in TypeScript using the `@modelcontextprotocol/sdk` and provides tools for extracting text, metadata, and validating PDF files. The server uses stdio transport and follows MCP specification 2025-06-18.

## Common Commands

### Development
```bash
npm run dev          # Run development server with tsx
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled server from dist/
npm run typecheck    # Type check without emitting files
npm run lint         # ESLint on src/**/*.ts
npm test             # Run Vitest tests
```

### Testing
```bash
npm test             # Run all tests with Vitest
npm test -- --run    # Run tests once without watch mode
```

Tests are located in `src/**/*.test.ts` and use Vitest with Node.js environment.

## Architecture

### Core Structure
- **Main Server**: `src/index.ts` - PDFExtractionServer class with stdio transport
- **Tools Directory**: `src/tools/` - Individual MCP tool implementations
- **Services**: `src/services/` - PDF processing business logic using pdf-parse
- **Types**: `src/types/` - TypeScript definitions for PDF and MCP types
- **Utils**: `src/utils/` - Validation and error handling utilities
- **Config**: `src/config/` - Server configuration with environment variables

### MCP Tools Implementation
The server provides 4 main tools:
1. `extract_pdf_text` - Text extraction with formatting options
2. `extract_pdf_metadata` - Document metadata extraction
3. `extract_pdf_pages` - Page-specific content extraction
4. `validate_pdf` - PDF validation and integrity checks

### Key Dependencies
- `pdf-parse` - Primary PDF processing library
- `pdf-lib` - Additional PDF manipulation
- `zod` - Input validation schemas
- `winston` - Structured logging
- `@modelcontextprotocol/sdk` - MCP framework

### Known Issues
- **PDF-Parse Warning**: The `pdf-parse` library may output "Warning: Indexing all PDF objects" to stderr during initialization. This is a harmless informational message from the native PDF parsing library and can be safely ignored. To suppress it when running the server, redirect stderr: `node dist/index.js 2>/dev/null`

### Error Handling
Uses standardized MCP error codes:
- `-32602`: Validation errors
- `-32603`: File access errors  
- `-32604`: Size/resource errors
- `-32605`: Format errors

### Configuration
Environment variables in `src/config/server-config.ts`:
- `PDF_MAX_FILE_SIZE`: Max file size (default: 100MB)
- `PDF_PROCESSING_TIMEOUT`: Processing timeout (default: 60s)
- `PDF_MAX_MEMORY_USAGE`: Memory limit (default: 500MB)
- `LOG_LEVEL`: Logging level (default: 'info')

## Development Guidelines

### Adding New Tools
1. Create tool definition in `src/tools/[tool-name].ts`
2. Export both tool schema and handler function
3. Add tool to `src/index.ts` tools array and switch statement
4. Update types in `src/types/` if needed

### PDF Processing
All PDF operations go through `PDFProcessor` class in `src/services/pdf-processor.ts`. This class handles file validation, timeout management, and metadata extraction consistently across tools.

### Type Safety
The project uses strict TypeScript with comprehensive type definitions. All tool parameters are validated using Zod schemas defined in `src/types/mcp-types.ts`.

### Security Considerations
- File path validation prevents directory traversal
- File size limits enforced before processing
- Processing timeouts prevent resource exhaustion
- No temporary file persistence