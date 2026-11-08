-- Naruto Online: skema awal PostgreSQL 15+ (2026-11-08).
-- Kontrak: ../api/naruto.yaml, ../PLAN.md, ../../GAME_RULE.md, ../../AI_RULE.md.
-- Jalankan sekali pada database kosong; perubahan berikutnya memakai migrasi.
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scheme/database-naruto.sql
-- Compose saat ini (dari folder Naruto-Online, setelah postgres berjalan):
-- docker compose exec -T postgres psql -U myuser -d mydb -v ON_ERROR_STOP=1 < scheme/database-naruto.sql
-- Tidak membuat database/role, menghapus data, atau memerlukan extension.
-- Backend memakai search_path=naruto,public atau nama tabel berkualifikasi.
-- Tidak ada akun/password tester, sesi, atau match contoh yang di-seed.
--
-- Konvensi: UUID internal; timestamptz; snake_case SQL -> camelCase API.
-- bigint versi/sequence/tick harus diserialisasi Go dalam rentang integer aman JS.
-- JSONB internal BUKAN DTO publik: proyeksikan untuk setiap penerima di Go.
-- Password memakai encoded adaptive hash (mis. Argon2id); token acak memakai
-- SHA-256/HMAC 32 byte. Kunci enkripsi/pepper berada di konfigurasi server.
-- Hash token tidak dapat digunakan untuk menampilkan token aslinya kembali.
-- Referensi PostgreSQL:
-- https://www.postgresql.org/docs/15/ddl-constraints.html
-- https://www.postgresql.org/docs/15/explicit-locking.html

BEGIN;
SET LOCAL lock_timeout = '10s';
CREATE SCHEMA naruto;
SET LOCAL search_path = naruto, public;

CREATE DOMAIN sha256_hex AS text CHECK (VALUE ~ '^[0-9a-f]{64}$');
CREATE DOMAIN token_digest AS bytea CHECK (octet_length(VALUE) = 32);
CREATE DOMAIN json_object AS jsonb CHECK (jsonb_typeof(VALUE) = 'object');
CREATE DOMAIN sequence_number AS bigint CHECK (VALUE BETWEEN 0 AND 9007199254740991);

CREATE TABLE schema_migrations (
    version text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
);

-- 1. Akun, identitas platform, kredensial dan sesi.
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 32),
    email_verified_at timestamptz,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    session_epoch sequence_number NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (email = lower(btrim(email)) AND char_length(email) BETWEEN 3 AND 254)
);
COMMENT ON COLUMN users.session_epoch IS 'Epoch koneksi pengendali akun; naikkan atomik ketika WS baru menggantikan koneksi lama. Bukan control_epoch kursi match.';

CREATE TABLE user_credentials (
    user_id uuid PRIMARY KEY REFERENCES users(id),
    password_hash text NOT NULL CHECK (char_length(password_hash) BETWEEN 20 AND 1024),
    password_changed_at timestamptz NOT NULL DEFAULT now(),
    failed_login_count integer NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
    locked_until timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN user_credentials.password_hash IS 'Encoded adaptive hash termasuk algoritme, parameter dan salt; panjang password asli 12..128 divalidasi Go. Tidak pernah plaintext.';

-- Persiapan porting: belum mengaktifkan endpoint Facebook dan tidak auto-link email.
CREATE TABLE user_identities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    provider text NOT NULL CHECK (provider IN ('facebook_instant_games')),
    provider_app_id text NOT NULL CHECK (char_length(provider_app_id) > 0),
    provider_subject text NOT NULL CHECK (char_length(provider_subject) > 0),
    linked_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_app_id, provider_subject),
    UNIQUE (user_id, provider, provider_app_id)
);

CREATE TABLE user_preferences (
    user_id uuid PRIMARY KEY REFERENCES users(id),
    language text NOT NULL DEFAULT 'id' CHECK (char_length(language) BETWEEN 2 AND 16),
    music_volume numeric(4,3) NOT NULL DEFAULT 0.700 CHECK (music_volume BETWEEN 0 AND 1),
    sfx_volume numeric(4,3) NOT NULL DEFAULT 1.000 CHECK (sfx_volume BETWEEN 0 AND 1),
    voice_volume numeric(4,3) NOT NULL DEFAULT 1.000 CHECK (voice_volume BETWEEN 0 AND 1),
    touch_settings json_object NOT NULL DEFAULT '{}',
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    token_hash token_digest NOT NULL UNIQUE,
    csrf_token_hash token_digest NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    revoke_reason text,
    UNIQUE (id, user_id),
    CHECK (expires_at > created_at),
    CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);
