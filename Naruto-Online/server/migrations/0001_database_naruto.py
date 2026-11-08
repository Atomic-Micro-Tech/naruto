"""Initial schema: reuse the authoritative SQL without duplicating its contents."""
from pathlib import Path
import re

VERSION = "0001_database_naruto"
SCHEMA = Path(__file__).resolve().parents[2] / "scheme" / "database-naruto.sql"


def apply(connection):
    sql = SCHEMA.read_text(encoding="utf-8")
    # The CLI owns the transaction. Keep all SQL, functions and seed metadata intact.
    sql, begins = re.subn(r"^BEGIN;\s*$", "", sql, flags=re.MULTILINE)
    sql, commits = re.subn(r"^COMMIT;\s*$", "", sql, flags=re.MULTILINE)
    if begins != 1 or commits != 1:
        raise ValueError("Wrapper transaksi SQL baseline berubah; periksa migrasi 0001.")
    connection.execute(sql, prepare=False)
