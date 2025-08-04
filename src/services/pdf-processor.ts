import pdf from 'pdf-parse';
import { promises as fs } from 'fs';
import { PDFMetadata, ValidationResult } from '../types/pdf-types.js';
import { validatePDFFile, parsePageRange } from '../utils/validation.js';
import { withTimeout } from '../utils/error-handling.js';
import { getConfig } from '../config/server-config.js';

export class PDFProcessor {
  private config = getConfig();

  private formatDate(dateValue: any): string | undefined {
    if (!dateValue) return undefined;
    
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    
    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
    
    return undefined;
  }

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
      creation_date: this.formatDate(pdfData.info?.CreationDate) || undefined,
      modification_date: this.formatDate(pdfData.info?.ModDate) || undefined,
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
      creation_date: this.formatDate(pdfData.info?.CreationDate) || undefined,
      modification_date: this.formatDate(pdfData.info?.ModDate) || undefined,
      page_count: pdfData.numpages,
      pdf_version: pdfData.version || '1.4',
      file_size_bytes: stats.size
    };
  }

  async extractPages(filePath: string, pageRange: string, outputFormat: 'text' | 'structured' = 'text'): Promise<{
    pages: Array<{
      page_number: number;
      content: string;
      word_count: number;
    }>;
    total_pages_extracted: number;
  }> {
    await validatePDFFile(filePath);
    
    const buffer = await fs.readFile(filePath);
    const pdfData = await withTimeout(
      pdf(buffer),
      this.config.processingTimeout
    );

    const requestedPages = parsePageRange(pageRange, pdfData.numpages);
    
    if (!requestedPages || !Array.isArray(requestedPages)) {
      throw new Error(`Invalid page range result: ${pageRange}`);
    }
    
    // Note: pdf-parse doesn't support extracting specific pages
    // For now, we'll simulate page extraction by dividing the text
    const lines = pdfData.text.split('\n');
    const linesPerPage = Math.max(1, Math.floor(lines.length / pdfData.numpages));
    
    const pages = requestedPages.map((pageNum) => {
      const startLine = (pageNum - 1) * linesPerPage;
      const endLine = Math.min(startLine + linesPerPage, lines.length);
      const pageContent = lines.slice(startLine, endLine).join('\n');
      
      if (outputFormat === 'structured') {
        return {
          page_number: pageNum,
          content: `Page ${pageNum}:\n\n${pageContent}`,
          word_count: pageContent.split(/\s+/).filter(word => word.length > 0).length
        };
      } else {
        return {
          page_number: pageNum,
          content: pageContent,
          word_count: pageContent.split(/\s+/).filter(word => word.length > 0).length
        };
      }
    });

    return {
      pages,
      total_pages_extracted: requestedPages.length
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
        page_count: pdfData.numpages,
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