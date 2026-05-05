alter table surveyor.survey_templates
  add column if not exists photo_max_size_mb integer not null default 10;

alter table surveyor.survey_responses
  add column if not exists recommendation_notes text;

alter table surveyor.survey_photos
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint;

create table if not exists surveyor.template_identity_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references surveyor.survey_templates(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null default 'text' check (field_type in ('text', 'textarea', 'number', 'date', 'time', 'select')),
  placeholder text,
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id, field_key)
);

create index if not exists template_identity_fields_template_sort_idx
  on surveyor.template_identity_fields(template_id, sort_order);

drop trigger if exists template_identity_fields_updated_at on surveyor.template_identity_fields;
create trigger template_identity_fields_updated_at
  before update on surveyor.template_identity_fields
  for each row execute function surveyor.set_updated_at();

alter table surveyor.template_identity_fields enable row level security;

drop policy if exists "identity fields read with templates" on surveyor.template_identity_fields;
create policy "identity fields read with templates"
  on surveyor.template_identity_fields
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

drop policy if exists "identity fields admin manage" on surveyor.template_identity_fields;
create policy "identity fields admin manage"
  on surveyor.template_identity_fields
  for all
  using (surveyor.is_super_admin())
  with check (surveyor.is_super_admin());

drop policy if exists "photos update response owner or admin" on surveyor.survey_photos;
create policy "photos update response owner or admin"
  on surveyor.survey_photos
  for update
  using (
    exists (
      select 1
      from surveyor.survey_responses r
      where r.id = response_id
        and (r.surveyor_id = auth.uid() or surveyor.is_super_admin())
    )
  )
  with check (
    exists (
      select 1
      from surveyor.survey_responses r
      where r.id = response_id
        and (r.surveyor_id = auth.uid() or surveyor.is_super_admin())
    )
  );

drop policy if exists "photos delete response owner or admin" on surveyor.survey_photos;
create policy "photos delete response owner or admin"
  on surveyor.survey_photos
  for delete
  using (
    exists (
      select 1
      from surveyor.survey_responses r
      where r.id = response_id
        and (r.surveyor_id = auth.uid() or surveyor.is_super_admin())
    )
  );

insert into surveyor.template_identity_fields (template_id, field_key, label, field_type, placeholder, is_required, sort_order)
select id, field_key, label, field_type, placeholder, is_required, sort_order
from surveyor.survey_templates
cross join (
  values
    ('business_name', 'Nama usaha', 'text', 'Nama UMKM/TPP', true, 10),
    ('nib', 'NIB', 'text', 'Nomor Induk Berusaha', false, 20),
    ('address', 'Alamat', 'textarea', 'Alamat lengkap lokasi usaha', false, 30),
    ('owner_name', 'Nama pengelola/pemilik/penanggung jawab', 'text', 'Nama penanggung jawab', false, 40),
    ('phone', 'Nomor handphone', 'text', '08xxxxxxxxxx', false, 50),
    ('inspector_name', 'Nama pemeriksa', 'text', 'Nama petugas pemeriksa', false, 60),
    ('inspection_date', 'Tanggal penilaian', 'date', null, false, 70),
    ('high_risk_menu', 'Menu pangan berisiko yang dijual', 'textarea', 'Contoh: daging, ikan, santan, es', false, 80)
) as defaults(field_key, label, field_type, placeholder, is_required, sort_order)
on conflict (template_id, field_key) do nothing;

insert into surveyor.template_identity_fields (template_id, field_key, label, field_type, placeholder, is_required, sort_order)
select id, 'vehicle_plate', 'Nomor Polisi Kendaraan', 'text', 'Nomor polisi kendaraan food truck', false, 90
from surveyor.survey_templates
where code ilike '%food%' or name ilike '%truck%' or name ilike '%keliling%'
on conflict (template_id, field_key) do nothing;

insert into surveyor.template_identity_fields (template_id, field_key, label, field_type, placeholder, is_required, sort_order)
select id, 'selling_route', 'Waktu/rute berjualan', 'textarea', 'Jam dan rute/lokasi berjualan', false, 100
from surveyor.survey_templates
where code ilike '%food%' or name ilike '%truck%' or name ilike '%keliling%'
on conflict (template_id, field_key) do nothing;

insert into surveyor.audit_logs (actor_id, action, entity_type, metadata)
values (
  auth.uid(),
  'schema_migration',
  'template_identity_fields',
  '{"migration":"202605030001_survey_form_fields_uploads_pdf","adds":["template_identity_fields","survey_templates.photo_max_size_mb","survey_responses.recommendation_notes","survey_photos.file_metadata"]}'::jsonb
);
