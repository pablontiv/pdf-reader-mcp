import { z } from 'zod';

export const ExtractTextParamsSchema = z.object({
  file_path: z.string().min(1, "File path is required"),
  pages: z.string().default('all'),
  preserve_formatting: z.boolean().default(true),
  include_metadata: z.boolean().default(false)
});

export const ExtractMetadataParamsSchema = z.object({
  file_path: z.string().min(1, "File path is required")
});

export const ExtractPagesParamsSchema = z.object({
  file_path: z.string().min(1, "File path is required"),
  page_range: z.string().min(1, "Page range is required"),
  output_format: z.enum(["text", "structured"]).default("text")
});

export const ValidatePDFParamsSchema = z.object({
  file_path: z.string().min(1, "File path is required")
});

export type ExtractTextParamsType = z.infer<typeof ExtractTextParamsSchema>;
export type ExtractMetadataParamsType = z.infer<typeof ExtractMetadataParamsSchema>;
export type ExtractPagesParamsType = z.infer<typeof ExtractPagesParamsSchema>;
export type ValidatePDFParamsType = z.infer<typeof ValidatePDFParamsSchema>;