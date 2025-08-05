# PDF Reader MCP Server

[![CI/CD Pipeline](https://github.com/pablontiv/pdf-reader-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/pablontiv/pdf-reader-mcp/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm package](https://img.shields.io/badge/npm-package-orange)](https://www.npmjs.com/)

<a href="https://glama.ai/mcp/servers/@pablontiv/pdf-reader-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@pablontiv/pdf-reader-mcp/badge" alt="PDF Reader Server MCP server" />
</a>

A Model Context Protocol (MCP) server for extracting and processing content from PDF documents. This server provides secure, efficient, and flexible PDF content extraction capabilities following the MCP specification.

## Features

- **Text Extraction**: Extract plain text from PDF documents with formatting preservation
- **Metadata Extraction**: Extract document metadata (title, author, dates, page count, etc.)
- **Page-Level Processing**: Extract content from specific pages or page ranges
- **PDF Validation**: Validate PDF file integrity and readability
- **Security-First**: Input validation and sandboxed processing
- **Type-Safe**: Full TypeScript implementation with comprehensive type definitions

## Why Choose This MCP Server?

### 🎯 **Specialized PDF Tools**
- **4 dedicated tools** for different PDF processing needs (text, metadata, pages, validation)
- **Granular control** - extract specific pages, preserve formatting, or get structured output
- **Flexible page ranges** - support for "1-5", "1,3,5", or "all" syntax

### 🛡️ **Enterprise-Grade Security**
- **Directory traversal protection** prevents unauthorized file access
- **File size limits** (configurable up to 100MB by default)
- **Processing timeouts** prevent resource exhaustion
- **Memory usage controls** (500MB limit by default)
- **No temporary file persistence** - secure processing without data leakage

### ⚡ **Production-Ready Architecture**
- **Robust error handling** with standardized MCP error codes (-32602 to -32605)
- **Structured logging** with Winston for monitoring and debugging
- **Comprehensive input validation** using Zod schemas
- **Type-safe TypeScript** implementation with full type definitions
- **Concurrent processing support** for multiple PDF operations

### 🔧 **Developer Experience**
- **Easy configuration** via environment variables
- **Flexible deployment** - works with 70+ MCP-compatible clients
- **Clear documentation** with real-world examples
- **Modern tech stack** - TypeScript, pdf-parse, pdf-lib
- **Test coverage** with Vitest for reliability

### 📊 **Performance Optimized**
- **Efficient PDF processing** optimized for text-based documents
- **Configurable resource limits** to match your infrastructure
- **Minimal dependencies** for faster startup and lower memory footprint
- **Streaming support** for large document processing

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

## Client Configuration

This MCP server can be used with various AI applications and development tools. Below are configuration instructions for the most popular clients:

### Claude Desktop

Add this configuration to your Claude Desktop config file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pdf-reader": {
      "command": "node",
      "args": ["/path/to/pdf-reader-mcp/dist/index.js"],
      "env": {
        "PDF_MAX_FILE_SIZE": "104857600",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### VS Code and VS Code-based Editors

For VS Code, Cursor, Windsurf, and other VS Code-based editors, install an MCP extension:

1. Install the MCP extension from the marketplace
2. Add this configuration to your `settings.json`:

```json
{
  "mcp.servers": {
    "pdf-reader": {
      "command": "node",
      "args": ["/path/to/pdf-reader-mcp/dist/index.js"]
    }
  }
}
```

### ChatGPT Desktop

For ChatGPT Desktop (available since OpenAI's MCP adoption in March 2025):

1. Go to Settings → Integrations → MCP Servers
2. Add new server with:
   - **Name:** PDF Reader
   - **Command:** `node /path/to/pdf-reader-mcp/dist/index.js`

### Claude Code

**Option 1: Command Line (Recommended)**

Unix/macOS:
```bash
# Add the MCP server directly via command line
claude mcp add pdf-reader node /path/to/pdf-reader-mcp/dist/index.js

# With environment variables
claude mcp add pdf-reader -e PDF_MAX_FILE_SIZE=104857600 -e LOG_LEVEL=info -- node /path/to/pdf-reader-mcp/dist/index.js

# Set scope (optional: --scope local|project|user)
claude mcp add --scope project pdf-reader node /path/to/pdf-reader-mcp/dist/index.js
```

Windows:
```cmd
rem Add the MCP server directly via command line
claude mcp add pdf-reader node C:\path\to\pdf-reader-mcp\dist\index.js

rem With environment variables
claude mcp add pdf-reader -e PDF_MAX_FILE_SIZE=104857600 -e LOG_LEVEL=info -- node C:\path\to\pdf-reader-mcp\dist\index.js

rem Set scope (optional: --scope local|project|user)
claude mcp add --scope project pdf-reader node C:\path\to\pdf-reader-mcp\dist\index.js
```

**Option 2: Configuration File**
Configure in your project's `.claude/settings.json`:

```json
{
  "mcp": {
    "servers": {
      "pdf-reader": {
        "command": "node",
        "args": ["/path/to/pdf-reader-mcp/dist/index.js"]
      }
    }
  }
}
```

### Other Clients

For other MCP-compatible applications (Microsoft Copilot Studio, Replit, Zed, etc.), refer to the [official MCP documentation](https://modelcontextprotocol.io) for client-specific configuration instructions.

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