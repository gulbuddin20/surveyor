create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists surveyor;

create type surveyor.user_role as enum ('super_admin', 'regular_user');
create type surveyor.question_type as enum ('text', 'textarea', 'number', 'select', 'multiselect', 'radio', 'checkbox', 'photo');
create type surveyor.template_status as enum ('draft', 'active', 'archived');
create type surveyor.response_status as enum ('draft', 'submitted');

create table if not exists surveyor.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role surveyor.user_role not null default 'regular_user',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists surveyor.survey_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  status surveyor.template_status not null default 'draft',
  denominator numeric(10,2) not null default 100,
  passing_score numeric(5,2) not null default 80,
  source_document text,
  created_by uuid references surveyor.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists surveyor.survey_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references surveyor.survey_templates(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(template_id, title)
);

create table if not exists surveyor.survey_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references surveyor.survey_templates(id) on delete cascade,
  section_id uuid references surveyor.survey_sections(id) on delete set null,
  label text not null,
  help_text text,
  question_type surveyor.question_type not null default 'checkbox',
  weight numeric(8,2) not null default 1,
  is_required boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists surveyor.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references surveyor.survey_questions(id) on delete cascade,
  label text not null,
  value text not null,
  sort_order integer not null default 0
);

create table if not exists surveyor.formula_rules (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references surveyor.survey_templates(id) on delete cascade,
  name text not null default 'Skor Total Inspeksi',
  expression text not null default '100 - ((total_nonconformity / denominator) * 100)',
  denominator numeric(10,2) not null default 100,
  passing_score numeric(5,2) not null default 80,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id, name)
);

