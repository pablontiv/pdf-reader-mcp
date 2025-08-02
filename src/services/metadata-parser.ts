import pdf from 'pdf-parse';
import { promises as fs } from 'fs';
import { PDFMetadata } from '../types/pdf-types.js';
import { validatePDFFile } from '../utils/validation.js';
import { withTimeout } from '../utils/error-handling.js';
import { getConfig } from '../config/server-config.js';

export class MetadataParser {
  private config = getConfig();

  async parseMetadata(filePath: string): Promise<PDFMetadata> {
    await validatePDFFile(filePath);
    
    const buffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);
    
    const pdfData = await withTimeout(
      pdf(buffer),
      this.config.processingTimeout
    );

    return this.formatMetadata(pdfData, stats.size);
  }

  async parseBasicInfo(filePath: string): Promise<{
    page_count: number;
    file_size_bytes: number;
    pdf_version: string;
    has_metadata: boolean;
  }> {
    await validatePDFFile(filePath);
    
    const buffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);
    
    const pdfData = await withTimeout(
      pdf(buffer),
      this.config.processingTimeout
    );

    const hasMetadata = Boolean(
      pdfData.info?.Title ||
      pdfData.info?.Author ||
      pdfData.info?.Subject ||
      pdfData.info?.Creator ||
      pdfData.info?.Producer
    );

    return {
      page_count: pdfData.numpages,
      file_size_bytes: stats.size,
      pdf_version: pdfData.version || '1.4',
      has_metadata: hasMetadata
    };
  }

  private formatMetadata(pdfData: any, fileSize: number): PDFMetadata {
    return {
      title: this.sanitizeString(pdfData.info?.Title),
      author: this.sanitizeString(pdfData.info?.Author),
      subject: this.sanitizeString(pdfData.info?.Subject),
      creator: this.sanitizeString(pdfData.info?.Creator),
      producer: this.sanitizeString(pdfData.info?.Producer),
      creation_date: this.formatDate(pdfData.info?.CreationDate),
      modification_date: this.formatDate(pdfData.info?.ModDate),
      page_count: pdfData.numpages,
      pdf_version: pdfData.version || '1.4',
      file_size_bytes: fileSize
    };
  }

  private sanitizeString(value: any): string | undefined {
    if (!value || typeof value !== 'string') {
      return undefined;
    }
    
    const cleaned = value.trim();
    return cleaned.length > 0 ? cleaned : undefined;
  }

  private formatDate(date: any): string | undefined {
    if (!date) return undefined;
    
    try {
      if (date instanceof Date) {
        return date.toISOString();
      }
      
      if (typeof date === 'string') {
        const parsed = new Date(date);
        return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
      }
      
      return undefined;
    } catch {
      return undefined;
    }
  }
}