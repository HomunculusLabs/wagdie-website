#!/usr/bin/env bash
set -euo pipefail

FORCE=0
BACKUP_ZIP=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--force] /absolute/path/to/wiki-backup.zip"
      exit 0
      ;;
    *)
      if [[ -n "$BACKUP_ZIP" ]]; then
        echo "Unexpected argument: $1" >&2
        exit 64
      fi
      BACKUP_ZIP="$1"
      shift
      ;;
  esac
done

if [[ -z "$BACKUP_ZIP" ]]; then
  echo "Usage: $0 [--force] /absolute/path/to/wiki-backup.zip" >&2
  exit 64
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.wiki"
COMPOSE_FILE="$REPO_ROOT/docker-compose.wiki.yml"
DB_DIR="$REPO_ROOT/volumes/wiki/db"
IMPORT_ROOT="$REPO_ROOT/volumes/wiki/import"

cd "$REPO_ROOT"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env.wiki. Create it first:" >&2
  echo "  cp .env.wiki.example .env.wiki" >&2
  echo "  edit WIKI_DB_PASSWORD" >&2
  exit 78
fi

read_env_value() {
  python3 - "$ENV_FILE" "$1" <<'PY'
from __future__ import annotations

import os
import sys

path, key = sys.argv[1], sys.argv[2]
if key in os.environ:
    print(os.environ[key])
    sys.exit(0)

with open(path, encoding='utf-8') as fh:
    for raw in fh:
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        name, value = line.split('=', 1)
        name = name.strip()
        if name != key:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]
        print(value)
        sys.exit(0)
PY
}

WIKI_DB_NAME="$(read_env_value WIKI_DB_NAME)"
WIKI_DB_USER="$(read_env_value WIKI_DB_USER)"
WIKI_DB_PASSWORD="$(read_env_value WIKI_DB_PASSWORD)"
WIKI_HTTP_PORT="$(read_env_value WIKI_HTTP_PORT)"

: "${WIKI_DB_NAME:=wikijs}"
: "${WIKI_DB_USER:=wikijs}"
: "${WIKI_HTTP_PORT:=3020}"
if [[ -z "$WIKI_DB_PASSWORD" ]]; then
  echo "Set WIKI_DB_PASSWORD in .env.wiki" >&2
  exit 78
fi

if [[ ! "$WIKI_DB_NAME" =~ ^[A-Za-z_][A-Za-z0-9_]*$ || ! "$WIKI_DB_USER" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "WIKI_DB_NAME and WIKI_DB_USER must be simple PostgreSQL identifiers for this restore script." >&2
  exit 78
fi

if [[ -d "$DB_DIR" ]] && find "$DB_DIR" -mindepth 1 -print -quit | grep -q . && [[ "$FORCE" -ne 1 ]]; then
  echo "Wiki DB data already exists at $DB_DIR." >&2
  echo "Re-run with --force to drop/recreate only the isolated Wiki.js database." >&2
  exit 73
fi

"$SCRIPT_DIR/inspect-backup.sh" "$BACKUP_ZIP"

PLAN_PATH="$(python3 - "$BACKUP_ZIP" "$IMPORT_ROOT" <<'PY'
from pathlib import Path
import sys
backup=Path(sys.argv[1]).expanduser().resolve()
import_root=Path(sys.argv[2]).resolve()
stem=backup.name[:-4] if backup.name.lower().endswith('.zip') else backup.stem
print(import_root / stem / 'restore-plan.json')
PY
)"

read_plan() {
  python3 - "$PLAN_PATH" "$1" <<'PY'
import json, sys
with open(sys.argv[1]) as fh:
    data=json.load(fh)
value=data.get(sys.argv[2])
print('' if value is None else value)
PY
}

DB_RESTORE_TYPE="$(read_plan dbRestoreType)"
DB_RESTORE_FORMAT="$(read_plan dbRestoreFormat)"
DB_DUMP_PATH="$(read_plan dbDumpPath)"
REQUIRES_MANUAL="$(read_plan requiresManualReview)"
MANUAL_REASON="$(read_plan manualReviewReason)"

if [[ "$REQUIRES_MANUAL" == "True" || "$REQUIRES_MANUAL" == "true" ]]; then
  echo "Refusing automatic restore: $MANUAL_REASON" >&2
  exit 2
fi

if [[ "$DB_RESTORE_TYPE" == "none" || "$DB_RESTORE_TYPE" == "wikijs_export" ]]; then
  echo "No database dump was detected. Start Wiki.js fresh and import content manually through Wiki.js tooling." >&2
  exit 2
fi

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

echo "Starting isolated Wiki.js database..."
compose up -d wiki-db

echo "Waiting for wiki-db readiness..."
for i in {1..60}; do
  if compose exec -T wiki-db pg_isready -U "$WIKI_DB_USER" -d "$WIKI_DB_NAME" >/dev/null 2>&1; then
    break
  fi
  if [[ "$i" -eq 60 ]]; then
    echo "wiki-db did not become ready in time." >&2
    compose logs wiki-db >&2 || true
    exit 1
  fi
  sleep 2
done

compose stop wiki >/dev/null 2>&1 || true

drop_recreate_db() {
  compose exec -T -e PGPASSWORD="$WIKI_DB_PASSWORD" wiki-db sh -eu <<EOS
psql -U '${WIKI_DB_USER}' -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${WIKI_DB_NAME}' AND pid <> pg_backend_pid();
SQL
dropdb --if-exists -U '${WIKI_DB_USER}' '${WIKI_DB_NAME}'
createdb -U '${WIKI_DB_USER}' -O '${WIKI_DB_USER}' '${WIKI_DB_NAME}'
EOS
}

normalize_privileges() {
  compose exec -T -e PGPASSWORD="$WIKI_DB_PASSWORD" wiki-db sh -eu <<EOS
psql -U '${WIKI_DB_USER}' -d '${WIKI_DB_NAME}' -v ON_ERROR_STOP=1 <<SQL
GRANT ALL PRIVILEGES ON DATABASE "${WIKI_DB_NAME}" TO "${WIKI_DB_USER}";
GRANT ALL ON SCHEMA public TO "${WIKI_DB_USER}";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${WIKI_DB_USER}";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${WIKI_DB_USER}";
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO "${WIKI_DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${WIKI_DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${WIKI_DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO "${WIKI_DB_USER}";
SQL
EOS
}

host_to_container_import_path() {
  python3 - "$1" "$IMPORT_ROOT" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1]).resolve()