create table if not exists surveyor.msme_subjects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references surveyor.profiles(id),
  business_name text not null,
  owner_name text,
  address text,
  business_type text,
  phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists surveyor.survey_responses (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references surveyor.survey_templates(id),
  subject_id uuid not null references surveyor.msme_subjects(id) on delete cascade,
  surveyor_id uuid not null references surveyor.profiles(id),
  status surveyor.response_status not null default 'draft',
  total_nonconformity numeric(10,2) not null default 0,
  score numeric(5,2) not null default 100,
  result_label text not null default 'Memenuhi syarat',
  notes text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists surveyor.survey_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references surveyor.survey_responses(id) on delete cascade,
  question_id uuid not null references surveyor.survey_questions(id),
  is_nonconforming boolean not null default true,
  value jsonb not null default '{}'::jsonb,
  score numeric(8,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique(response_id, question_id)
);

create table if not exists surveyor.survey_photos (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references surveyor.survey_responses(id) on delete cascade,
  question_id uuid references surveyor.survey_questions(id) on delete set null,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists surveyor.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references surveyor.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function surveyor.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function surveyor.current_user_role()
returns surveyor.user_role language sql stable security definer set search_path = surveyor, public as $$
  select coalesce(
    (select role from surveyor.profiles where id = auth.uid()),
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', '')::surveyor.user_role,
    'regular_user'::surveyor.user_role
  );
$$;

create or replace function surveyor.is_super_admin()
returns boolean language sql stable security definer set search_path = surveyor, public as $$
  select surveyor.current_user_role() = 'super_admin'::surveyor.user_role;
$$;

create or replace function surveyor.handle_new_user()
returns trigger language plpgsql security definer set search_path = surveyor, public as $$
begin
  insert into surveyor.profiles(id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'role', '')::surveyor.user_role, 'regular_user'::surveyor.user_role)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function surveyor.handle_new_user();

create trigger profiles_updated_at before update on surveyor.profiles for each row execute function surveyor.set_updated_at();
create trigger survey_templates_updated_at before update on surveyor.survey_templates for each row execute function surveyor.set_updated_at();
create trigger formula_rules_updated_at before update on surveyor.formula_rules for each row execute function surveyor.set_updated_at();
create trigger msme_subjects_updated_at before update on surveyor.msme_subjects for each row execute function surveyor.set_updated_at();
create trigger survey_responses_updated_at before update on surveyor.survey_responses for each row execute function surveyor.set_updated_at();

alter table surveyor.profiles enable row level security;
alter table surveyor.survey_templates enable row level security;
alter table surveyor.survey_sections enable row level security;
alter table surveyor.survey_questions enable row level security;
alter table surveyor.question_options enable row level security;
alter table surveyor.formula_rules enable row level security;
alter table surveyor.msme_subjects enable row level security;
alter table surveyor.survey_responses enable row level security;
alter table surveyor.survey_answers enable row level security;
alter table surveyor.survey_photos enable row level security;
alter table surveyor.audit_logs enable row level security;

create policy "profiles read own or admin" on surveyor.profiles for select using (id = auth.uid() or surveyor.is_super_admin());
create policy "profiles admin insert" on surveyor.profiles for insert with check (surveyor.is_super_admin());
create policy "profiles update own or admin" on surveyor.profiles for update using (id = auth.uid() or surveyor.is_super_admin()) with check (id = auth.uid() or surveyor.is_super_admin());
create policy "profiles admin delete" on surveyor.profiles for delete using (surveyor.is_super_admin());

create policy "templates read active authenticated" on surveyor.survey_templates for select using (status = 'active' or surveyor.is_super_admin());
create policy "templates admin manage" on surveyor.survey_templates for all using (surveyor.is_super_admin()) with check (surveyor.is_super_admin());
create policy "sections read with templates" on surveyor.survey_sections for select using (exists (select 1 from surveyor.survey_templates t where t.id = template_id and (t.status = 'active' or surveyor.is_super_admin())));
create policy "sections admin manage" on surveyor.survey_sections for all using (surveyor.is_super_admin()) with check (surveyor.is_super_admin());
create policy "questions read with templates" on surveyor.survey_questions for select using (is_active and exists (select 1 from surveyor.survey_templates t where t.id = template_id and (t.status = 'active' or surveyor.is_super_admin())));
create policy "questions admin manage" on surveyor.survey_questions for all using (surveyor.is_super_admin()) with check (surveyor.is_super_admin());
create policy "options read with questions" on surveyor.question_options for select using (exists (select 1 from surveyor.survey_questions q join surveyor.survey_templates t on t.id = q.template_id where q.id = question_id and (t.status = 'active' or surveyor.is_super_admin())));
create policy "options admin manage" on surveyor.question_options for all using (surveyor.is_super_admin()) with check (surveyor.is_super_admin());
create policy "formulas read with templates" on surveyor.formula_rules for select using (is_active and exists (select 1 from surveyor.survey_templates t where t.id = template_id and (t.status = 'active' or surveyor.is_super_admin())));
create policy "formulas admin manage" on surveyor.formula_rules for all using (surveyor.is_super_admin()) with check (surveyor.is_super_admin());

create policy "subjects read own or admin" on surveyor.msme_subjects for select using (owner_id = auth.uid() or surveyor.is_super_admin());
create policy "subjects insert own" on surveyor.msme_subjects for insert with check (owner_id = auth.uid() or surveyor.is_super_admin());
create policy "subjects update own or admin" on surveyor.msme_subjects for update using (owner_id = auth.uid() or surveyor.is_super_admin()) with check (owner_id = auth.uid() or surveyor.is_super_admin());
create policy "subjects delete own or admin" on surveyor.msme_subjects for delete using (owner_id = auth.uid() or surveyor.is_super_admin());

create policy "responses read own or admin" on surveyor.survey_responses for select using (surveyor_id = auth.uid() or surveyor.is_super_admin());
create policy "responses insert own" on surveyor.survey_responses for insert with check (surveyor_id = auth.uid() or surveyor.is_super_admin());
create policy "responses update own or admin" on surveyor.survey_responses for update using (surveyor_id = auth.uid() or surveyor.is_super_admin()) with check (surveyor_id = auth.uid() or surveyor.is_super_admin());
create policy "responses delete own or admin" on surveyor.survey_responses for delete using (surveyor_id = auth.uid() or surveyor.is_super_admin());
create policy "answers read response owner or admin" on surveyor.survey_answers for select using (exists (select 1 from surveyor.survey_responses r where r.id = response_id and (r.surveyor_id = auth.uid() or surveyor.is_super_admin())));
create policy "answers insert response owner or admin" on surveyor.survey_answers for insert with check (exists (select 1 from surveyor.survey_responses r where r.id = response_id and (r.surveyor_id = auth.uid() or surveyor.is_super_admin())));
create policy "answers update response owner or admin" on surveyor.survey_answers for update using (exists (select 1 from surveyor.survey_responses r where r.id = response_id and (r.surveyor_id = auth.uid() or surveyor.is_super_admin()))) with check (exists (select 1 from surveyor.survey_responses r where r.id = response_id and (r.surveyor_id = auth.uid() or surveyor.is_super_admin())));
create policy "answers delete response owner or admin" on surveyor.survey_answers for delete using (exists (select 1 from surveyor.survey_responses r where r.id = response_id and (r.surveyor_id = auth.uid() or surveyor.is_super_admin())));
create policy "photos read response owner or admin" on surveyor.survey_photos for select using (exists (select 1 from surveyor.survey_responses r where r.id = response_id and (r.surveyor_id = auth.uid() or surveyor.is_super_admin())));
create policy "photos insert response owner or admin" on surveyor.survey_photos for insert with check (exists (select 1 from surveyor.survey_responses r where r.id = response_id and (r.surveyor_id = auth.uid() or surveyor.is_super_admin())));
create policy "audit admin read" on surveyor.audit_logs for select using (surveyor.is_super_admin());
create policy "audit authenticated insert" on surveyor.audit_logs for insert with check (actor_id = auth.uid() or surveyor.is_super_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('survey-evidence', 'survey-evidence', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'survey evidence read own or admin') then
    create policy "survey evidence read own or admin" on storage.objects for select using (bucket_id = 'survey-evidence' and (split_part(name, '/', 1) = auth.uid()::text or surveyor.is_super_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'survey evidence upload own') then
    create policy "survey evidence upload own" on storage.objects for insert with check (bucket_id = 'survey-evidence' and (split_part(name, '/', 1) = auth.uid()::text or surveyor.is_super_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'survey evidence update own or admin') then
    create policy "survey evidence update own or admin" on storage.objects for update using (bucket_id = 'survey-evidence' and (split_part(name, '/', 1) = auth.uid()::text or surveyor.is_super_admin())) with check (bucket_id = 'survey-evidence' and (split_part(name, '/', 1) = auth.uid()::text or surveyor.is_super_admin()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'survey evidence delete own or admin') then
    create policy "survey evidence delete own or admin" on storage.objects for delete using (bucket_id = 'survey-evidence' and (split_part(name, '/', 1) = auth.uid()::text or surveyor.is_super_admin()));
  end if;
end;
$$;
