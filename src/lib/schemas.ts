import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email tidak valid").trim(),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const userSchema = z.object({
  fullName: z.string().min(2, "Nama wajib diisi").max(120),
  email: z.email("Email tidak valid").trim(),
  password: z.string().min(8, "Password minimal 8 karakter").optional(),
  role: z.enum(["super_admin", "regular_user"]),
  isActive: z.coerce.boolean().default(true),
});

export const templateSchema = z.object({
  code: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(3).max(160),
  description: z.string().max(1000).default(""),
  denominator: z.coerce.number().positive(),
  passingScore: z.coerce.number().min(0).max(100),
  status: z.enum(["draft", "active", "archived"]),
});

export const formulaSchema = z.object({
  templateId: z.uuid(),
  denominator: z.coerce.number().positive(),
  passingScore: z.coerce.number().min(0).max(100),
  expression: z
    .string()
    .min(10)
    .max(240)
    .refine((value) => value.includes("total_nonconformity"), {
      message: "Formula harus memakai total_nonconformity",
    }),
});

export const surveySubmissionSchema = z.object({
  templateId: z.uuid(),
  businessName: z.string().min(2).max(160),
  ownerName: z.string().max(160).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(40).optional(),
  notes: z.string().max(1000).optional(),
  nonconformities: z.array(z.uuid()).default([]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type FormulaInput = z.infer<typeof formulaSchema>;
export type SurveySubmissionInput = z.infer<typeof surveySubmissionSchema>;
