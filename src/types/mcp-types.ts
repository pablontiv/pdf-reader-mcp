import { z } from 'zod';

const filePathValidation = z.string()
  .min(1, "File path is required")
  .refine((path) => path.trim().length > 0, "File path cannot be empty or whitespace only");

export const ExtractTextParamsSchema = z.object({
  file_path: filePathValidation,
  pages: z.string().default('all'),
  preserve_formatting: z.boolean().default(true),
  include_metadata: z.boolean().default(false)
});

export const ExtractMetadataParamsSchema = z.object({
  file_path: filePathValidation
});

export const ExtractPagesParamsSchema = z.object({
  file_path: filePathValidation,
  page_range: z.string().min(1, "Page range is required"),
  output_format: z.enum(["text", "structured"]).default("text")
});

export const ValidatePDFParamsSchema = z.object({
  file_path: filePathValidation
});

export type ExtractTextParamsType = z.infer<typeof ExtractTextParamsSchema>;
export type ExtractMetadataParamsType = z.infer<typeof ExtractMetadataParamsSchema>;
export type ExtractPagesParamsType = z.infer<typeof ExtractPagesParamsSchema>;
export type ValidatePDFParamsType = z.infer<typeof ValidatePDFParamsSchema>;