CREATE INDEX sessions_user_live_idx ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE email_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    purpose text NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
    email text NOT NULL,
    token_hash token_digest NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    revoked_at timestamptz,
    CHECK (expires_at > created_at),
    CHECK (used_at IS NULL OR used_at >= created_at),
    CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);
CREATE INDEX email_tokens_user_idx ON email_tokens(user_id, purpose);
CREATE INDEX email_tokens_expiry_idx ON email_tokens(expires_at);
COMMENT ON TABLE email_tokens IS 'Konsumsi dengan UPDATE ... WHERE used_at IS NULL AND revoked_at IS NULL AND expires_at > now() RETURNING; verifikasi email masih cocok. Reset password dan pencabutan sesi/tiket satu transaksi.';

CREATE TABLE ws_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    token_hash token_digest NOT NULL UNIQUE,
    origin text NOT NULL CHECK (char_length(origin) BETWEEN 1 AND 512),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 seconds'),
    consumed_at timestamptz,
    CHECK (expires_at > created_at AND expires_at <= created_at + interval '30 seconds'),
    CHECK (consumed_at IS NULL OR consumed_at >= created_at)
);
CREATE INDEX ws_tickets_session_idx ON ws_tickets(session_id);
CREATE INDEX ws_tickets_expiry_idx ON ws_tickets(expires_at);
COMMENT ON TABLE ws_tickets IS 'Tiket sekali pakai: konsumsi atomik, validasi Origin dan sesi belum revoked/expired. Hash saja; query string tiket harus direduksi dari log.';

CREATE TABLE realtime_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    session_id uuid NOT NULL,
    session_epoch sequence_number NOT NULL,
    connected_at timestamptz NOT NULL DEFAULT now(),
    last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
    disconnected_at timestamptz,
    disconnect_reason text,
    FOREIGN KEY (session_id, user_id) REFERENCES sessions(id, user_id),
    CHECK (disconnected_at IS NULL OR disconnected_at >= connected_at)
);
CREATE UNIQUE INDEX realtime_one_connection_idx ON realtime_connections(user_id) WHERE disconnected_at IS NULL;
CREATE INDEX realtime_session_idx ON realtime_connections(session_id);
COMMENT ON TABLE realtime_connections IS 'Satu pengendali aktif per akun. Saat restart, tandai koneksi lama putus dan lakukan takeover melalui antrean match; jangan menganggap baris ini bukti socket masih hidup.';

-- 2. Arena dan lobby. Metadata aset menunjuk canonical path di assets/.
CREATE TABLE arenas (
    id text PRIMARY KEY,
    map_id smallint NOT NULL UNIQUE CHECK (map_id BETWEEN 0 AND 8),
    name text NOT NULL,
    enabled boolean NOT NULL DEFAULT false,
    tile_count smallint NOT NULL CHECK (tile_count > 0),
    world_width integer NOT NULL CHECK (world_width > 0),
    world_height integer NOT NULL CHECK (world_height > 0),
    thumbnail_path text NOT NULL,
    board_data_path text NOT NULL,
    asset_manifest_path text NOT NULL,
    rules_hash sha256_hex NOT NULL,
    ai_rules_hash sha256_hex NOT NULL,
    board_data_hash sha256_hex NOT NULL,
    asset_manifest_hash sha256_hex NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
    host_user_id uuid REFERENCES users(id),
    visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'results', 'closed')),
    arena_id text NOT NULL DEFAULT 'arena-1' REFERENCES arenas(id) CHECK (arena_id = 'arena-1'),
    capacity smallint NOT NULL DEFAULT 4 CHECK (capacity BETWEEN 2 AND 4),
    target_chakra integer NOT NULL DEFAULT 3000 CHECK (target_chakra BETWEEN 0 AND 99999),
    rule text NOT NULL DEFAULT 'normal' CHECK (rule = 'normal'),
    voice_enabled boolean NOT NULL DEFAULT true,
    room_version sequence_number NOT NULL DEFAULT 0,
    invite_code_hash token_digest UNIQUE,
    invite_code_ciphertext bytea,
    invite_key_id text,
    invite_version sequence_number NOT NULL DEFAULT 0,
    active_match_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz,
    UNIQUE (id, capacity),
    CHECK ((status = 'closed') = (closed_at IS NOT NULL)),
    CHECK (status = 'closed' OR host_user_id IS NOT NULL),
    CHECK ((status IN ('playing', 'results')) = (active_match_id IS NOT NULL)),
    CHECK (visibility <> 'private' OR invite_code_hash IS NOT NULL),
    CHECK ((invite_code_hash IS NULL AND invite_code_ciphertext IS NULL AND invite_key_id IS NULL)
        OR (invite_code_hash IS NOT NULL AND invite_code_ciphertext IS NOT NULL AND invite_key_id IS NOT NULL))
);
CREATE INDEX rooms_public_list_idx ON rooms(status, created_at DESC, id DESC)
    WHERE visibility = 'public' AND closed_at IS NULL;
