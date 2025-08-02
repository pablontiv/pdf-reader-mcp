# PDF Reader MCP Server

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