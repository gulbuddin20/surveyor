# Surveyor IKL — E2E Testing Skill

## Overview

This skill covers end-to-end runtime testing of the Surveyor IKL web application, a Next.js SSR app backed by Supabase with a `surveyor` custom schema.

## Devin Secrets Needed

- `SUPABASE_URL` — Supabase project URL (e.g. `https://epbcuinnfignkqjejkrx.supabase.co`)
- `SUPABASE_ANON_KEY` — Supabase anon/public key for the project
- Test account credentials stored as Devin secrets (do NOT hardcode in skill)

## Setup

1. Clone the repo and install dependencies:
   ```bash
   cd /home/ubuntu/surveyor-app
   npm install
   ```
2. Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Verify `http://localhost:3000` loads the login page.
5. Log in with the test account (super_admin role).

## Test Account

- A dedicated E2E test account with `super_admin` role should exist in the `surveyor.profiles` table.
- Use Devin secrets for credentials — never hardcode passwords in plans or reports.

## Testing Flows

### Admin Questionnaire CRUD

1. Navigate to `/admin/templates`.
2. Create a test template with a distinctive prefix (e.g. `PR<N> E2E`).
3. Add a root section, then a subsection (via parent_id dropdown).
4. Add questions with specific weights under the subsection.
5. Edit section titles and question weights — verify persistence.
6. Delete questions and sections — verify counts update.
7. **Always clean up** test data after testing by deleting items in reverse order (questions → subsections → root sections).

### Survey Form Rendering

1. Navigate to `/surveys/new` and select the test template.
2. Verify nested section headings render in correct hierarchy.
3. Check questions display weight as "Nilai ketidaksesuaian: N".
4. Toggle checkboxes and verify real-time score panel updates.

### Score Calculation Caveat

- The score formula reads `denominator` from the `formula_rules` table, NOT from `survey_templates.denominator`.
- If no `formula_rules` row exists for a template, the fallback denominator is `100`.
- When testing a new template, either create a matching `formula_rules` row or expect the fallback behavior.
- Expected formula: `Score = 100 - (totalNonconformity / denominator) * 100`

### Responsive / Logout Placement

1. Desktop (1280px): Verify "Keluar" button in top-right navbar, sidebar footer shows only collapse control.
2. Mobile (390px): Resize with `xdotool getactivewindow windowmove 0 0 windowsize 390 844`. Verify hamburger opens drawer, "Keluar" is reachable in navbar.
3. Restore desktop size after mobile testing: `xdotool getactivewindow windowmove 0 0 windowsize 1280 900`.

## Tips

- The `surveyor` schema must be exposed to the Supabase Data API (`PGRST` config). If queries return empty results, check that `ALTER ROLE authenticator SET pgrst.db_schemas = 'public, surveyor'` has been applied and PostgREST has been reloaded.
- Use browser recording with `annotate_recording` tool for visual proof of UI interactions.
- Prefix all test data with a session-specific tag (e.g. `PR5 E2E`) to make cleanup easy and avoid collisions.
- HTML5 form validation enforces required fields (e.g. question label textarea) — fill all required fields before submitting.
- The sidebar parent dropdown uses native `<select>` — use keyboard navigation (ArrowDown + Return) if click selection is unreliable.