CREATE INDEX rooms_host_idx ON rooms(host_user_id);
COMMENT ON COLUMN rooms.invite_code_ciphertext IS 'AEAD ciphertext kode untuk host dan retry invite.rotate; lookup memakai HMAC kode ternormalisasi. Kunci tidak disimpan di DB; jangan masukkan kode ke daftar publik.';
COMMENT ON COLUMN rooms.status IS 'closed internal saja: keluarkan dari DTO daftar room. Tutup room kosong dengan host_user_id=NULL, active_match_id=NULL.';

-- Hanya keanggotaan aktif; riwayat peserta match disimpan terpisah.
CREATE TABLE room_members (
    room_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id),
    room_capacity smallint NOT NULL,
    seat smallint NOT NULL CHECK (seat BETWEEN 0 AND 3),
    character_id smallint NOT NULL DEFAULT 0 CHECK (character_id BETWEEN 0 AND 3),
    ready boolean NOT NULL DEFAULT false,
    assets_ready boolean NOT NULL DEFAULT false,
    asset_manifest_hash sha256_hex,
    connection_status text NOT NULL DEFAULT 'connected'
        CHECK (connection_status IN ('connected', 'reconnecting', 'disconnected')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    join_order bigint GENERATED ALWAYS AS IDENTITY,
    reconnect_deadline_at timestamptz,
    PRIMARY KEY (room_id, user_id),
    UNIQUE (room_id, seat),
    UNIQUE (user_id),
    FOREIGN KEY (room_id, room_capacity) REFERENCES rooms(id, capacity) ON UPDATE CASCADE,
    CHECK (seat < room_capacity),
    CHECK (NOT ready OR (assets_ready AND connection_status = 'connected')),
    CHECK (NOT assets_ready OR asset_manifest_hash IS NOT NULL)
);
ALTER TABLE rooms ADD CONSTRAINT rooms_host_member_fk
    FOREIGN KEY (id, host_user_id) REFERENCES room_members(room_id, user_id)
    DEFERRABLE INITIALLY DEFERRED;
COMMENT ON TABLE room_members IS 'Satu room aktif per user. FK kapasitas + seat unik membatasi kursi termasuk join bersamaan. Lock rooms FOR UPDATE sebelum join/leave/settings/start; host dan membership dibuat dalam transaksi yang sama.';
COMMENT ON COLUMN room_members.join_order IS 'Urutan host migration deterministik; pilih anggota tersisa ORDER BY join_order. Tidak menggunakan UUID acak sebagai urutan join.';

-- 3. Match: state privat lengkap dan versi artefak dipin sejak start.
CREATE TABLE matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid NOT NULL REFERENCES rooms(id),
    arena_id text NOT NULL REFERENCES arenas(id) CHECK (arena_id = 'arena-1'),
    status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused_error', 'completed', 'aborted')),
    participant_count smallint NOT NULL CHECK (participant_count BETWEEN 2 AND 4),
    target_chakra integer NOT NULL CHECK (target_chakra BETWEEN 0 AND 99999),
    rule text NOT NULL DEFAULT 'normal' CHECK (rule = 'normal'),
    settings_snapshot json_object NOT NULL,
    rules_hash sha256_hex NOT NULL,
    ai_rules_hash sha256_hex NOT NULL,
    board_data_hash sha256_hex NOT NULL,
    assets_hash sha256_hex NOT NULL,
    engine_version text NOT NULL CHECK (char_length(engine_version) > 0),
    ai_policy_version text NOT NULL CHECK (char_length(ai_policy_version) > 0),
    state_schema_version integer NOT NULL DEFAULT 1 CHECK (state_schema_version > 0),
    state_version sequence_number NOT NULL DEFAULT 0,
    last_event_sequence sequence_number NOT NULL DEFAULT 0,
    server_tick sequence_number NOT NULL DEFAULT 0,
    phase text NOT NULL CHECK (phase IN ('turn_start', 'pre_move', 'roulette', 'movement',
        'tile_resolution', 'combat', 'source_bonus', 'turn_end', 'results', 'paused_error')),
    turn_seat smallint NOT NULL CHECK (turn_seat BETWEEN 0 AND 3),
    round_number integer NOT NULL DEFAULT 1 CHECK (round_number >= 1),
    initial_rng_seed bigint NOT NULL CHECK (initial_rng_seed BETWEEN 0 AND 4294967295),
    rng_state bigint NOT NULL CHECK (rng_state BETWEEN 0 AND 4294967295),
    rng_draw_count sequence_number NOT NULL DEFAULT 0,
    state json_object NOT NULL,
    state_hash sha256_hex NOT NULL,
    decision_deadline_at timestamptz,
    decision_deadline_tick sequence_number,
    error_trace json_object,
    result_reason text CHECK (result_reason IN ('source_victory', 'surrender')),
    winner_seat smallint CHECK (winner_seat BETWEEN 0 AND 3),
    result_description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (id, room_id),
    UNIQUE (id, participant_count),
    CHECK (turn_seat < participant_count),
    CHECK ((status IN ('completed', 'aborted')) = (ended_at IS NOT NULL)),
    CHECK ((status = 'completed') = (result_reason IS NOT NULL)),
    CHECK (status <> 'completed' OR (phase = 'results' AND result_description IS NOT NULL)),
    CHECK (status = 'completed' OR winner_seat IS NULL),
    CHECK (result_reason IS DISTINCT FROM 'source_victory' OR winner_seat IS NOT NULL),
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);
CREATE UNIQUE INDEX matches_one_live_per_room_idx ON matches(room_id)
    WHERE status IN ('running', 'paused_error');
