alter table surveyor.survey_sections
  add column if not exists parent_id uuid references surveyor.survey_sections(id) on delete cascade,
  add column if not exists is_active boolean not null default true;

alter table surveyor.survey_questions
  add column if not exists seed_key text;

create index if not exists survey_sections_template_parent_sort_idx
  on surveyor.survey_sections(template_id, parent_id, sort_order);

create unique index if not exists survey_questions_template_seed_key_idx
  on surveyor.survey_questions(template_id, seed_key)
  where seed_key is not null;

drop policy if exists "sections read with templates" on surveyor.survey_sections;
create policy "sections read with templates" on surveyor.survey_sections for select using (
  is_active
  and exists (
    select 1
    from surveyor.survey_templates t
    where t.id = template_id
      and (t.status = 'active' or surveyor.is_super_admin())
  )
);

insert into surveyor.audit_logs(action, entity_type, metadata)
values (
  'schema_migration',
  'survey_sections',
  '{"migration":"202605020001_nested_questionnaire_admin","adds":["survey_sections.parent_id","survey_sections.is_active","survey_questions.seed_key"]}'::jsonb
);
