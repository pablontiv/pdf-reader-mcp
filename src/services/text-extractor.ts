import pdf from 'pdf-parse';
import { promises as fs } from 'fs';
import { validatePDFFile, parsePageRange } from '../utils/validation.js';
import { withTimeout } from '../utils/error-handling.js';
import { getConfig } from '../config/server-config.js';

export interface PageContent {
  page_number: number;
  content: string;
  word_count: number;
}

export class TextExtractor {
  private config = getConfig();

  async extractFromPages(
    filePath: string,
    pageRange: string,
    outputFormat: 'text' | 'structured' = 'text'
  ): Promise<{
    pages: PageContent[];
    total_pages_extracted: number;
  }> {
    await validatePDFFile(filePath);
    
    const buffer = await fs.readFile(filePath);
    
    const pdfData = await withTimeout(
      pdf(buffer),
      this.config.processingTimeout
    );

    const pageNumbers = parsePageRange(pageRange, pdfData.numpages);
    const pages: PageContent[] = [];

    for (const pageNum of pageNumbers) {
      try {
        const pageBuffer = await this.extractSinglePage(buffer, pageNum);
        const pageData = await pdf(pageBuffer);

        const rawContent = pageData.text.trim();
        const content = outputFormat === 'structured' ? rawContent : rawContent.replace(/\s+/g, ' ').trim();
        const wordCount = content ? content.split(/\s+/).length : 0;

        pages.push({
          page_number: pageNum,
          content,
          word_count: wordCount
        });
      } catch (error) {
        pages.push({
          page_number: pageNum,
          content: `Error extracting page ${pageNum}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          word_count: 0
        });
      }
    }

    return {
      pages,
      total_pages_extracted: pages.length
    };
  }

  private async extractSinglePage(buffer: Buffer, pageNum: number): Promise<Buffer> {
    try {
      const pdfData = await pdf(buffer);
      
      if (pageNum > pdfData.numpages) {
        throw new Error(`Page ${pageNum} does not exist (total pages: ${pdfData.numpages})`);
      }

      return buffer;
    } catch (error) {
      throw new Error(`Failed to extract page ${pageNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractTextWithWordCount(filePath: string): Promise<{
    text: string;
    word_count: number;
    line_count: number;
    character_count: number;
  }> {
    await validatePDFFile(filePath);
    
    const buffer = await fs.readFile(filePath);
    
    const pdfData = await withTimeout(
      pdf(buffer),
      this.config.processingTimeout
    );

    const text = pdfData.text.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    const lineCount = text ? text.split('\n').length : 0;
    const characterCount = text.length;

    return {
      text,
      word_count: wordCount,
      line_count: lineCount,
      character_count: characterCount
    };
  }
}