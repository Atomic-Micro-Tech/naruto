#!/usr/bin/env python3
"""Insert synthetic local-test accounts and public rooms without resetting existing data."""
import argparse
import os
import sys
from uuid import NAMESPACE_URL, uuid5

from argon2.low_level import Type, hash_secret
import psycopg

from db import applied_versions, connect, database_error, lock

VERSION = "0001_database_naruto"
DEFAULT_PASSWORD = "NarutoDev!2026"
ACCOUNTS = (
    ("naruto", "Naruto Dev"),
    ("sasuke", "Sasuke Dev"),
    ("sakura", "Sakura Dev"),
    ("kakashi", "Kakashi Dev"),
)
ROOMS = (
    ("lobby-a", "DEV Arena 1 - A", "naruto", 4),
    ("lobby-b", "DEV Arena 1 - B", "sasuke", 2),
)


def fixture_id(kind, name):
    return uuid5(NAMESPACE_URL, f"naruto-online:development:{kind}:{name}")


def password_hash(password):
    # Must match server/internal/auth/Security.go exactly.
    return hash_secret(
        password.encode("utf-8"), os.urandom(16),
        time_cost=2, memory_cost=65536, parallelism=1,
        hash_len=32, type=Type.ID, version=19,
    ).decode("ascii")


def seed_user(connection, slug, display_name, password):
    user_id = fixture_id("user", slug)
    email = f"{slug}@example.test"
    collisions = connection.execute(
        "SELECT id,email FROM naruto.users WHERE id=%s OR email=%s",
        (user_id, email),
    ).fetchall()
    if any(row != (user_id, email) for row in collisions):
        raise ValueError(f"Akun {email} bukan fixture ini; seed dibatalkan tanpa menimpanya.")
    created = connection.execute(
        "INSERT INTO naruto.users(id,email,display_name,email_verified_at) "
        "VALUES (%s,%s,%s,now()) ON CONFLICT (id) DO NOTHING RETURNING id",
        (user_id, email, display_name),
    ).fetchone()
    connection.execute("SELECT id FROM naruto.users WHERE id=%s FOR UPDATE", (user_id,))
    credentials = connection.execute(
        "SELECT 1 FROM naruto.user_credentials WHERE user_id=%s", (user_id,)
    ).fetchone()
    if credentials is None:
        connection.execute(
            "INSERT INTO naruto.user_credentials(user_id,password_hash) VALUES (%s,%s)",
            (user_id, password_hash(password)),
        )
    connection.execute(
        "INSERT INTO naruto.user_preferences(user_id) VALUES (%s) "
        "ON CONFLICT (user_id) DO NOTHING", (user_id,),
    )
    return f"{'created' if created else 'kept'} user {email}"


def seed_room(connection, slug, name, host_slug, capacity):
    room_id = fixture_id("room", slug)
    host_id = fixture_id("user", host_slug)
    connection.execute("SELECT id FROM naruto.users WHERE id=%s FOR UPDATE", (host_id,))
    exists = connection.execute(
        "SELECT 1 FROM naruto.rooms WHERE id=%s", (room_id,)
    ).fetchone()
    if exists:
        return f"kept room {name} (state yang ada dipertahankan)"
    membership = connection.execute(
        "SELECT 1 FROM naruto.room_members WHERE user_id=%s", (host_id,)
    ).fetchone()
    if membership:
        return f"skipped room {name} (host sudah berada di room lain)"
    connection.execute(
        "INSERT INTO naruto.rooms(id,name,host_user_id,visibility,status,arena_id,"
        "capacity,target_chakra,rule,voice_enabled,room_version) "
        "VALUES (%s,%s,%s,'public','waiting','arena-1',%s,3000,'normal',false,1)",
        (room_id, name, host_id, capacity),
    )
    # No fabricated live socket or ready/asset state. Connect will update this row.
    connection.execute(
        "INSERT INTO naruto.room_members(room_id,user_id,room_capacity,seat,"
        "character_id,connection_status) VALUES (%s,%s,%s,0,0,'disconnected')",
        (room_id, host_id, capacity),
    )
    connection.execute(
        "INSERT INTO naruto.outbox_events(topic,aggregate_id,deduplication_key,payload) "
        "VALUES ('room.changed',%s,%s,jsonb_build_object('roomId',%s::uuid))",
        (room_id, f"room:{room_id}:1", room_id),
    )
    return f"created room {name}"


def seed(connection, password, accounts_only=False):
    if not 12 <= len(password) <= 128:
        raise ValueError("NARUTO_SEED_PASSWORD harus terdiri dari 12–128 karakter.")
    messages = []
    with connection.transaction():
        lock(connection)
        if VERSION not in applied_versions(connection):
            raise ValueError("Jalankan migrate.py pada database ini sebelum seed.")
        arena = connection.execute(
            "SELECT 1 FROM naruto.arenas WHERE id='arena-1' AND enabled"
        ).fetchone()
        if arena is None:
            raise ValueError("Arena 1 belum tersedia; periksa migrasi.")
        # Stable lock order, also compatible with concurrent application requests.
        for slug, name in sorted(ACCOUNTS, key=lambda item: fixture_id("user", item[0])):
            messages.append(seed_user(connection, slug, name, password))
        if not accounts_only:
            for room in ROOMS:
                messages.append(seed_room(connection, *room))
    return messages


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--test", action="store_true", help="Gunakan NARUTO_TEST_DATABASE_URL.")
    parser.add_argument("--accounts-only", action="store_true", help="Buat akun tanpa room.")
    args = parser.parse_args()
    try:
        password = os.environ.get("NARUTO_SEED_PASSWORD", DEFAULT_PASSWORD)
        with connect(args.test) as connection:
            for message in seed(connection, password, args.accounts_only):
                print(message)
        print("Seed selesai. Akun baru dapat login; password akun lama tidak diubah.")
        return 0
    except ValueError as error:
        print(str(error), file=sys.stderr)
    except psycopg.Error as error:
        print(database_error("Seed", error), file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
