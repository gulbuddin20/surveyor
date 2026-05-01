# Surveyor IKL

Next.js 16.2.4 SSR application for paperless IKL surveys using Supabase.

## Stack

- Next.js App Router, SSR-first Server Components and Server Actions
- Tailwind CSS 4.2
- shadcn-style Radix UI primitives
- Zod validation
- Zustand for client-only survey wizard state
- Supabase SSR Auth, dedicated `surveyor` schema, RLS policies, storage bucket

## Setup

```bash
npm install
cp .env.example .env.local
npm run lint
npm run build
npm run dev
```

Required env:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://epbcuinnfignkqjejkrx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_... # server/admin only
```

## Database

The copyable migration is in:

```bash
supabase/migrations/202605010001_create_surveyor_schema.sql
```

It creates:

- `surveyor` schema
- profiles, survey templates, sections, questions, formula rules, MSME subjects, responses, answers, photos, audit logs
- role-aware RLS policies
- private `survey-evidence` storage bucket and policies
- seed templates from the attached IKL PDFs using OCR extraction

Apply with Supabase CLI or SQL Editor:

```bash
supabase db push --project-ref epbcuinnfignkqjejkrx
```

## Architecture

Strict SoC layout:

- `repositories`: Supabase data access only
- `services`: domain logic and validation bridge
- `controllers`: server action/page data orchestration
- route parents inject controller data into child components
- child components receive props only and avoid business logic

## Notes

The attached PDFs are scanned/image-based. OCR text was extracted into `extracted-ocr/`, but regulatory criteria should be reviewed in the admin editor before production use.
