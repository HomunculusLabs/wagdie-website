# Local Wiki.js Docker Setup

This repository includes an isolated local Wiki.js stack for restoring and viewing the WAGDIE wiki backup. It is intentionally separate from the existing Supabase/Next.js stack.

## Services and Ports

- **Wiki.js**: http://localhost:3020
- **Wiki PostgreSQL**: `127.0.0.1:5452`
- Compose file: `docker-compose.wiki.yml`
- Local env file: `.env.wiki`
- Persistent data: `volumes/wiki/`

The Wiki.js service uses the official Wiki.js v2 image, `ghcr.io/requarks/wiki:2`, and a dedicated `postgres:17-alpine` database. It does not use the Supabase database or `.env.docker`.

PostgreSQL 17 is used because the provided backup is a `pg_dump` directory-format archive with dump format `1.16`; older `pg_restore` versions cannot read that format.

## First-Time Setup

```bash
cp .env.wiki.example .env.wiki
# Edit WIKI_DB_PASSWORD before starting.
```

Start the Wiki.js stack only:

```bash
docker compose --env-file .env.wiki -f docker-compose.wiki.yml up -d
```

Stop the Wiki.js stack only:

```bash
docker compose --env-file .env.wiki -f docker-compose.wiki.yml down
```

## Restore the WAGDIE Wiki Backup

The expected backup is:

```text
/Users/t3rpz/Downloads/dump-wagdiewiki-202603231652.zip
```

Inspect it first:

```bash
scripts/wiki/inspect-backup.sh /Users/t3rpz/Downloads/dump-wagdiewiki-202603231652.zip
```

This backup has been detected as a PostgreSQL `pg_dump -Fd` directory-format dump wrapped in a ZIP (`toc.dat` plus numbered `*.dat.gz` files). Restore it into the isolated Wiki.js database with:

```bash
scripts/wiki/restore-backup.sh --force /Users/t3rpz/Downloads/dump-wagdiewiki-202603231652.zip
```

The restore script:

1. Extracts the ZIP under `volumes/wiki/import/`.
2. Refuses ambiguous or unsupported formats instead of guessing.
3. Starts only `wiki-db`.
4. Drops/recreates only the isolated Wiki.js database.
5. Restores via `pg_restore --clean --if-exists --no-owner --no-acl`.
6. Starts Wiki.js and verifies `http://localhost:3020` responds.

## Reset Wiki.js Only

To remove the local Wiki.js restore and start over:

```bash
docker compose --env-file .env.wiki -f docker-compose.wiki.yml down
rm -rf volumes/wiki/db volumes/wiki/files volumes/wiki/import
```

Do **not** run reset commands against the main Supabase stack for Wiki.js cleanup. The Wiki.js data lives only under `volumes/wiki/`.

## Troubleshooting Docker Pulls

If Docker image pulls hang in a non-interactive shell while Docker Desktop uses a credential store, retry the pull with a temporary anonymous Docker config:

```bash
mkdir -p /tmp/wagdie-docker-config
printf '{"auths":{}}\n' > /tmp/wagdie-docker-config/config.json
DOCKER_CONFIG=/tmp/wagdie-docker-config docker pull ghcr.io/requarks/wiki:2
DOCKER_CONFIG=/tmp/wagdie-docker-config docker pull postgres:17-alpine
```

## If Inspection Refuses Automatic Restore

If `inspect-backup.sh` reports manual review, do not force a restore. Use the reason printed by the script:

- Multiple database candidates: choose the intended dump and restore that file/directory manually.
- Raw PGDATA from a different PostgreSQL major version: start a temporary Postgres container matching the source version, produce a logical dump with `pg_dump`, then restore the logical dump into this Wiki.js stack.
- Wiki.js export/content archive: start Wiki.js fresh, then import through Wiki.js admin/import tooling or a Wiki.js-supported import module.
