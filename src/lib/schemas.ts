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
  photoMaxSizeMb: z.coerce.number().int().min(1).max(25).default(10),
  status: z.enum(["draft", "active", "archived"]),
});

export const identityFieldSchema = z.object({
  templateId: z.uuid(),
  fieldId: z.uuid().optional(),
  fieldKey: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9_]+$/, "Kunci field hanya boleh huruf kecil, angka, dan underscore"),
  label: z.string().min(2).max(160),
  fieldType: z.enum(["text", "textarea", "number", "date", "time", "select"]),
  placeholder: z.string().max(160).optional(),
  optionsText: z.string().max(1000).optional(),
  isRequired: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const responseFieldSchema = z.object({
  templateId: z.uuid(),
  fieldId: z.uuid().optional(),
  fieldKey: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9_]+$/, "Kunci field hanya boleh huruf kecil, angka, dan underscore"),
  label: z.string().min(2).max(160),
  fieldType: z.enum(["text", "textarea", "number", "date", "time", "select", "photo"]),
  placeholder: z.string().max(160).optional(),
  optionsText: z.string().max(1000).optional(),
  maxSizeMb: z.coerce.number().int().min(1).max(25).optional(),
  isRequired: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const sectionSchema = z.object({
  templateId: z.uuid(),
  sectionId: z.uuid().optional(),
  parentId: z.uuid().optional(),
  title: z.string().min(2).max(240),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const questionSchema = z.object({
  templateId: z.uuid(),
  questionId: z.uuid().optional(),
  sectionId: z.uuid().optional(),
  label: z.string().min(3).max(1200),
  helpText: z.string().max(1200).optional(),
  questionType: z.enum(["text", "textarea", "number", "select", "multiselect", "radio", "checkbox", "photo"]),
  weight: z.coerce.number().min(0),
  isRequired: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
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

export const templateSettingsSchema = z.object({
  templateId: z.uuid(),
  photoMaxSizeMb: z.coerce.number().int().min(1).max(25),
});

export const templateReorderSchema = z.object({
  templateId: z.uuid(),
  parentId: z.uuid().nullable().optional(),
  sectionId: z.uuid().nullable().optional(),
  orderedIds: z.array(z.uuid()).min(1),
});

export const surveySubmissionSchema = z.object({
  templateId: z.uuid(),
  responseId: z.uuid().optional(),
  businessName: z.string().max(160).optional(),
  ownerName: z.string().max(160).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(40).optional(),
  identityValues: z.record(z.string(), z.string().max(1000)).default({}),
  responseValues: z.record(z.string(), z.string().max(2000)).default({}),
  nonconformities: z.array(z.uuid()).default([]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type IdentityFieldInput = z.infer<typeof identityFieldSchema>;
export type ResponseFieldInput = z.infer<typeof responseFieldSchema>;
export type TemplateSettingsInput = z.infer<typeof templateSettingsSchema>;
export type TemplateReorderInput = z.infer<typeof templateReorderSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type FormulaInput = z.infer<typeof formulaSchema>;
export type SurveySubmissionInput = z.infer<typeof surveySubmissionSchema>;