CREATE INDEX matches_room_history_idx ON matches(room_id, created_at DESC, id DESC);
CREATE INDEX matches_recovery_idx ON matches(status) WHERE status IN ('running', 'paused_error');
ALTER TABLE rooms ADD CONSTRAINT rooms_active_match_fk FOREIGN KEY (active_match_id, id)
    REFERENCES matches(id, room_id) DEFERRABLE INITIALLY DEFERRED;
COMMENT ON COLUMN matches.state IS 'Checkpoint privat engine: papan, deck/pool, tangan semua pemain, wheel, pending effects, native AI context dan antrean keputusan. Simpan dengan RNG/tick/players/events/command dalam transaksi yang sama; jangan kirim mentah ke client.';
COMMENT ON COLUMN matches.state_hash IS 'SHA256 serialisasi kanonis checkpoint lengkap (state, RNG, clock dan roster/controller/AI). Go menetapkan format kanonis berversi; bukan hash teks JSONB PostgreSQL.';

CREATE TABLE match_players (
    match_id uuid NOT NULL,
    seat smallint NOT NULL CHECK (seat BETWEEN 0 AND 3),
    participant_count smallint NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id),
    display_name_snapshot text NOT NULL CHECK (char_length(display_name_snapshot) BETWEEN 1 AND 32),
    character_id smallint NOT NULL CHECK (character_id BETWEEN 0 AND 3),
    participant_kind text NOT NULL DEFAULT 'human' CHECK (participant_kind = 'human'),
    controller_kind text NOT NULL DEFAULT 'human' CHECK (controller_kind IN ('human', 'cpu')),
    control_epoch sequence_number NOT NULL DEFAULT 0,
    connection_status text NOT NULL DEFAULT 'connected'
        CHECK (connection_status IN ('connected', 'reconnecting', 'disconnected')),
    takeover_reason text CHECK (takeover_reason IN ('disconnect', 'inactivity', 'reconnect', 'logout')),
    controller_changed_at timestamptz NOT NULL DEFAULT now(),
    last_input_at timestamptz,
    reclaim_requested_at timestamptz,
    policy_state json_object NOT NULL DEFAULT '{}',
    decision_sequence sequence_number NOT NULL DEFAULT 0,
    PRIMARY KEY (match_id, seat),
    UNIQUE (match_id, user_id),
    UNIQUE (match_id, seat, user_id),
    FOREIGN KEY (match_id, participant_count) REFERENCES matches(id, participant_count),
    CHECK (seat < participant_count),
    CHECK (reclaim_requested_at IS NULL OR controller_kind = 'cpu')
);
CREATE INDEX match_players_user_idx ON match_players(user_id, match_id);
ALTER TABLE matches ADD CONSTRAINT matches_winner_fk FOREIGN KEY (id, winner_seat)
    REFERENCES match_players(match_id, seat) DEFERRABLE INITIALLY DEFERRED;
COMMENT ON TABLE match_players IS 'Identitas peserta tetap manusia walaupun controller CPU. policy_state menyimpan attempt/target/context untuk recovery sesuai AI_RULE; tidak diinisialisasi ulang saat reconnect.';

-- Lindungi identitas dan fencing kontrol dari update tanpa epoch baru.
CREATE FUNCTION guard_match_player() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF ROW(NEW.match_id, NEW.seat, NEW.participant_count, NEW.user_id, NEW.character_id, NEW.participant_kind)
        IS DISTINCT FROM ROW(OLD.match_id, OLD.seat, OLD.participant_count, OLD.user_id, OLD.character_id, OLD.participant_kind) THEN
        RAISE EXCEPTION 'Identitas kursi match tidak dapat diganti' USING ERRCODE = '23514';
    END IF;
    IF NEW.control_epoch < OLD.control_epoch OR
        (NEW.controller_kind <> OLD.controller_kind AND NEW.control_epoch <= OLD.control_epoch) THEN
        RAISE EXCEPTION 'Perubahan controller memerlukan control_epoch baru' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER match_players_guard BEFORE UPDATE ON match_players
    FOR EACH ROW EXECUTE FUNCTION guard_match_player();

