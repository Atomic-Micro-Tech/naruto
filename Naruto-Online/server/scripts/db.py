"""Shared connection settings for explicit development/test database commands."""
import json
import os
from pathlib import Path

import psycopg

LOCK_ID = 723184560215  # Serializes this project's migrations and seeds.
CONFIG = Path(__file__).resolve().parents[1] / "configs" / "config.json"


def database_url(test=False):
    if test:
        url = os.environ.get("NARUTO_TEST_DATABASE_URL")
        if not url:
            raise ValueError("Set NARUTO_TEST_DATABASE_URL terlebih dahulu; lihat README server.")
        return url
    settings = json.loads(CONFIG.read_text(encoding="utf-8"))["postgresql"]
    variable = settings.get("url_environment_variable", "")
    url = os.environ[variable] if variable in os.environ else settings.get("url")
    if not url:
        raise ValueError("URL PostgreSQL kosong; periksa config.json dan environment override.")
    return url


def connect(test=False):
    return psycopg.connect(database_url(test), autocommit=True, connect_timeout=5)


def lock(connection):
    connection.execute("SELECT pg_advisory_xact_lock(%s)", (LOCK_ID,))


def applied_versions(connection):
    schema = connection.execute("SELECT to_regnamespace('naruto')").fetchone()[0]
    if schema is None:
        return set()
    ledger = connection.execute(
        "SELECT to_regclass('naruto.schema_migrations')"
    ).fetchone()[0]
    if ledger is None:
        raise ValueError(
            "Schema naruto sudah ada tetapi schema_migrations tidak tersedia. "
            "Periksa migrasi sebelumnya; tidak ada schema yang dihapus."
        )
    return {
        row[0] for row in connection.execute(
            "SELECT version FROM naruto.schema_migrations ORDER BY version"
        )
    }


def database_error(action, error):
    # PostgreSQL error detail can contain row data; never print it or the DSN.
    code = error.sqlstate or "connection"
    return f"{action} gagal (SQLSTATE: {code}). Periksa koneksi dan skema tujuan."
