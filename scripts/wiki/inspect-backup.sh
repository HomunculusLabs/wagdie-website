#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /absolute/path/to/wiki-backup.zip" >&2
  exit 64
fi

BACKUP_ZIP="$1"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMPORT_ROOT="$REPO_ROOT/volumes/wiki/import"

python3 - "$BACKUP_ZIP" "$IMPORT_ROOT" <<'PY'
from __future__ import annotations

import gzip
import hashlib
import json
import os
import shutil
import sys
import zipfile
from pathlib import Path, PurePosixPath

backup = Path(sys.argv[1]).expanduser().resolve()
import_root = Path(sys.argv[2]).resolve()

if not backup.exists():
    print(f"Backup not found: {backup}", file=sys.stderr)
    sys.exit(66)

if not zipfile.is_zipfile(backup):
    print(f"Backup is not a ZIP archive: {backup}", file=sys.stderr)
    sys.exit(65)

stem = backup.name[:-4] if backup.name.lower().endswith('.zip') else backup.stem
extract_dir = import_root / stem
max_extracted_bytes = int(os.environ.get('WIKI_BACKUP_MAX_EXTRACTED_BYTES', str(20 * 1024 * 1024 * 1024)))

with zipfile.ZipFile(backup) as zf:
    members = zf.infolist()
    total_uncompressed = sum(info.file_size for info in members if not info.is_dir())
    if total_uncompressed > max_extracted_bytes:
        print(
            f"Refusing to extract {total_uncompressed} bytes; limit is {max_extracted_bytes}. "
            "Set WIKI_BACKUP_MAX_EXTRACTED_BYTES to override for trusted backups.",
            file=sys.stderr,
        )
        sys.exit(65)

    if extract_dir.exists():
        try:
            extract_dir.relative_to(import_root)
        except ValueError:
            print(f"Refusing to clear extraction path outside import root: {extract_dir}", file=sys.stderr)
            sys.exit(65)
        shutil.rmtree(extract_dir)
    extract_dir.mkdir(parents=True, exist_ok=True)

    print(f"Backup: {backup}")
    print(f"Size: {backup.stat().st_size} bytes")
    print(f"SHA256: {hashlib.sha256(backup.read_bytes()).hexdigest()}")
    print(f"ZIP entries: {len(members)}")
    print(f"Uncompressed ZIP payload: {total_uncompressed} bytes")
    print(f"Extracting to: {extract_dir}")

    for info in members:
        name = info.filename
        posix = PurePosixPath(name)
        if name.startswith('/') or '..' in posix.parts:
            print(f"Unsafe ZIP path rejected: {name}", file=sys.stderr)
            sys.exit(65)
        # Ignore macOS resource fork metadata.
        if posix.parts and posix.parts[0] == '__MACOSX':
            continue
        if posix.name.startswith('._'):
            continue
        target = extract_dir / Path(*posix.parts)
        if info.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        with zf.open(info) as src, target.open('wb') as dst:
            shutil.copyfileobj(src, dst)

all_files = [p for p in extract_dir.rglob('*') if p.is_file()]
rel = lambda p: str(p.relative_to(extract_dir))

pg_restore_candidates: list[Path] = []
psql_candidates: list[Path] = []
raw_pgdata_candidates: list[Path] = []
file_candidates: list[Path] = []
source_pg_major: str | None = None

# pg_dump directory format: a directory containing a PGDMP toc.dat manifest.
# Data files may be compressed (*.dat.gz) or uncompressed (*.dat).
for toc in extract_dir.rglob('toc.dat'):
    try:
        with toc.open('rb') as fh:
            if fh.read(5) == b'PGDMP':
                pg_restore_candidates.append(toc.parent)
    except OSError:
        pass

