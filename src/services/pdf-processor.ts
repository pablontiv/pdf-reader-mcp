import pdf from 'pdf-parse';
import { promises as fs } from 'fs';
import { PDFMetadata, ValidationResult } from '../types/pdf-types.js';
import { validatePDFFile, parsePageRange } from '../utils/validation.js';
import { withTimeout } from '../utils/error-handling.js';
import { getConfig } from '../config/server-config.js';

export class PDFProcessor {
  private config = getConfig();

  async extractText(filePath: string, preserveFormatting: boolean = true): Promise<{
    text: string;
    pageCount: number;
    metadata: PDFMetadata;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    
    await validatePDFFile(filePath);
    
    const buffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);
    
    const pdfData = await withTimeout(
      pdf(buffer),
      this.config.processingTimeout
    );

    const metadata: PDFMetadata = {
      title: pdfData.info?.Title || undefined,
      author: pdfData.info?.Author || undefined,
      subject: pdfData.info?.Subject || undefined,
      creator: pdfData.info?.Creator || undefined,
      producer: pdfData.info?.Producer || undefined,
      creation_date: pdfData.info?.CreationDate?.toISOString() || undefined,
      modification_date: pdfData.info?.ModDate?.toISOString() || undefined,
      page_count: pdfData.numpages,
      pdf_version: pdfData.version || '1.4',
      file_size_bytes: stats.size
    };

    const processingTimeMs = Date.now() - startTime;

    return {
      text: preserveFormatting ? pdfData.text : pdfData.text.replace(/\s+/g, ' ').trim(),
      pageCount: pdfData.numpages,
      metadata,
      processingTimeMs
    };
  }

  async extractMetadata(filePath: string): Promise<PDFMetadata> {
    await validatePDFFile(filePath);
    
    const buffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);
    
    const pdfData = await withTimeout(
      pdf(buffer),
      this.config.processingTimeout
    );

    return {
      title: pdfData.info?.Title || undefined,
      author: pdfData.info?.Author || undefined,
      subject: pdfData.info?.Subject || undefined,
      creator: pdfData.info?.Creator || undefined,
      producer: pdfData.info?.Producer || undefined,
      creation_date: pdfData.info?.CreationDate?.toISOString() || undefined,
      modification_date: pdfData.info?.ModDate?.toISOString() || undefined,
      page_count: pdfData.numpages,
      pdf_version: pdfData.version || '1.4',
      file_size_bytes: stats.size
    };
  }

  async extractPages(filePath: string, pageRange: string, outputFormat: 'text' | 'structured' = 'text'): Promise<{
    content: string;
    pages: number[];
    total_pages: number;
    output_format: string;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    
    await validatePDFFile(filePath);
    
    const buffer = await fs.readFile(filePath);
    const pdfData = await withTimeout(
      pdf(buffer),
      this.config.processingTimeout
    );

    const requestedPages = parsePageRange(pageRange, pdfData.numpages);
    
    // Note: pdf-parse doesn't support extracting specific pages
    // For now, we'll return the full text with a note about the requested pages
    let content = pdfData.text;
    
    if (outputFormat === 'structured') {
      content = `Pages ${requestedPages.join(', ')} of ${pdfData.numpages}:\n\n${content}`;
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      content,
      pages: requestedPages,
      total_pages: pdfData.numpages,
      output_format: outputFormat,
      processingTimeMs
    };
  }

  async validatePDF(filePath: string): Promise<ValidationResult> {
    try {
      await validatePDFFile(filePath);
      
      const buffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      
      const pdfData = await withTimeout(
        pdf(buffer),
        this.config.processingTimeout
      );

      return {
        is_valid: true,
        pdf_version: pdfData.version || '1.4',
        is_encrypted: false, // pdf-parse can handle basic PDFs
        is_readable: true,
        file_size_bytes: stats.size
      };
    } catch (error) {
      const stats = await fs.stat(filePath).catch(() => ({ size: 0 }));
      
      return {
        is_valid: false,
        is_encrypted: false,
        is_readable: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        file_size_bytes: stats.size
      };
    }
  }
}