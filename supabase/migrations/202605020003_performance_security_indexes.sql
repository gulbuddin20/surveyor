create index if not exists survey_templates_status_name_idx
  on surveyor.survey_templates(status, name);

create index if not exists audit_logs_actor_idx
  on surveyor.audit_logs(actor_id);

create index if not exists question_options_question_sort_idx
  on surveyor.question_options(question_id, sort_order);

create index if not exists survey_questions_template_active_sort_idx
  on surveyor.survey_questions(template_id, is_active, sort_order);

create unique index if not exists survey_sections_template_id_idx
  on surveyor.survey_sections(template_id, id);

create index if not exists survey_questions_section_sort_idx
  on surveyor.survey_questions(section_id, sort_order);

create index if not exists formula_rules_template_active_idx
  on surveyor.formula_rules(template_id, is_active);

create index if not exists survey_responses_template_idx
  on surveyor.survey_responses(template_id);

create index if not exists survey_responses_subject_idx
  on surveyor.survey_responses(subject_id);

create index if not exists survey_responses_surveyor_created_idx
  on surveyor.survey_responses(surveyor_id, created_at desc);

create index if not exists survey_responses_status_score_idx
  on surveyor.survey_responses(status, score);

create index if not exists msme_subjects_owner_idx
  on surveyor.msme_subjects(owner_id);

create index if not exists survey_answers_response_idx
  on surveyor.survey_answers(response_id);

create index if not exists survey_answers_question_idx
  on surveyor.survey_answers(question_id);

create index if not exists survey_photos_response_idx
  on surveyor.survey_photos(response_id);

create index if not exists survey_photos_question_idx
  on surveyor.survey_photos(question_id);

create or replace function surveyor.set_updated_at()
returns trigger
language plpgsql
set search_path = surveyor, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table surveyor.survey_questions
  add constraint survey_questions_template_section_match
  foreign key (template_id, section_id)
  references surveyor.survey_sections(template_id, id)
  on delete set null (section_id);

insert into surveyor.audit_logs(action, entity_type, metadata)
values (
  'schema_migration',
  'performance_indexes',
  '{"migration":"202605020003_performance_security_indexes","adds":["template/status indexes","response owner indexes","question section integrity"]}'::jsonb
);