CREATE TABLE match_commands (
    match_id uuid NOT NULL REFERENCES matches(id),
    command_id uuid NOT NULL,
    actor_seat smallint NOT NULL,
    actor_user_id uuid NOT NULL,
    controller_kind text NOT NULL CHECK (controller_kind IN ('human', 'cpu')),
    control_epoch sequence_number NOT NULL,
    request_hash sha256_hex NOT NULL,
    action_type text NOT NULL CHECK (action_type IN ('roll.start', 'roll.stop', 'card.use',
        'jutsu.use', 'scroll.use', 'choice.select', 'move.choose', 'tile.buy', 'tile.upgrade',
        'tile.sell', 'technique.select', 'battle.confirm', 'surrender.request', 'surrender.cancel', 'surrender.confirm')),
    payload json_object NOT NULL,
    expected_state_version sequence_number NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now(),
    applied_tick sequence_number NOT NULL,
    outcome text NOT NULL CHECK (outcome IN ('accepted', 'rejected')),
    result_state_version sequence_number NOT NULL,
    last_event_sequence sequence_number NOT NULL,
    error_code text,
    response json_object NOT NULL,
    PRIMARY KEY (match_id, command_id),
    FOREIGN KEY (match_id, actor_seat, actor_user_id) REFERENCES match_players(match_id, seat, user_id),
    CHECK ((outcome = 'rejected') = (error_code IS NOT NULL))
);
COMMENT ON TABLE match_commands IS 'Receipt persisten sepanjang umur match. CPU juga memakai command_id stabil. actor_user_id berasal dari sesi/roster, bukan payload. Retry harus cocok hash; command lama ditolak lewat epoch/version di Go sebelum mutasi.';

CREATE TABLE match_events (
    match_id uuid NOT NULL REFERENCES matches(id),
    sequence sequence_number NOT NULL CHECK (sequence > 0),
    state_version sequence_number NOT NULL,
    server_tick sequence_number NOT NULL,
    event_type text NOT NULL CHECK (char_length(event_type) BETWEEN 1 AND 100),
    command_id uuid,
    actor_seat smallint,
    payload json_object NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (match_id, sequence),
    FOREIGN KEY (match_id, command_id) REFERENCES match_commands(match_id, command_id)
        DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY (match_id, actor_seat) REFERENCES match_players(match_id, seat)
);
COMMENT ON TABLE match_events IS 'Log internal termasuk controller.changed pada sequence match yang sama. UPDATE matches ... RETURNING mengalokasikan sequence di bawah row lock; jangan pakai MAX(sequence)+1 tanpa lock. Proyeksikan payload per user sebelum WS.';

CREATE TABLE match_snapshots (
    match_id uuid NOT NULL REFERENCES matches(id),
    state_version sequence_number NOT NULL,
    last_event_sequence sequence_number NOT NULL,
    server_tick sequence_number NOT NULL,
    state_schema_version integer NOT NULL CHECK (state_schema_version > 0),
    rng_state bigint NOT NULL CHECK (rng_state BETWEEN 0 AND 4294967295),
    rng_draw_count sequence_number NOT NULL,
    snapshot json_object NOT NULL,
    state_hash sha256_hex NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (match_id, state_version)
);
COMMENT ON TABLE match_snapshots IS 'Arsip checkpoint lengkap, termasuk match_players, policy_state, reclaim, deadline dan wheel. matches adalah checkpoint terkini; snapshot historis untuk audit/replay. Full server snapshot tidak sama dengan MatchSnapshot API.';

CREATE TABLE cpu_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid NOT NULL,
    seat smallint NOT NULL,
    control_epoch sequence_number NOT NULL,
    decision_id text NOT NULL CHECK (char_length(decision_id) BETWEEN 1 AND 160),
    expected_state_version sequence_number NOT NULL,
    ai_policy_version text NOT NULL,
    command_id uuid NOT NULL DEFAULT gen_random_uuid(),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'cancelled', 'unresolved')),
    due_tick sequence_number NOT NULL,
    context json_object NOT NULL DEFAULT '{}',
    trace json_object,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (match_id, seat, decision_id, control_epoch),
    UNIQUE (match_id, command_id),
    FOREIGN KEY (match_id, seat) REFERENCES match_players(match_id, seat)
);
CREATE INDEX cpu_jobs_pending_idx ON cpu_jobs(match_id, due_tick) WHERE status IN ('pending', 'running');
COMMENT ON TABLE cpu_jobs IS 'Satu worker per match pada MVP. Sebelum commit cek controller=cpu, epoch, versi dan decision_id aktif; sesudah reclaim batalkan job lama. unresolved menyimpan trace, bukan membuat hasil RNG pengganti.';