root = Path(sys.argv[2]).resolve()
try:
    rel = path.relative_to(root)
except ValueError:
    print(f'Path is not under import root: {path}', file=sys.stderr)
    sys.exit(1)
print('/wiki-import/' + str(rel).replace('\\\\', '/'))
PY
}

case "$DB_RESTORE_TYPE:$DB_RESTORE_FORMAT" in
  pg_restore:directory|pg_restore:custom)
    if [[ -z "$DB_DUMP_PATH" ]]; then
      echo "Restore plan did not include dbDumpPath." >&2
      exit 1
    fi
    CONTAINER_DUMP_PATH="$(host_to_container_import_path "$DB_DUMP_PATH")"
    echo "Restoring PostgreSQL dump with pg_restore ($DB_RESTORE_FORMAT): $CONTAINER_DUMP_PATH"
    drop_recreate_db
    compose exec -T -e PGPASSWORD="$WIKI_DB_PASSWORD" -e RESTORE_DUMP_PATH="$CONTAINER_DUMP_PATH" wiki-db sh -eu <<EOS
pg_restore --clean --if-exists --no-owner --no-acl -U '${WIKI_DB_USER}' -d '${WIKI_DB_NAME}' "\$RESTORE_DUMP_PATH"
EOS
    normalize_privileges
    ;;
  psql:plain_sql|psql:plain_sql_gzip)
    if [[ -z "$DB_DUMP_PATH" ]]; then
      echo "Restore plan did not include dbDumpPath." >&2
      exit 1
    fi
    echo "Restoring plain SQL dump with psql: $DB_DUMP_PATH"
    drop_recreate_db
    if [[ "$DB_RESTORE_FORMAT" == "plain_sql_gzip" ]]; then
      gzip -dc "$DB_DUMP_PATH" | compose exec -T -e PGPASSWORD="$WIKI_DB_PASSWORD" wiki-db psql -U "$WIKI_DB_USER" -d "$WIKI_DB_NAME" -v ON_ERROR_STOP=1
    else
      compose exec -T -e PGPASSWORD="$WIKI_DB_PASSWORD" wiki-db psql -U "$WIKI_DB_USER" -d "$WIKI_DB_NAME" -v ON_ERROR_STOP=1 < "$DB_DUMP_PATH"
    fi
    normalize_privileges
    ;;
  raw_pgdata:*)
    echo "Raw PGDATA restore is not automatic unless the exact Postgres major/version and shutdown state are reviewed manually." >&2
    echo "Create a logical dump with a matching Postgres container, then restore that dump with this script." >&2
    exit 2
    ;;
  *)
    echo "Unsupported restore type/format: $DB_RESTORE_TYPE / $DB_RESTORE_FORMAT" >&2
    exit 2
    ;;
esac

echo "Starting Wiki.js application..."
compose up -d wiki

echo "Waiting for Wiki.js HTTP response..."
WIKI_URL="http://localhost:${WIKI_HTTP_PORT:-3020}"
for i in {1..90}; do
  status="$(curl -fsS -o /dev/null -w '%{http_code}' "$WIKI_URL" 2>/dev/null || true)"
  if [[ "$status" =~ ^(200|301|302|303)$ ]]; then
    echo "Wiki.js is reachable at $WIKI_URL (HTTP $status)."
    exit 0
  fi
  sleep 2
done

echo "Restore completed, but Wiki.js did not return a ready HTTP status at $WIKI_URL yet." >&2
compose logs --tail=100 wiki >&2 || true
exit 1
