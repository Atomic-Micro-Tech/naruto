#!/usr/bin/env python3
"""Apply versioned Python migrations, using the existing SQL baseline."""
import argparse
from pathlib import Path
import runpy
import sys

import psycopg

from db import applied_versions, connect, database_error, lock

MIGRATIONS = Path(__file__).resolve().parents[1] / "migrations"


def discover():
    migrations = []
    for path in sorted(MIGRATIONS.glob("[0-9][0-9][0-9][0-9]_*.py")):
        module = runpy.run_path(str(path))
        if module.get("VERSION") != path.stem or not callable(module.get("apply")):
            raise ValueError(f"Definisi migrasi tidak valid: {path.name}")
        migrations.append((path.stem, module["apply"]))
    if not migrations:
        raise ValueError("Tidak ada file migrasi.")
    return migrations


def migrate(connection, status=False):
    migrations = discover()
    messages = []
    with connection.transaction():
        lock(connection)
        applied = applied_versions(connection)
        unknown = applied - {version for version, _ in migrations}
        if unknown:
            raise ValueError("Database memiliki versi migrasi yang tidak dikenal runner ini.")
        seen_pending = False
        for version, apply in migrations:
            if version in applied:
                if seen_pending:
                    raise ValueError("Riwayat migrasi memiliki celah; periksa database.")
                messages.append(f"applied  {version}")
                continue
            seen_pending = True
            if status:
                messages.append(f"pending  {version}")
                continue
            apply(connection)
            connection.execute(
                "INSERT INTO naruto.schema_migrations(version) VALUES (%s) "
                "ON CONFLICT (version) DO NOTHING",
                (version,),
            )
            messages.append(f"migrated {version}")
    # Report success only after the entire transaction has committed.
    return messages


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--test", action="store_true", help="Gunakan NARUTO_TEST_DATABASE_URL.")
    parser.add_argument("--status", action="store_true", help="Tampilkan versi tanpa menerapkan migrasi.")
    args = parser.parse_args()
    try:
        with connect(args.test) as connection:
            for message in migrate(connection, args.status):
                print(message)
        return 0
    except ValueError as error:
        print(str(error), file=sys.stderr)
    except psycopg.Error as error:
        print(database_error("Migrasi", error), file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