CREATE TABLE match_results (
    match_id uuid NOT NULL,
    seat smallint NOT NULL,
    display_order smallint NOT NULL CHECK (display_order BETWEEN 0 AND 3),
    badge_id smallint NOT NULL CHECK (badge_id BETWEEN 0 AND 3),
    chakra integer NOT NULL CHECK (chakra BETWEEN -9999 AND 99999),
    PRIMARY KEY (match_id, seat),
    UNIQUE (match_id, display_order),
    FOREIGN KEY (match_id, seat) REFERENCES match_players(match_id, seat)
);
COMMENT ON TABLE match_results IS 'Urutan tampilan dan badge disimpan terpisah; ties boleh punya badge sama. Ikuti GAME_RULE, jangan hitung badge dari display_order dan jangan memberi unlock cerita dari hasil Party.';

-- 4. Chat, block, moderasi dan otorisasi voice.
CREATE TABLE chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid NOT NULL REFERENCES rooms(id),
    sender_user_id uuid REFERENCES users(id),
    sender_display_name text,
    kind text NOT NULL DEFAULT 'user' CHECK (kind IN ('user', 'system')),
    body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 300),
    client_message_id uuid,
    request_hash sha256_hex,
    created_at timestamptz NOT NULL DEFAULT now(),
    hidden_at timestamptz,
    UNIQUE (id, room_id),
    UNIQUE (room_id, sender_user_id, client_message_id),
    CHECK ((kind = 'user' AND sender_user_id IS NOT NULL AND sender_display_name IS NOT NULL
        AND client_message_id IS NOT NULL AND request_hash IS NOT NULL)
        OR (kind = 'system' AND sender_user_id IS NULL AND sender_display_name IS NULL
        AND client_message_id IS NULL AND request_hash IS NULL))
);
CREATE INDEX chat_room_cursor_idx ON chat_messages(room_id, created_at DESC, id DESC);
CREATE INDEX chat_sender_idx ON chat_messages(sender_user_id);
CREATE INDEX chat_retention_idx ON chat_messages(created_at);
COMMENT ON TABLE chat_messages IS 'Validasi membership dan rate limit 5 pesan/10 detik di Go. UNIQUE mencegah retry ganda; cocokkan request_hash. Teks polos, bukan HTML; hidden_at diproyeksikan sesuai kebijakan moderasi.';

CREATE TABLE user_blocks (
    user_id uuid NOT NULL REFERENCES users(id),
    target_user_id uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, target_user_id),
    CHECK (user_id <> target_user_id)
);
CREATE INDEX user_blocks_target_idx ON user_blocks(target_user_id);

CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id uuid NOT NULL REFERENCES users(id),
    target_user_id uuid NOT NULL REFERENCES users(id),
    room_id uuid NOT NULL REFERENCES rooms(id),
    match_id uuid,
    message_id uuid,
    category text NOT NULL CHECK (category IN ('chat_abuse', 'voice_abuse', 'cheating', 'other')),
    description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 1000),
    evidence json_object NOT NULL DEFAULT '{}',
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz,
    resolution_note text,
    FOREIGN KEY (match_id, room_id) REFERENCES matches(id, room_id),
    FOREIGN KEY (message_id, room_id) REFERENCES chat_messages(id, room_id),
    CHECK (reporter_user_id <> target_user_id),
    CHECK ((status IN ('resolved', 'dismissed')) = (resolved_at IS NOT NULL))
);
CREATE INDEX reports_queue_idx ON reports(status, created_at);
CREATE INDEX reports_reporter_idx ON reports(reporter_user_id);
CREATE INDEX reports_target_idx ON reports(target_user_id);
CREATE INDEX reports_room_idx ON reports(room_id);
CREATE INDEX reports_match_idx ON reports(match_id);
CREATE INDEX reports_message_idx ON reports(message_id);
COMMENT ON TABLE reports IS 'Go memeriksa akses pelapor dan target/konteks. FK menjamin message/match satu room. Retensi chat 7 hari mengecualikan pesan yang dirujuk laporan; evidence bukan rekaman audio.';

