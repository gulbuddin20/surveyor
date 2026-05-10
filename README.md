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

The migration files are in:

```bash
supabase/migrations/
```

Run them in timestamp order for every self-hosted Supabase environment:

1. `202605010001_create_surveyor_schema.sql`
2. `202605010002_seed_ikl_templates.sql`
3. `202605020001_nested_questionnaire_admin.sql`
4. `202605020002_seed_full_ikl_questionnaires.sql`
5. `202605030001_survey_form_fields_uploads_pdf.sql`

They create:

- `surveyor` schema
- profiles, survey templates, sections, questions, formula rules, MSME subjects, responses, answers, photos, audit logs
- role-aware RLS policies
- private `survey-evidence` storage bucket and policies
- editable template identity fields, upload settings, recommendation notes, and photo metadata
- seed templates from the attached IKL PDFs using OCR extraction

### Self-hosted Supabase

Use the same ordered migration set for both dev and prod.

With Supabase CLI, copy this project into the machine that can reach your self-hosted database, configure `supabase/config.toml` for that instance, then run:

```bash
supabase db push
```

Without Supabase CLI, open your self-hosted Supabase Studio SQL Editor and execute each SQL file in order. If you prefer direct Postgres access, run each file with `psql` against the self-hosted database connection string.

After applying the SQL, make sure PostgREST can access the custom schema by exposing `surveyor` in the API schema list, then reload/restart the Supabase API/PostgREST service.

## Architecture

Strict SoC layout:

- `repositories`: Supabase data access only
- `services`: domain logic and validation bridge
- `controllers`: server action/page data orchestration
- route parents inject controller data into child components
- child components receive props only and avoid business logic

## Notes

The attached PDFs are scanned/image-based. OCR text was extracted into `extracted-ocr/`, but regulatory criteria should be reviewed in the admin editor before production use.
