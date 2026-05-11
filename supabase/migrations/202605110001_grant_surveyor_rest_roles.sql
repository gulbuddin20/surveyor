grant usage on schema surveyor to anon, authenticated, service_role;

grant select on all tables in schema surveyor to anon;
grant select, insert, update, delete on all tables in schema surveyor to authenticated, service_role;

grant usage, select on all sequences in schema surveyor to authenticated, service_role;
grant execute on all functions in schema surveyor to anon, authenticated, service_role;

alter default privileges in schema surveyor
  grant select on tables to anon;

alter default privileges in schema surveyor
  grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges in schema surveyor
  grant usage, select on sequences to authenticated, service_role;

alter default privileges in schema surveyor
  grant execute on functions to anon, authenticated, service_role;
