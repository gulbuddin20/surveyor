alter table surveyor.template_response_fields
  drop constraint if exists template_response_fields_field_type_check;

alter table surveyor.template_response_fields
  add constraint template_response_fields_field_type_check
  check (field_type in ('text', 'textarea', 'number', 'date', 'time', 'select', 'photo', 'signature'));
