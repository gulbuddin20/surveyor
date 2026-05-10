#!/bin/sh
set -eu

MIGRATIONS_DIR="${MIGRATIONS_DIR:-supabase/migrations}"
MIGRATION_BASELINE="${MIGRATION_BASELINE:-0}"
MIGRATION_TABLE="${MIGRATION_TABLE:-public.surveyor_schema_migrations}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-postgres}"
SSH_HOST="${SSH_HOST:-}"
SSH_USER="${SSH_USER:-root}"
SSH_PORT="${SSH_PORT:-22}"

if [ -z "${DATABASE_URL:-}" ] && [ -z "$POSTGRES_CONTAINER" ]; then
  echo "Either DATABASE_URL or POSTGRES_CONTAINER is required"
  exit 1
fi

if [ -n "$SSH_HOST" ] && [ -z "$POSTGRES_CONTAINER" ]; then
  echo "POSTGRES_CONTAINER is required when SSH_HOST is set"
  exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migration directory not found: $MIGRATIONS_DIR"
  exit 1
fi

run_psql() {
  if [ -n "$SSH_HOST" ]; then
    ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" \
      "docker exec -i '$POSTGRES_CONTAINER' psql -U '$POSTGRES_USER' -d '$POSTGRES_DB' $*"
  elif [ -n "$POSTGRES_CONTAINER" ]; then
    docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"
  else
    psql "$DATABASE_URL" "$@"
  fi
}

run_psql -v ON_ERROR_STOP=1 <<SQL
create table if not exists ${MIGRATION_TABLE} (
  filename text primary key,
  checksum text not null,
  applied_at timestamptz not null default now(),
  applied_by text not null default current_user
);
SQL

found=0
for migration in "$MIGRATIONS_DIR"/*.sql; do
  [ -e "$migration" ] || continue

  filename="$(basename "$migration")"
  version="${filename%%_*}"

  case "$version" in
    *[!0-9]*|"")
      echo "Skipping migration with non-timestamp filename: $filename"
      continue
      ;;
  esac

  if [ "$version" -lt "$MIGRATION_BASELINE" ]; then
    continue
  fi

  found=1
  already_applied="$(printf "select 1 from %s where filename = '%s';\n" "$MIGRATION_TABLE" "$filename" \
    | run_psql -AtX -v ON_ERROR_STOP=1)"

  if [ "$already_applied" = "1" ]; then
    echo "Skipping already applied migration: $filename"
    continue
  fi

  checksum="$(sha256sum "$migration" | awk '{print $1}')"
  tmp_sql="$(mktemp)"

  {
    printf 'begin;\n'
    cat "$migration"
    printf '\ninsert into %s (filename, checksum) values (' "$MIGRATION_TABLE"
    printf "'%s', '%s'" "$filename" "$checksum"
    printf ');\ncommit;\n'
  } > "$tmp_sql"

  echo "Applying migration: $filename"
  run_psql -v ON_ERROR_STOP=1 < "$tmp_sql"
  rm -f "$tmp_sql"
done

if [ "$found" = "0" ]; then
  echo "No migrations found at or after baseline $MIGRATION_BASELINE"
fi
