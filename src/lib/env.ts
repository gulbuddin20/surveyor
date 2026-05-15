import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().optional(),
  METADATA_API_URL: z.url().optional(),
  METADATA_API_KEY: z.string().optional(),
  METADATA_CF_ACCESS_CLIENT_ID: z.string().optional(),
  METADATA_CF_ACCESS_CLIENT_SECRET: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  METADATA_API_URL: process.env.METADATA_API_URL,
  METADATA_API_KEY: process.env.METADATA_API_KEY,
  METADATA_CF_ACCESS_CLIENT_ID: process.env.METADATA_CF_ACCESS_CLIENT_ID,
  METADATA_CF_ACCESS_CLIENT_SECRET: process.env.METADATA_CF_ACCESS_CLIENT_SECRET,
});
