export interface ExtractTextParams {
  file_path: string;
  pages?: string;
  preserve_formatting?: boolean;
  include_metadata?: boolean;
}

export interface ExtractTextResult {
  text: string;
  page_count: number;
  metadata?: PDFMetadata;
  processing_time_ms: number;
}

export interface ExtractMetadataParams {
  file_path: string;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creation_date?: string;
  modification_date?: string;
  page_count: number;
  pdf_version: string;
  file_size_bytes: number;
}

export interface ExtractPagesParams {
  file_path: string;
  page_range: string;
  output_format: "text" | "structured";
}

export interface ExtractPagesResult {
  pages: Array<{
    page_number: number;
    content: string;
    word_count: number;
  }>;
  total_pages_extracted: number;
}

export interface ValidatePDFParams {
  file_path: string;
}

export interface ValidationResult {
  is_valid: boolean;
  pdf_version?: string;
  is_encrypted: boolean;
  is_readable: boolean;
  page_count?: number;
  error_message?: string;
  file_size_bytes: number;
}

export interface MCPError {
  code: number;
  message: string;
  data?: {
    error_type: string;
    file_path?: string;
    details?: string;
  };
}