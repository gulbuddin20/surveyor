create or replace function surveyor.require_super_admin()
returns void
language plpgsql
stable
security definer
set search_path = surveyor, public
as $$
begin
  if not surveyor.is_super_admin() then
    raise exception 'Super admin access required' using errcode = '42501';
  end if;
end;
$$;

create or replace function surveyor.reorder_template_identity_fields(
  p_template_id uuid,
  p_ordered_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = surveyor, public
as $$
declare
  updated_count integer;
begin
  perform surveyor.require_super_admin();

  update surveyor.template_identity_fields target
  set sort_order = ordered_items.sort_order
  from (
    select item_id, ordinal::integer * 10 as sort_order
    from unnest(p_ordered_ids) with ordinality as ordered(item_id, ordinal)
  ) ordered_items
  where target.id = ordered_items.item_id
    and target.template_id = p_template_id;

  get diagnostics updated_count = row_count;
  if updated_count <> coalesce(array_length(p_ordered_ids, 1), 0) then
    raise exception 'Invalid identity field reorder scope';
  end if;
end;
$$;

create or replace function surveyor.reorder_template_response_fields(
  p_template_id uuid,
  p_ordered_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = surveyor, public
as $$
declare
  updated_count integer;
begin
  perform surveyor.require_super_admin();

  update surveyor.template_response_fields target
  set sort_order = ordered_items.sort_order
  from (
    select item_id, ordinal::integer * 10 as sort_order
    from unnest(p_ordered_ids) with ordinality as ordered(item_id, ordinal)
  ) ordered_items
  where target.id = ordered_items.item_id
    and target.template_id = p_template_id;

  get diagnostics updated_count = row_count;
  if updated_count <> coalesce(array_length(p_ordered_ids, 1), 0) then
    raise exception 'Invalid response field reorder scope';
  end if;
end;
$$;

create or replace function surveyor.reorder_template_sections(
  p_template_id uuid,
  p_parent_id uuid,
  p_ordered_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = surveyor, public
as $$
declare
  updated_count integer;
begin
  perform surveyor.require_super_admin();

  update surveyor.survey_sections target
  set sort_order = ordered_items.sort_order
  from (
    select item_id, ordinal::integer * 10 as sort_order
    from unnest(p_ordered_ids) with ordinality as ordered(item_id, ordinal)
  ) ordered_items
  where target.id = ordered_items.item_id
    and target.template_id = p_template_id
    and target.parent_id is not distinct from p_parent_id;

  get diagnostics updated_count = row_count;
  if updated_count <> coalesce(array_length(p_ordered_ids, 1), 0) then
    raise exception 'Invalid section reorder scope';
  end if;
end;
$$;

create or replace function surveyor.reorder_template_section_parents(
  p_template_id uuid,
  p_sections jsonb
)
returns void
language plpgsql
security definer
set search_path = surveyor, public
as $$
declare
  updated_count integer;
  expected_count integer;
begin
  perform surveyor.require_super_admin();

  with scopes as (
    select
      nullif(scope_item ->> 'parentId', '')::uuid as parent_id,
      scope_item -> 'orderedIds' as ordered_ids
    from jsonb_array_elements(p_sections) as scope_item
  ),
  ordered_items as (
    select
      scopes.parent_id,
      ordered.value::uuid as item_id,
      ordered.ordinal::integer * 10 as sort_order
    from scopes
    cross join lateral jsonb_array_elements_text(scopes.ordered_ids) with ordinality as ordered(value, ordinal)
  )
  update surveyor.survey_sections target
  set
    parent_id = ordered_items.parent_id,
    sort_order = ordered_items.sort_order
  from ordered_items
  where target.id = ordered_items.item_id
    and target.template_id = p_template_id;

  get diagnostics updated_count = row_count;
  select count(*) into expected_count
  from jsonb_array_elements(p_sections) scope_item
  cross join lateral jsonb_array_elements_text(scope_item -> 'orderedIds');

  if updated_count <> expected_count then
    raise exception 'Invalid section parent reorder scope';
  end if;
end;
$$;

create or replace function surveyor.reorder_template_questions(
  p_template_id uuid,
  p_section_id uuid,
  p_ordered_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = surveyor, public
as $$
declare
  updated_count integer;
begin
  perform surveyor.require_super_admin();

  update surveyor.survey_questions target
  set sort_order = ordered_items.sort_order
  from (
    select item_id, ordinal::integer * 10 as sort_order
    from unnest(p_ordered_ids) with ordinality as ordered(item_id, ordinal)
  ) ordered_items
  where target.id = ordered_items.item_id
    and target.template_id = p_template_id
    and target.section_id is not distinct from p_section_id;

  get diagnostics updated_count = row_count;
  if updated_count <> coalesce(array_length(p_ordered_ids, 1), 0) then
    raise exception 'Invalid question reorder scope';
  end if;
end;
$$;

create or replace function surveyor.reorder_template_question_sections(
  p_template_id uuid,
  p_sections jsonb
)
returns void
language plpgsql
security definer
set search_path = surveyor, public
as $$
declare
  updated_count integer;
  expected_count integer;
begin
  perform surveyor.require_super_admin();

  with scopes as (
    select
      (scope_item ->> 'sectionId')::uuid as section_id,
      scope_item -> 'orderedIds' as ordered_ids
    from jsonb_array_elements(p_sections) as scope_item
  ),
  ordered_items as (
    select
      scopes.section_id,
      ordered.value::uuid as item_id,
      ordered.ordinal::integer * 10 as sort_order
    from scopes
    cross join lateral jsonb_array_elements_text(scopes.ordered_ids) with ordinality as ordered(value, ordinal)
  )
  update surveyor.survey_questions target
  set
    section_id = ordered_items.section_id,
    sort_order = ordered_items.sort_order
  from ordered_items
  where target.id = ordered_items.item_id
    and target.template_id = p_template_id;

  get diagnostics updated_count = row_count;
  select count(*) into expected_count
  from jsonb_array_elements(p_sections) scope_item
  cross join lateral jsonb_array_elements_text(scope_item -> 'orderedIds');

  if updated_count <> expected_count then
    raise exception 'Invalid question section reorder scope';
  end if;
end;
$$;

grant execute on function surveyor.reorder_template_identity_fields(uuid, uuid[]) to authenticated, service_role;
grant execute on function surveyor.reorder_template_response_fields(uuid, uuid[]) to authenticated, service_role;
grant execute on function surveyor.reorder_template_sections(uuid, uuid, uuid[]) to authenticated, service_role;
grant execute on function surveyor.reorder_template_section_parents(uuid, jsonb) to authenticated, service_role;
grant execute on function surveyor.reorder_template_questions(uuid, uuid, uuid[]) to authenticated, service_role;
grant execute on function surveyor.reorder_template_question_sections(uuid, jsonb) to authenticated, service_role;
