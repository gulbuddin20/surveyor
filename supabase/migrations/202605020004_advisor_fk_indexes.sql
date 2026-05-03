create index if not exists survey_questions_template_section_idx
  on surveyor.survey_questions(template_id, section_id);

create index if not exists survey_sections_parent_idx
  on surveyor.survey_sections(parent_id);

create index if not exists survey_templates_created_by_idx
  on surveyor.survey_templates(created_by);

insert into surveyor.audit_logs(action, entity_type, metadata)
values (
  'schema_migration',
  'advisor_fk_indexes',
  '{"migration":"202605020004_advisor_fk_indexes","adds":["remaining advisor foreign-key indexes"]}'::jsonb
);