for p in all_files:
    lower = p.name.lower()
    if p.name == 'toc.dat' and p.parent in pg_restore_candidates:
        # In pg_dump directory format, toc.dat is the manifest for the directory,
        # not a separate dump candidate even though it starts with PGDMP.
        continue
    if p.name == 'PG_VERSION':
        parent = p.parent
        if (parent / 'base').exists() and (parent / 'global').exists():
            raw_pgdata_candidates.append(parent)
            source_pg_major = p.read_text(errors='replace').strip() or None
        continue

    if p in pg_restore_candidates:
        continue

    if lower.endswith(('.dump', '.backup', '.pgdump')):
        pg_restore_candidates.append(p)
        continue

    if lower.endswith('.sql') or lower.endswith('.sql.gz'):
        psql_candidates.append(p)
        continue

    try:
        with p.open('rb') as fh:
            sig = fh.read(5)
        if sig == b'PGDMP':
            pg_restore_candidates.append(p)
    except OSError:
        pass

for dirname in ('data', 'uploads', 'storage', 'assets', 'repo'):
    for d in extract_dir.rglob(dirname):
        if d.is_dir() and not any(part == '__MACOSX' for part in d.parts):
            file_candidates.append(d)

# De-duplicate while preserving order.
def dedupe(paths: list[Path]) -> list[Path]:
    seen: set[Path] = set()
    out: list[Path] = []
    for path in paths:
        resolved = path.resolve()
        if resolved not in seen:
            seen.add(resolved)
            out.append(path)
    return out

pg_restore_candidates = dedupe(pg_restore_candidates)
psql_candidates = dedupe(psql_candidates)
raw_pgdata_candidates = dedupe(raw_pgdata_candidates)
file_candidates = dedupe(file_candidates)

db_candidates = pg_restore_candidates + psql_candidates + raw_pgdata_candidates
requires_manual = False
manual_reason: str | None = None
db_restore_type = 'none'
db_restore_format: str | None = None
db_dump_path: str | None = None

if len(db_candidates) > 1:
    requires_manual = True
    manual_reason = 'Multiple database restore candidates were found; choose the intended dump manually.'
elif pg_restore_candidates:
    db_restore_type = 'pg_restore'
    chosen = pg_restore_candidates[0]
    db_dump_path = str(chosen.resolve())
    db_restore_format = 'directory' if chosen.is_dir() else 'custom'
elif psql_candidates:
    db_restore_type = 'psql'
    db_dump_path = str(psql_candidates[0].resolve())
    db_restore_format = 'plain_sql_gzip' if db_dump_path.endswith('.gz') else 'plain_sql'
elif raw_pgdata_candidates:
    db_restore_type = 'raw_pgdata'
    db_dump_path = str(raw_pgdata_candidates[0].resolve())
    db_restore_format = 'physical_pgdata'
    if source_pg_major and source_pg_major != '17':
        requires_manual = True
        manual_reason = f'Raw PGDATA is PostgreSQL {source_pg_major}; convert through a matching Postgres container before restoring to Postgres 17.'
else:
    # Heuristic for Wiki.js export-like archives: content files but no DB dump.
    contentish = [p for p in all_files if p.suffix.lower() in ('.md', '.json', '.html', '.txt', '.yml', '.yaml')]
    if contentish:
        db_restore_type = 'wikijs_export'
        requires_manual = True
        manual_reason = 'Archive looks like content/export files, not a database backup; import it through Wiki.js tooling after setup.'

plan = {
    'backupZip': str(backup),
    'backupSha256': hashlib.sha256(backup.read_bytes()).hexdigest(),
    'extractedTo': str(extract_dir),
    'dbRestoreType': db_restore_type,
    'dbRestoreFormat': db_restore_format,
    'dbDumpPath': db_dump_path,
    'pgRestoreCandidates': [str(p.resolve()) for p in pg_restore_candidates],
    'psqlCandidates': [str(p.resolve()) for p in psql_candidates],
    'rawPgdataCandidates': [str(p.resolve()) for p in raw_pgdata_candidates],
    'fileRestoreCandidates': [str(p.resolve()) for p in file_candidates],
    'sourcePostgresMajor': source_pg_major,
    'requiresManualReview': requires_manual,
    'manualReviewReason': manual_reason,
}

plan_path = extract_dir / 'restore-plan.json'
plan_path.write_text(json.dumps(plan, indent=2) + '\n')

print('\nDetected restore plan:')
print(json.dumps(plan, indent=2))
print(f"\nWrote: {plan_path}")

if requires_manual:
    print(f"\nManual review required: {manual_reason}", file=sys.stderr)
    sys.exit(2)
PY
