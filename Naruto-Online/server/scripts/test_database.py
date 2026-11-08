"""Integration tests create/drop only their own temporary databases."""
import os
import unittest
from unittest.mock import patch
from uuid import uuid4

from argon2 import PasswordHasher
import psycopg
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict

import db
import migrate
import seed


@unittest.skipUnless(os.environ.get("NARUTO_TEST_DATABASE_URL"), "Set NARUTO_TEST_DATABASE_URL.")
class DatabaseScriptsTest(unittest.TestCase):
    def setUp(self):
        self.admin = db.connect(test=True)
        self.addCleanup(self.admin.close)
        self.database = "naruto_scripts_" + uuid4().hex
        self.admin.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(self.database)))
        self.addCleanup(self.drop_database)
        settings = conninfo_to_dict(os.environ["NARUTO_TEST_DATABASE_URL"])
        settings["dbname"] = self.database
        self.connection = psycopg.connect(**settings, autocommit=True)
        self.addCleanup(self.connection.close)

    def drop_database(self):
        self.admin.execute(sql.SQL("DROP DATABASE {}").format(sql.Identifier(self.database)))

    def scalar(self, query, params=None):
        return self.connection.execute(query, params).fetchone()[0]

    def test_status_does_not_create_schema(self):
        self.assertEqual(migrate.migrate(self.connection, status=True), ["pending  0001_database_naruto"])
        self.assertIsNone(self.scalar("SELECT to_regnamespace('naruto')"))

    def test_baseline_and_repeat(self):
        self.assertEqual(migrate.migrate(self.connection), ["migrated 0001_database_naruto"])
        self.assertEqual(migrate.migrate(self.connection), ["applied  0001_database_naruto"])
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.schema_migrations"), 1)
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.arenas"), 1)
        self.assertEqual(self.scalar(
            "SELECT count(*) FROM information_schema.tables WHERE table_schema='naruto'"
        ), 25)

    def test_failure_rolls_back_entire_migration_batch(self):
        baseline = migrate.discover()

        def fail(connection):
            connection.execute("CREATE TABLE naruto.must_rollback(id integer)")
            raise ValueError("synthetic migration failure")

        with patch.object(migrate, "discover", return_value=baseline + [("0002_fail", fail)]):
            with self.assertRaisesRegex(ValueError, "synthetic migration failure"):
                migrate.migrate(self.connection)
        self.assertIsNone(self.scalar("SELECT to_regnamespace('naruto')"))
        self.assertEqual(migrate.migrate(self.connection), ["migrated 0001_database_naruto"])

    def test_seed_repeat_preserves_password_and_closed_room(self):
        migrate.migrate(self.connection)
        seed.seed(self.connection, seed.DEFAULT_PASSWORD)
        original_hash = self.scalar(
            "SELECT password_hash FROM naruto.user_credentials WHERE user_id=%s",
            (seed.fixture_id("user", "naruto"),),
        )
        self.assertTrue(original_hash.startswith("$argon2id$v=19$m=65536,t=2,p=1$"))
        self.assertTrue(PasswordHasher().verify(original_hash, seed.DEFAULT_PASSWORD))
        replacement = seed.password_hash("ChangedPassword!2026")
        room_id = seed.fixture_id("room", "lobby-a")
        with self.connection.transaction():
            self.connection.execute(
                "UPDATE naruto.user_credentials SET password_hash=%s WHERE user_id=%s",
                (replacement, seed.fixture_id("user", "naruto")),
            )
            self.connection.execute(
                "UPDATE naruto.rooms SET name='Edited fixture',status='closed',"
                "closed_at=now(),host_user_id=NULL WHERE id=%s", (room_id,),
            )
            self.connection.execute("DELETE FROM naruto.room_members WHERE room_id=%s", (room_id,))
        seed.seed(self.connection, "DifferentSeedPassword!2026")
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.users"), 4)
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.user_credentials"), 4)
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.user_preferences"), 4)
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.rooms"), 2)
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.outbox_events"), 2)
        self.assertEqual(self.scalar(
            "SELECT password_hash FROM naruto.user_credentials WHERE user_id=%s",
            (seed.fixture_id("user", "naruto"),),
        ), replacement)
        self.assertEqual(self.connection.execute(
            "SELECT name,status FROM naruto.rooms WHERE id=%s", (room_id,)
        ).fetchone(), ("Edited fixture", "closed"))

    def test_email_collision_rolls_back_all_seed_rows(self):
        migrate.migrate(self.connection)
        outsider = uuid4()
        self.connection.execute(
            "INSERT INTO naruto.users(id,email,display_name) VALUES (%s,%s,%s)",
            (outsider, "naruto@example.test", "Existing account"),
        )
        with self.assertRaisesRegex(ValueError, "bukan fixture"):
            seed.seed(self.connection, seed.DEFAULT_PASSWORD)
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.users"), 1)
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.user_credentials"), 0)
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.rooms"), 0)
        self.assertEqual(self.scalar(
            "SELECT id FROM naruto.users WHERE email='naruto@example.test'"
        ), outsider)

    def test_accounts_only_and_missing_migration(self):
        with self.assertRaisesRegex(ValueError, "migrate.py"):
            seed.seed(self.connection, seed.DEFAULT_PASSWORD)
        migrate.migrate(self.connection)
        seed.seed(self.connection, seed.DEFAULT_PASSWORD, accounts_only=True)
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.users"), 4)
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.rooms"), 0)
        self.assertEqual(self.scalar("SELECT count(*) FROM naruto.sessions"), 0)


if __name__ == "__main__":
    unittest.main()
