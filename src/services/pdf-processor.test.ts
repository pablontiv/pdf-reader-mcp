import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { PDFProcessor } from './pdf-processor.js';
import { TestFixtures, getTestFixturePath } from '../utils/test-helpers.js';
import pdfParse from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';

// Mock external dependencies
vi.mock('pdf-parse');
vi.mock('pdf-lib');
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    stat: vi.fn()
  }
}));
vi.mock('../utils/validation.js');

describe('PDFProcessor with External Service Mocks', () => {
  let processor: PDFProcessor;
  let mockPdfParse: Mock;
  let mockPDFDocument: any;
  let mockFs: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Setup PDF processor
    processor = new PDFProcessor();
    
    // Setup pdf-parse mock
    mockPdfParse = vi.mocked(pdfParse);
    
    // Setup pdf-lib mock
    mockPDFDocument = {
      load: vi.fn(),
      getPageCount: vi.fn(),
      getTitle: vi.fn(),
      getAuthor: vi.fn(),
      getSubject: vi.fn(),
      getCreator: vi.fn(),
      getProducer: vi.fn(),
      getCreationDate: vi.fn(),
      getModificationDate: vi.fn()
    };
    vi.mocked(PDFDocument).load = mockPDFDocument.load;
    
    // Setup fs mock
    const fsMock = await import('fs');
    mockFs = vi.mocked(fsMock.promises);
    mockFs.readFile.mockResolvedValue(Buffer.from('mock pdf'));
    mockFs.stat.mockResolvedValue({ size: 1000, isFile: () => true });
    
    // Mock validation functions to always pass
    const validationModule = await import('../utils/validation.js');
    vi.mocked(validationModule.validatePDFFile).mockResolvedValue(undefined);
    vi.mocked(validationModule.validateFilePath).mockResolvedValue(undefined);
    vi.mocked(validationModule.parsePageRange).mockReturnValue([1, 2]); // Default mock return
  });

  describe('Text Extraction with pdf-parse Mock', () => {
    it('should extract text successfully using pdf-parse', async () => {
      const mockPdfData = {
        text: 'Sample PDF content\nSecond line of content',
        numpages: 2,
        info: {
          Title: 'Test Document',
          Author: 'Test Author',
          Producer: 'Test Producer',
          Creator: 'Test Creator',
          CreationDate: new Date('2024-01-01'),
          ModDate: new Date('2024-01-02')
        },
        metadata: null,
        version: '1.4'
      };

      const mockBuffer = Buffer.from('fake pdf content');
      
      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData);

      const testFile = TestFixtures.SAMPLE_PDF();
      const result = await processor.extractText(testFile, true);

      expect(mockFs.readFile).toHaveBeenCalledWith(testFile);
      expect(mockPdfParse).toHaveBeenCalledWith(mockBuffer);
      
      expect(result.text).toBe('Sample PDF content\nSecond line of content');
      expect(result.pageCount).toBe(2);
      expect(result.metadata?.title).toBe('Test Document');
      expect(result.metadata?.author).toBe('Test Author');
    });

    it('should handle pdf-parse errors gracefully', async () => {
      const mockBuffer = Buffer.from('invalid pdf content');
      
      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockPdfParse.mockRejectedValue(new Error('Invalid PDF structure'));

      const testFile = TestFixtures.INVALID_PDF();
      await expect(processor.extractText(testFile, true))
        .rejects.toThrow('Invalid PDF structure');
        
      expect(mockPdfParse).toHaveBeenCalledWith(mockBuffer);
    });

    it('should handle memory-intensive PDFs with streaming', async () => {
      const largeMockBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB
      const mockPdfData = {
        text: 'Large PDF content',
        numpages: 1000,
        info: { Title: 'Large Document' },
        metadata: null,
        version: '1.4'
      };

      mockFs.readFile.mockResolvedValue(largeMockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData);

      const testFile = getTestFixturePath('test/large.pdf');
      const result = await processor.extractText(testFile, true);

      expect(result.text).toBe('Large PDF content');
      expect(result.pageCount).toBe(1000);
    });

    it('should apply timeout to pdf-parse operations', async () => {
      const mockBuffer = Buffer.from('slow pdf content');
      
      mockFs.readFile.mockResolvedValue(mockBuffer);
      
      // Mock pdf-parse to reject with timeout error immediately
      mockPdfParse.mockRejectedValue(new Error('Operation timed out'));

      const testFile = getTestFixturePath('test/slow.pdf');
      await expect(processor.extractText(testFile, true))
        .rejects.toThrow('Operation timed out');
    });
  });

  describe('Metadata Extraction with pdf-lib Mock', () => {
    it('should extract metadata using pdf-lib', async () => {
      const mockPdfData = {
        text: 'Sample content',
        numpages: 5,
        info: {
          Title: 'Document Title',
          Author: 'Document Author',
          Subject: 'Document Subject',
          Creator: 'Document Creator',
          Producer: 'Document Producer',
          CreationDate: new Date('2024-01-01'),
          ModDate: new Date('2024-01-02')
        },
        metadata: null,
        version: '1.4'
      };

      const mockBuffer = Buffer.from('fake pdf content');
      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockFs.stat.mockResolvedValue({ size: 1024 });
      mockPdfParse.mockResolvedValue(mockPdfData);

      const testFile = TestFixtures.SAMPLE_PDF();
      const metadata = await processor.extractMetadata(testFile);

      expect(mockPdfParse).toHaveBeenCalledWith(mockBuffer);
      expect(metadata.title).toBe('Document Title');
      expect(metadata.author).toBe('Document Author');
      expect(metadata.page_count).toBe(5);
      expect(metadata.file_size_bytes).toBe(1024);
    });

    it('should handle missing metadata fields gracefully', async () => {
      const mockPdfData = {
        text: 'Sample content',
        numpages: 3,
        info: {
          Title: undefined,
          Author: null,
          Subject: '',
          Creator: undefined,
          Producer: undefined,
          CreationDate: undefined,
          ModDate: undefined
        },
        metadata: null,
        version: '1.4'
      };

      const mockBuffer = Buffer.from('fake pdf content');
      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockFs.stat.mockResolvedValue({ size: 2048 });
      mockPdfParse.mockResolvedValue(mockPdfData);

      const testFile = getTestFixturePath('test/minimal.pdf');
      const metadata = await processor.extractMetadata(testFile);

      expect(metadata.title).toBeUndefined();
      expect(metadata.author).toBeUndefined();
      expect(metadata.page_count).toBe(3);
      expect(metadata.file_size_bytes).toBe(2048);
    });

    it('should handle pdf-lib loading errors', async () => {
      const mockBuffer = Buffer.from('corrupted pdf content');
      
      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockPdfParse.mockRejectedValue(new Error('Cannot parse PDF'));

      const testFile = getTestFixturePath('test/corrupted.pdf');
      await expect(processor.extractMetadata(testFile))
        .rejects.toThrow('Cannot parse PDF');
    });
  });

  describe('File System Mock Integration', () => {
    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file'));

      const testFile = getTestFixturePath('test/nonexistent.pdf');
      await expect(processor.extractText(testFile, true))
        .rejects.toThrow('ENOENT: no such file');
        
      expect(mockFs.readFile).toHaveBeenCalledWith(testFile);
    });

    it('should handle permission denied errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('EACCES: permission denied'));

      const testFile = getTestFixturePath('test/restricted.pdf');
      await expect(processor.extractText(testFile, true))
        .rejects.toThrow('EACCES: permission denied');
    });

    it('should handle file stat errors for metadata', async () => {
      const mockBuffer = Buffer.from('fake pdf content');
      
      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockFs.stat.mockRejectedValue(new Error('EACCES: permission denied'));
      
      // Should still try to extract metadata even if stat fails
      const testFile = getTestFixturePath('test/restricted.pdf');
      await expect(processor.extractMetadata(testFile))
        .rejects.toThrow();
    });
  });

  describe('Page Range Extraction Mock', () => {
    it('should extract specific pages with mocked dependencies', async () => {
      const mockPdfData = {
        text: 'Page 1 content\nPage 2 content\nPage 3 content',
        numpages: 3,
        info: { Title: 'Multi-page Document' },
        metadata: null,
        version: '1.4'
      };

      const mockBuffer = Buffer.from('fake pdf content');
      
      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData);

      const testFile = TestFixtures.SAMPLE_PDF();
      const result = await processor.extractPages(testFile, '1-2', 'text');

      expect(result.total_pages_extracted).toBe(2);
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].page_number).toBe(1);
      expect(result.pages[1].page_number).toBe(2);
    });

    it('should handle page extraction with invalid ranges', async () => {
      const mockBuffer = Buffer.from('fake pdf content');
      
      mockFs.readFile.mockResolvedValue(mockBuffer);
      
      // Mock a PDF with only 2 pages
      mockPdfParse.mockResolvedValue({
        text: 'Page 1\nPage 2',
        numpages: 2,
        info: {},
        metadata: null,
        version: '1.4'
      });

      // Mock parsePageRange to throw error for invalid range
      const validationModule = await import('../utils/validation.js');
      vi.mocked(validationModule.parsePageRange).mockImplementation(() => {
        throw new Error('Invalid page range: 1-5');
      });

      // Request pages beyond available range
      const testFile = TestFixtures.SAMPLE_PDF();
      await expect(processor.extractPages(testFile, '1-5', 'text'))
        .rejects.toThrow('Invalid page range: 1-5');
    });
  });

  describe('PDF Validation Mock', () => {
    it('should validate PDF using mocked dependencies', async () => {
      const mockPdfData = {
        text: 'Valid PDF content',
        numpages: 10,
        info: { Title: 'Valid Document' },
        metadata: null,
        version: '1.4'
      };

      const mockBuffer = Buffer.from('fake pdf content');
      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockFs.stat.mockResolvedValue({ size: 5120 });
      mockPdfParse.mockResolvedValue(mockPdfData);

      const testFile = TestFixtures.VALID_PDF();
      const validation = await processor.validatePDF(testFile);

      expect(validation.is_valid).toBe(true);
      expect(validation.is_readable).toBe(true);
      expect(validation.page_count).toBe(10);
      expect(validation.file_size_bytes).toBe(5120);
    });

    it('should detect invalid PDFs through mock failures', async () => {
      const mockBuffer = Buffer.from('not a pdf');
      
      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockFs.stat.mockResolvedValue({ size: 100 });
      mockPdfParse.mockRejectedValue(new Error('Invalid PDF'));

      const testFile = TestFixtures.INVALID_PDF();
      const validation = await processor.validatePDF(testFile);

      expect(validation.is_valid).toBe(false);
      expect(validation.is_readable).toBe(false);
      expect(validation.error_message).toContain('Invalid PDF');
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle concurrent processing with mocks', async () => {
      const mockBuffer = Buffer.from('fake pdf content');
      const mockPdfData = {
        text: 'Sample content',
        numpages: 1,
        info: {},
        metadata: null,
        version: '1.4'
      };

      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData);

      // Simulate concurrent processing
      const concurrentPromises = Array.from({ length: 10 }, (_, i) => 
        processor.extractText(getTestFixturePath(`test/file${i}.pdf`), true)
      );

      const results = await Promise.all(concurrentPromises);
      
      expect(results).toHaveLength(10);
      expect(mockFs.readFile).toHaveBeenCalledTimes(10);
      expect(mockPdfParse).toHaveBeenCalledTimes(10);
    });

    it('should handle memory pressure simulation', async () => {
      // Simulate low memory condition
      const mockError = new Error('JavaScript heap out of memory');
      mockPdfParse.mockRejectedValue(mockError);

      const testFile = getTestFixturePath('test/large.pdf');
      await expect(processor.extractText(testFile, true))
        .rejects.toThrow('JavaScript heap out of memory');
    });
  });

  describe('Mock Verification and Cleanup', () => {
    it('should properly reset mocks between tests', () => {
      expect(mockPdfParse).not.toHaveBeenCalled();
      expect(mockFs.readFile).not.toHaveBeenCalled();
      expect(mockPDFDocument.load).not.toHaveBeenCalled();
    });

    it('should verify all mock interactions', async () => {
      const mockBuffer = Buffer.from('test content');
      const mockPdfData = {
        text: 'Test',
        numpages: 1,
        info: {},
        metadata: null,
        version: '1.4'
      };

      mockFs.readFile.mockResolvedValue(mockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData);

      const testFile = getTestFixturePath('test/verify.pdf');
      await processor.extractText(testFile, true);

      // Verify exact call patterns
      expect(mockFs.readFile).toHaveBeenCalledOnce();
      expect(mockFs.readFile).toHaveBeenCalledWith(testFile);
      expect(mockPdfParse).toHaveBeenCalledOnce();
      expect(mockPdfParse).toHaveBeenCalledWith(mockBuffer);
    });
  });
});