CREATE TABLE voice_grants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid NOT NULL REFERENCES rooms(id),
    user_id uuid NOT NULL REFERENCES users(id),
    session_id uuid NOT NULL,
    token_jti_hash token_digest NOT NULL UNIQUE,
    provider_room_name text NOT NULL,
    provider_identity text NOT NULL,
    issued_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    revoke_reason text,
    FOREIGN KEY (session_id, user_id) REFERENCES sessions(id, user_id),
    CHECK (expires_at > issued_at)
);
CREATE INDEX voice_grants_member_idx ON voice_grants(room_id, user_id) WHERE revoked_at IS NULL;
CREATE INDEX voice_grants_session_idx ON voice_grants(session_id);
CREATE INDEX voice_grants_expiry_idx ON voice_grants(expires_at);
COMMENT ON TABLE voice_grants IS 'Metadata grant audio-only LiveKit; tidak menyimpan JWT asli, paket audio atau rekaman. Revoke DB harus disertai remove participant SFU melalui outbox; revoked_at saja tidak mencabut JWT yang sudah terbit.';

-- 5. Deduplikasi HTTP/WS dan pekerjaan sesudah commit.
CREATE TABLE request_receipts (
    user_id uuid NOT NULL REFERENCES users(id),
    transport text NOT NULL CHECK (transport IN ('http', 'ws')),
    operation text NOT NULL CHECK (char_length(operation) BETWEEN 1 AND 100),
    request_id uuid NOT NULL,
    request_hash sha256_hex NOT NULL,
    http_status smallint CHECK (http_status BETWEEN 100 AND 599),
    response json_object,
    response_ciphertext bytea,
    response_key_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    PRIMARY KEY (user_id, transport, operation, request_id),
    CHECK ((transport = 'http') = (http_status IS NOT NULL)),
    CHECK ((response IS NOT NULL AND response_ciphertext IS NULL AND response_key_id IS NULL)
        OR (response IS NULL AND response_ciphertext IS NOT NULL AND response_key_id IS NOT NULL)),
    CHECK (transport <> 'http' OR (expires_at IS NOT NULL AND expires_at >= created_at + interval '24 hours')),
    CHECK (expires_at IS NULL OR expires_at > created_at)
);
CREATE INDEX request_receipts_expiry_idx ON request_receipts(expires_at) WHERE expires_at IS NOT NULL;
COMMENT ON TABLE request_receipts IS 'Simpan hanya receipt final dalam transaksi mutasi. HTTP key user+operation+Idempotency-Key: minimal 24h. WS key user+type+requestId; expires_at NULL sampai retensi aman. match_commands dan chat_messages tetap menjadi dedup domain. Respons berisi kode privat memakai ciphertext.';

CREATE TABLE outbox_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    topic text NOT NULL CHECK (char_length(topic) BETWEEN 1 AND 100),
    aggregate_id uuid NOT NULL,
    deduplication_key text NOT NULL UNIQUE,
    payload json_object NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    available_at timestamptz NOT NULL DEFAULT now(),
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    delivered_at timestamptz,
    last_error text
);
CREATE INDEX outbox_pending_idx ON outbox_events(available_at, id) WHERE delivered_at IS NULL;
COMMENT ON TABLE outbox_events IS 'Ditulis bersama transaksi gameplay/room/chat/voice. Worker pasca-commit mengirim minimal sekali, consumer dedup. Payload berupa referensi event/room/grant dan identifier, bukan password/token; worker memproyeksikan event ke penerima yang masih berhak.';

-- updated_at metadata saja: versi domain wajib dinaikkan oleh service Go.
CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := clock_timestamp();
    RETURN NEW;
END;
$$;
DO $$
DECLARE table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY['users', 'user_credentials', 'user_preferences', 'arenas', 'rooms', 'matches', 'cpu_jobs'] LOOP
        EXECUTE format('CREATE TRIGGER touch_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', table_name);
    END LOOP;
END;
$$;

-- Seed satu-satunya arena MVP. Hash adalah SHA-256 byte berkas pada tanggal skema.
-- Saat artefak berubah, migrasikan hash arena; match lama mempertahankan hash pin.
INSERT INTO arenas (
    id, map_id, name, enabled, tile_count, world_width, world_height,
    thumbnail_path, board_data_path, asset_manifest_path,
    rules_hash, ai_rules_hash, board_data_hash, asset_manifest_hash
) VALUES (
    'arena-1', 0, 'Arena 1', true, 22, 640, 480,
    'image/arena1/map_00.png', 'image/arena1/map_00.json', 'manifest.json',
    'bb2fbebe6aabbb690d13df81cf081f2d218f8a095a494088b20942fc200d1bd3',
    '39351d42f3d48e379ca698e770a9d1cb6cd4105d55d31ed26302a56f860180d3',
    '6a1cc426b74219224434baa9c7ebe3b8638c9540607c9255a7dcce9cc23a2042',
    '03f6057d6e646a453408650c3379ffcf01ce6ca9976bb49bab4462c95ba40fc1'
);
INSERT INTO schema_migrations(version) VALUES ('0001_database_naruto');

