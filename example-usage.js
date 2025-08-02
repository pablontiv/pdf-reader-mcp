// Example usage of the PDF Extraction MCP Server
// This demonstrates how to use the server tools

const exampleUsage = {
  // Extract all text from a PDF
  extractAllText: {
    tool: "extract_pdf_text",
    arguments: {
      file_path: "/path/to/document.pdf",
      preserve_formatting: true,
      include_metadata: true
    }
  },

  // Extract specific pages
  extractPages: {
    tool: "extract_pdf_pages", 
    arguments: {
      file_path: "/path/to/document.pdf",
      page_range: "1-3,5,7-10",
      output_format: "structured"
    }
  },

  // Get document metadata
  getMetadata: {
    tool: "extract_pdf_metadata",
    arguments: {
      file_path: "/path/to/document.pdf"
    }
  },

  // Validate PDF file
  validateFile: {
    tool: "validate_pdf",
    arguments: {
      file_path: "/path/to/document.pdf"
    }
  }
};

// Example responses
const exampleResponses = {
  extractText: {
    text: "Document content here...",
    page_count: 10,
    processing_time_ms: 1250,
    metadata: {
      title: "Sample Document",
      author: "John Doe",
      page_count: 10,
      pdf_version: "1.4",
      file_size_bytes: 1048576
    }
  },

  extractPages: {
    pages: [
      {
        page_number: 1,
        content: "First page content...",
        word_count: 245
      },
      {
        page_number: 2,
        content: "Second page content...",
        word_count: 312
      }
    ],
    total_pages_extracted: 2
  },

  metadata: {
    title: "Sample Document",
    author: "John Doe",
    subject: "Technical Documentation",
    creator: "Microsoft Word",
    producer: "Adobe Acrobat",
    creation_date: "2024-01-15T10:30:00.000Z",
    modification_date: "2024-01-16T14:20:00.000Z",
    page_count: 10,
    pdf_version: "1.4",
    file_size_bytes: 1048576
  },

  validation: {
    is_valid: true,
    pdf_version: "1.4",
    is_encrypted: false,
    is_readable: true,
    file_size_bytes: 1048576
  }
};

module.exports = { exampleUsage, exampleResponses };