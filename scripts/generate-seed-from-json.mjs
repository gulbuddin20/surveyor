import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const templatesPath = path.join(root, "src/data/initial-survey-templates.json");
const migrationPath = path.join(root, "supabase/migrations/202605020002_seed_full_ikl_questionnaires.sql");
const templates = JSON.parse(fs.readFileSync(templatesPath, "utf8"));
const payload = JSON.stringify(templates);

const sql = `do $$
declare
  template jsonb;
  section_payload jsonb;
  question_payload jsonb;
  template_id uuid;
  section_id uuid;
  section_index integer;
  payload jsonb := ${sqlString(payload)}::jsonb;
begin
  for template in select * from jsonb_array_elements(payload)
  loop
    insert into surveyor.survey_templates(code, name, description, status, denominator, passing_score, source_document)
    values (
      template ->> 'code',
      template ->> 'name',
      template ->> 'description',
      'active',
      (template ->> 'denominator')::numeric,
      (template ->> 'passing_score')::numeric,
      'Permenkes 17 Tahun 2024 PDF/OCR questionnaire seed'
    )
    on conflict (code) do update set
      name = excluded.name,
      description = excluded.description,
      status = excluded.status,
      denominator = excluded.denominator,
      passing_score = excluded.passing_score,
      source_document = excluded.source_document,
      updated_at = now()
    returning id into template_id;

    insert into surveyor.formula_rules(template_id, name, expression, denominator, passing_score)
    values (
      template_id,
      'Skor Total Inspeksi',
      '100 - ((total_nonconformity / denominator) * 100)',
      (template ->> 'denominator')::numeric,
      (template ->> 'passing_score')::numeric
    )
    on conflict (template_id, name) do update set
      denominator = excluded.denominator,
      passing_score = excluded.passing_score,
      updated_at = now();

    update surveyor.survey_questions
    set is_active = false
    where surveyor.survey_questions.template_id = template_id
      and seed_key is null
      and label ilike 'Kriteria inspeksi awal%';

    update surveyor.survey_sections
    set is_active = false
    where surveyor.survey_sections.template_id = template_id
      and title = 'Checklist IKL - OCR Seed (review admin)';

    section_index := 0;
    for section_payload in
      select distinct jsonb_build_object('title', coalesce(nullif(q ->> 'section', ''), 'Umum'))
      from jsonb_array_elements(template -> 'questions') q
    loop
      section_index := section_index + 1;
      insert into surveyor.survey_sections(template_id, parent_id, title, sort_order, is_active)
      values (template_id, null, section_payload ->> 'title', section_index, true)
      on conflict (template_id, title) do update set
        parent_id = excluded.parent_id,
        sort_order = excluded.sort_order,
        is_active = excluded.is_active
      returning id into section_id;
    end loop;

    for question_payload in select * from jsonb_array_elements(template -> 'questions')
    loop
      select id into section_id
      from surveyor.survey_sections
      where surveyor.survey_sections.template_id = template_id
        and title = coalesce(nullif(question_payload ->> 'section', ''), 'Umum')
      limit 1;

      insert into surveyor.survey_questions(
        template_id,
        section_id,
        label,
        help_text,
        question_type,
        weight,
        is_required,
        is_active,
        seed_key,
        sort_order
      )
      values (
        template_id,
        section_id,
        question_payload ->> 'label',
        nullif(question_payload ->> 'help_text', ''),
        coalesce(question_payload ->> 'question_type', 'checkbox')::surveyor.question_type,
        (question_payload ->> 'weight')::numeric,
        coalesce((question_payload ->> 'is_required')::boolean, false),
        coalesce((question_payload ->> 'is_active')::boolean, true),
        concat(template ->> 'code', ':', question_payload ->> 'sort_order'),
        (question_payload ->> 'sort_order')::integer
      )
      on conflict (template_id, seed_key) where seed_key is not null do update set
        section_id = excluded.section_id,
        label = excluded.label,
        help_text = excluded.help_text,
        question_type = excluded.question_type,
        weight = excluded.weight,
        is_required = excluded.is_required,
        is_active = excluded.is_active,
        sort_order = excluded.sort_order;
    end loop;
  end loop;
end;
$$;
`;

fs.writeFileSync(migrationPath, sql);

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}
