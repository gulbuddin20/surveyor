# Surveyor Web App Build Plan

## Target stack
- Next.js 16.2.4 App Router, SSR-first pages, Server Actions for mutations.
- React 19, TypeScript strict mode.
- Tailwind CSS 4.2.4 with shadcn/ui components.
- Zod validation for all forms/actions.
- Zustand for client UI state only; business/data state stays in server controllers.
- Supabase project: `epbcuinnfignkqjejkrx`, dedicated schema `surveyor`, RLS enabled.

## Architecture / strict SoC
- `src/modules/*/repositories`: direct Supabase DB access only.
- `src/modules/*/services`: domain logic, formula evaluation, validation bridge.
- `src/modules/*/controllers`: page-ready data orchestration and server actions.
- Parent route components call controllers and inject props.
- Child components are props-only UI, no business logic, kept under 300 LOC.
- Zustand stores handle sidebar/wizard/form-draft UI state, not DB fetching.

## Database plan
- Create schema `surveyor` for app tables and enum types.
- Tables: profiles, survey_templates, survey_sections, survey_questions, question_options, formula_rules, msme_subjects, survey_responses, survey_answers, survey_photos, audit_logs.
- RLS policies:
  - Super admin can manage users, templates, formulas, all survey data.
  - Regular users can read active templates and manage only their own survey responses/photos.
- Storage bucket `survey-evidence` for proof photos, with owner-based access policies.
- Seed initial templates for the 8 attached IKL form types. PDFs are scanned/image-based, so OCR/manual extraction will be attempted; if extraction is incomplete, templates will be loaded with the form categories and editable placeholders rather than hard-coded guesses.

## Product scope
- Auth/login flow.
- Role-aware dashboards.
- Super admin: regular user CRUD, survey template/question CRUD, formula rule editor.
- Regular user: mobile-friendly survey wizard, only records non-compliant/not-met items, photo proof upload, save + calculation result screen.
- Responsive minimal UI optimized for field survey use.

## Validation
- Run lint, TypeScript check, and production build.
- If possible, run the local app and verify golden-path pages.

## Deliverable
- Local Next.js project in `/home/ubuntu/surveyor`.
- Supabase schema/migrations SQL in the project so it can be copied to self-hosted Supabase.
- If a git remote is available later, create a PR; otherwise provide the app path/package and summary.
