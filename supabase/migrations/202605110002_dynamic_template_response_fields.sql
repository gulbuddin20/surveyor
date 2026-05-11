alter table surveyor.survey_responses
  add column if not exists response_values jsonb not null default '{}'::jsonb;

alter table surveyor.survey_photos
  add column if not exists field_key text;

create table if not exists surveyor.template_response_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references surveyor.survey_templates(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null default 'textarea' check (field_type in ('text', 'textarea', 'number', 'date', 'time', 'select', 'photo')),
  placeholder text,
  options jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  is_required boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id, field_key)
);

create index if not exists template_response_fields_template_sort_idx
  on surveyor.template_response_fields(template_id, sort_order);

create index if not exists survey_photos_response_field_key_idx
  on surveyor.survey_photos(response_id, field_key);

drop trigger if exists template_response_fields_updated_at on surveyor.template_response_fields;
create trigger template_response_fields_updated_at
  before update on surveyor.template_response_fields
  for each row execute function surveyor.set_updated_at();

alter table surveyor.template_response_fields enable row level security;

drop policy if exists "response fields read with templates" on surveyor.template_response_fields;
create policy "response fields read with templates"
  on surveyor.template_response_fields
  for select
  using (
    is_active
    and exists (
      select 1
      from surveyor.survey_templates t
      where t.id = template_id
        and (t.status = 'active' or surveyor.is_super_admin())
    )
  );

drop policy if exists "response fields admin manage" on surveyor.template_response_fields;
create policy "response fields admin manage"
  on surveyor.template_response_fields
  for all
  using (surveyor.is_super_admin())
  with check (surveyor.is_super_admin());

grant select on surveyor.template_response_fields to anon;
grant select, insert, update, delete on surveyor.template_response_fields to authenticated, service_role;

grant usage, select on all sequences in schema surveyor to authenticated, service_role;

update surveyor.survey_responses
set response_values = response_values
  || case when notes is not null and notes <> '' then jsonb_build_object('notes', notes) else '{}'::jsonb end
  || case when recommendation_notes is not null and recommendation_notes <> '' then jsonb_build_object('recommendation_notes', recommendation_notes) else '{}'::jsonb end
where response_values = '{}'::jsonb
  and ((notes is not null and notes <> '') or (recommendation_notes is not null and recommendation_notes <> ''));

insert into surveyor.template_response_fields (template_id, field_key, label, field_type, placeholder, is_required, sort_order)
select id, field_key, label, field_type, placeholder, is_required, sort_order
from surveyor.survey_templates
cross join (
  values
    ('evidence_photos', 'Foto bukti', 'photo', 'Upload foto bukti kunjungan', false, 10),
    ('notes', 'Catatan / kritik / saran', 'textarea', 'Catatan temuan, kritik, atau saran pembinaan', false, 20),
    ('recommendation_notes', 'Rekomendasi tindak lanjut', 'textarea', 'Contoh: perbaiki fasilitas cuci tangan, lengkapi APD', false, 30),
    ('photo_caption', 'Keterangan foto', 'textarea', 'Keterangan umum untuk foto bukti', false, 40)
) as defaults(field_key, label, field_type, placeholder, is_required, sort_order)
on conflict (template_id, field_key) do nothing;
