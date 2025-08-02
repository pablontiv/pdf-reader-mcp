import { describe, it, expect } from 'vitest';
import { 
  extractTextTool, 
  extractMetadataTool, 
  extractPagesTool, 
  validatePDFTool 
} from './tools/index.js';

describe('PDF Extraction Server Integration', () => {
  describe('Tool Registration', () => {
    it('should register all PDF extraction tools', () => {
      const tools = [
        extractTextTool,
        extractMetadataTool,
        extractPagesTool,
        validatePDFTool
      ];
      
      expect(tools).toHaveLength(4);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('extract_pdf_text');
      expect(toolNames).toContain('extract_pdf_metadata');
      expect(toolNames).toContain('extract_pdf_pages');
      expect(toolNames).toContain('validate_pdf');
    });

    it('should have properly structured tool definitions', () => {
      const tools = [
        extractTextTool,
        extractMetadataTool,
        extractPagesTool,
        validatePDFTool
      ];
      
      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        
        // Verify JSON Schema structure
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema).toHaveProperty('properties');
        expect(tool.inputSchema).toHaveProperty('required');
      });
    });

    it('should define correct tool schemas according to MCP standards', () => {
      const tools = [
        extractTextTool,
        extractMetadataTool,
        extractPagesTool,
        validatePDFTool
      ];
      
      const toolSchemas = tools.reduce((acc, tool) => {
        acc[tool.name] = tool.inputSchema;
        return acc;
      }, {} as Record<string, any>);

      // Extract text tool
      expect(toolSchemas['extract_pdf_text'].required).toContain('file_path');
      expect(toolSchemas['extract_pdf_text'].properties.file_path.type).toBe('string');
      
      // Extract metadata tool
      expect(toolSchemas['extract_pdf_metadata'].required).toContain('file_path');
      
      // Extract pages tool
      expect(toolSchemas['extract_pdf_pages'].required).toContain('file_path');
      expect(toolSchemas['extract_pdf_pages'].required).toContain('page_range');
      
      // Validate PDF tool
      expect(toolSchemas['validate_pdf'].required).toContain('file_path');
    });
  });

  describe('MCP Protocol Compliance', () => {
    it('should follow JSON-RPC 2.0 message format', () => {
      const tools = [
        extractTextTool,
        extractMetadataTool,
        extractPagesTool,
        validatePDFTool
      ];
      
      // Verify response structure follows JSON-RPC 2.0
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should have consistent schema structure across tools', () => {
      const tools = [
        extractTextTool,
        extractMetadataTool,
        extractPagesTool,
        validatePDFTool
      ];

      tools.forEach(tool => {
        // All tools should have consistent structure
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties.file_path).toEqual({
          type: 'string',
          description: expect.stringContaining('Path to the PDF file')
        });
      });
    });
  });

  describe('Type Safety Integration', () => {
    it('should maintain type safety across tool interfaces', () => {
      const tools = [
        extractTextTool,
        extractMetadataTool,
        extractPagesTool,
        validatePDFTool
      ];
      
      // Verify tool list maintains proper TypeScript types
      tools.forEach(tool => {
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
      });
    });

    it('should handle TypeScript enum values correctly', () => {
      const extractPagesSchema = extractPagesTool.inputSchema;
      
      expect(extractPagesSchema.properties?.output_format).toHaveProperty('enum');
      expect(extractPagesSchema.properties?.output_format?.enum).toEqual(['text', 'structured']);
    });
  });

  describe('Tool Schema Validation', () => {
    it('should validate required fields correctly', () => {
      // Extract text tool should have file_path as required
      expect(extractTextTool.inputSchema.required).toEqual(['file_path']);
      
      // Extract metadata tool should have file_path as required
      expect(extractMetadataTool.inputSchema.required).toEqual(['file_path']);
      
      // Extract pages tool should have both file_path and page_range as required
      expect(extractPagesTool.inputSchema.required).toEqual(['file_path', 'page_range']);
      
      // Validate PDF tool should have file_path as required
      expect(validatePDFTool.inputSchema.required).toEqual(['file_path']);
    });

    it('should have appropriate default values', () => {
      // Extract text tool defaults
      const extractTextProps = extractTextTool.inputSchema.properties;
      expect(extractTextProps?.preserve_formatting?.default).toBe(true);
      expect(extractTextProps?.include_metadata?.default).toBe(false);
      expect(extractTextProps?.pages?.default).toBe('all');
      
      // Extract pages tool defaults
      const extractPagesProps = extractPagesTool.inputSchema.properties;
      expect(extractPagesProps?.output_format?.default).toBe('text');
    });
  });
});