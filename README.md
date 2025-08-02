# PDF Extraction MCP Server

A Model Context Protocol (MCP) server for extracting and processing content from PDF documents. This server provides secure, efficient, and flexible PDF content extraction capabilities following the MCP specification.

## Features

- **Text Extraction**: Extract plain text from PDF documents with formatting preservation
- **Metadata Extraction**: Extract document metadata (title, author, dates, page count, etc.)
- **Page-Level Processing**: Extract content from specific pages or page ranges
- **PDF Validation**: Validate PDF file integrity and readability
- **Security-First**: Input validation and sandboxed processing
- **Type-Safe**: Full TypeScript implementation with comprehensive type definitions

## Installation

```bash
npm install
npm run build
```

## Usage

### As MCP Server

Start the server:

```bash
npm start
```

### Available Tools

#### 1. extract_pdf_text
Extract text content from PDF documents.

**Parameters:**
- `file_path` (required): Path to the PDF file
- `pages` (optional): Page range ("1-5", "1,3,5", or "all")
- `preserve_formatting` (optional): Whether to preserve text formatting
- `include_metadata` (optional): Whether to include document metadata

#### 2. extract_pdf_metadata
Extract metadata and document information from PDF files.

**Parameters:**
- `file_path` (required): Path to the PDF file

#### 3. extract_pdf_pages
Extract content from specific pages or page ranges.

**Parameters:**
- `file_path` (required): Path to the PDF file
- `page_range` (required): Page range to extract
- `output_format` (optional): "text" or "structured"

#### 4. validate_pdf
Validate PDF file integrity and readability.

**Parameters:**
- `file_path` (required): Path to the PDF file

## Configuration

Environment variables:
- `PDF_MAX_FILE_SIZE`: Maximum file size in bytes (default: 104857600 = 100MB)
- `PDF_PROCESSING_TIMEOUT`: Processing timeout in milliseconds (default: 60000)
- `PDF_MAX_MEMORY_USAGE`: Maximum memory usage in bytes (default: 524288000 = 500MB)
- `LOG_LEVEL`: Logging level (default: 'info')

## Security

- Input validation for all file paths
- Directory traversal protection
- File size and memory limits
- Processing timeouts
- No temporary file persistence

## Error Handling

The server provides comprehensive error handling with specific error codes:
- `-32602`: Validation errors
- `-32603`: File access errors
- `-32604`: Size/resource errors
- `-32605`: Format errors

## Performance

- Supports files up to 100MB
- Memory usage limited to 500MB
- Concurrent processing support
- Optimized for text-based PDFs

## License

MIT