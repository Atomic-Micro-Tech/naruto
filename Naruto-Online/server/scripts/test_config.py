"""Connection selection tests that never access a database."""
import os
import unittest
from unittest.mock import patch

import db


class ConnectionConfigTest(unittest.TestCase):
    def test_compose_default_without_environment(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(
                db.database_url(),
                "postgres://myuser:mypassword@127.0.0.1:5432/mydb?sslmode=disable",
            )

    def test_environment_overrides_default(self):
        with patch.dict(os.environ, {"NARUTO_DATABASE_URL": "postgres://other/dev"}, clear=True):
            self.assertEqual(db.database_url(), "postgres://other/dev")

    def test_empty_override_never_falls_back(self):
        with patch.dict(os.environ, {"NARUTO_DATABASE_URL": ""}, clear=True):
            with self.assertRaises(ValueError):
                db.database_url()

    def test_test_mode_never_falls_back_to_dev(self):
        with patch.dict(os.environ, {"NARUTO_DATABASE_URL": "postgres://other/dev"}, clear=True):
            with self.assertRaises(ValueError):
                db.database_url(test=True)
        with patch.dict(os.environ, {"NARUTO_TEST_DATABASE_URL": "postgres://isolated/test"}, clear=True):
            self.assertEqual(db.database_url(test=True), "postgres://isolated/test")


if __name__ == "__main__":
    unittest.main()