-- Tidak memberi akses DB kepada client browser atau role PUBLIC.
-- Runtime Go perlu role non-superuser dengan USAGE schema, DML tabel dan USAGE
-- sequence; provision di luar file ini sesuai deployment. Fungsi tetap invoker.
REVOKE ALL ON SCHEMA naruto FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA naruto FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA naruto FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA naruto FROM PUBLIC;
COMMIT;

-- KONTRAK TRANSAKSI BACKEND (wajib saat implementasi; bukan seluruhnya trigger):
-- 1. Register: users + user_credentials + user_preferences + email_tokens atomik.
--    Email dinormalisasi lower(trim) tanpa membuang +alias/titik. Rate limit auth
--    juga berdasarkan IP di service; failed_login_count bukan satu-satunya limit.
-- 2. Ambil receipt dahulu; retry dengan hash berbeda -> IDEMPOTENCY_CONFLICT.
--    Reserve serialisasi key dengan advisory transaction lock atau INSERT receipt
--    final dalam transaksi mutasi: unique conflict harus rollback seluruh mutasi
--    lalu baca hasil pemenang. Jangan commit efek sebelum receipt tersimpan.
-- 3. Urutan lock: users (urut UUID bila lebih dari satu), rooms, matches, players.
--    Join/start/settings/leave: rooms FOR UPDATE; cek auth, status, roomVersion,
--    capacity, arena enabled, ready, assets hash dan jumlah manusia 2..4.
--    Saat ganti capacity, rapikan seat di transaksi bila perlu sebelum shrink.
--    Edit setting/karakter membatalkan ready sesuai kontrak; naikkan room_version.
--    Host migration memperbarui rooms.host_user_id sebelum akhir transaksi leave.
--    FK host deferred memungkinkan create room + host member pada transaksi sama.
-- 4. Start: salin settings/hash/roster; insert tepat participant_count match_players
--    dengan seat berurutan 0..N-1; checkpoint awal; event awal; rooms.status=playing
--    dan active_match_id; receipt/outbox; COMMIT, baru ACK. Kunci aturan start
--    dan roster tetap di Go; SQL bukan pengganti validasi state machine.
-- 5. Tiap mutasi match: lock matches; cek actor/epoch/stateVersion/legal action;
--    hitung kandidat deterministik; tulis command, state/RNG/tick, players/AI,
--    events, jobs, snapshot bila perlu, receipt dan outbox satu transaksi.
--    state_version naik setiap mutasi persisten; sequence naik setiap event.
--    Posisi/kartu/petak berada dalam state JSONB, bukan state kedua yang berbeda.
--    Heartbeat/animasi render tidak menulis snapshot 60 kali per detik. Persist
--    tick penerimaan input/stop roulette dan konteks yang dibutuhkan replay.
-- 6. Disconnect: controller_kind=cpu, epoch naik, event controller.changed,
--    job CPU dan state_hash diperbarui atomik. participant_kind tetap human.
--    Reclaim: persist reclaim_requested_at; di batas keputusan ubah ke human,
--    epoch naik, clear reclaim_requested_at, batalkan job lama dan commit event.
--    Kegagalan voice saja tidak memicu CPU; semua manusia offline tetap lanjut.
-- 7. Finish: tepat N match_results, reason/winner/ended_at, rooms.status=results.
--    Aborted adalah kegagalan operasional, bukan hasil menang asli; kosongkan
--    active_match_id dan kembalikan room waiting/closed sesuai penanganan error.
--    Rematch: clear active_match_id, status waiting dan reset ready, buat match baru.
-- 8. Logout/reset/leave/kick: revoke sesi/grant yang relevan; enqueue SFU removal.
--    Logout tidak menyerah: CPU mengambil alih bila sedang match.
--    Match aktif tetap mempertahankan room_members/kursi untuk pemilik reconnect.
-- 9. Snapshot API dan history memeriksa membership/participant; jangan SELECT *
--    lalu JSON encode. Private RNG/AI/tangan lawan/secret tidak boleh bocor.
-- 10. Cleanup bertahap: tiket/email token/sesi kedaluwarsa (bersihkan dependensi
--     connections/voice dahulu), receipt HTTP >=24h, chat >7 hari kecuali laporan.
--     Retensi match/events/commands/snapshot harus satu kebijakan; jangan hapus
--     receipt command match aktif. Tidak ada ON DELETE CASCADE histori gameplay.
--     Soft delete user; anonimisasi/retensi dirancang lewat migrasi terpisah.
