# Server Naruto Online

Backend lokal Go dengan PostgreSQL, mengikuti [OpenAPI](../api/naruto.yaml), [skema database](../scheme/database-naruto.sql), dan [rencana MVP](../PLAN.md). Modul: `narutoserver`.

## Implementasi saat ini

- Register/login email, Argon2id, verifikasi email, reset password, cookie sesi HttpOnly, CSRF, refresh dan pencabutan sesi.
- Daftar arena 1; daftar room publik, room privat dengan kode undangan, create/join atomik, pembatasan kapasitas, pagination dan idempotensi persisten.
- WebSocket dengan tiket sekali pakai selama maksimal 30 detik, Origin allowlist, satu koneksi pengendali per akun, heartbeat dan pengecekan pencabutan sesi.
- Lobby: settings, ready/karakter/hash aset, rotasi undangan, kick, leave, migrasi host menurut join order, dan penutupan room kosong. Perubahan settings membatalkan ready. Penyusutan kapasitas merapikan seat selama jumlah anggota masih muat.
- Chat teks, deduplikasi pesan, batas 5 pesan/10 detik, riwayat yang menyaring akun diblokir, block/unblock dan laporan dengan konteks room.
- Penerbitan JWT LiveKit khusus mikrofon, maksimal lima menit, dengan pemeriksaan membership. Pencabutan sesi/leave/kick/voice-disabled menjadwalkan penghapusan peserta SFU melalui outbox.
- Proyeksi snapshot pertandingan untuk peserta yang berhak; kartu sendiri dipisahkan dari kartu lawan, RNG dan state AI.
- Worker outbox untuk email/event/voice serta pembersihan anggota lobby yang melewati tenggat reconnect.

**Mesin gameplay dan CPU belum diimplementasikan.** `room.start` memeriksa host/roster/ready, lalu menolak dengan `CPU_CONTEXT_UNRESOLVED`. `match.command` dan `match.reclaim` juga belum mengeksekusi permainan. Disconnect saat pertandingan belum menjalankan CPU, dan leave saat playing belum didukung. Tidak ada match contoh yang dipakai sebagai data produksi. Ini belum merupakan MVP game yang selesai atau replika 1:1.

`GET /v1/matches/{matchId}` dan `match.resume` membaca checkpoint tersimpan dengan format proyeksi:
`public`, `privateBySeat`, dan `allowedBySeat`. Field DTO yang diizinkan didefinisikan di `internal/MatchProjection.go`. Checkpoint yang belum cocok ditolak; endpoint tidak mengirim JSON state database mentah. Integrasi engine perlu menulis format ini secara atomik bersama roster, versi dan event.

## Dev menggunakan Compose

Jalankan perintah berikut dari folder `Naruto-Online/server`. Gunakan Go 1.25+, Python 3.9+ dan Docker Compose. [compose.yaml](../compose.yaml) menyediakan PostgreSQL 15 dengan database `mydb`, user `myuser`, password dev `mypassword`, dan port host `5432`. API Go tetap dijalankan di host; Compose saat ini belum menjalankan API, SMTP atau LiveKit.

```sh
docker compose -f ../compose.yaml up -d postgres
docker compose -f ../compose.yaml exec -T postgres pg_isready -U myuser -d mydb
```

Tunggu sampai `pg_isready` menyatakan `accepting connections`, kemudian siapkan Python dan database:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r scripts/requirements.txt

python scripts/migrate.py --status
python scripts/migrate.py
python scripts/seed.py
```

`configs/config.json` sudah memakai URL PostgreSQL sesuai Compose: `postgres://myuser:mypassword@127.0.0.1:5432/mydb?sslmode=disable`. API Go serta skrip migrasi/seed memakai nilai ini secara default, sehingga dev tidak perlu mengekspor `NARUTO_DATABASE_URL`. Host `127.0.0.1` dipakai karena API dan skrip berjalan di host. Untuk database lain, set `NARUTO_DATABASE_URL`; nilai environment mengalahkan config. Environment yang disetel kosong ditolak. Nilai config ini dicocokkan dengan Compose, bukan dibaca ulang otomatis dari YAML; jika kredensial/port Compose berubah, sesuaikan URL config atau override tersebut.

`migrate.py` menjalankan file Python berurutan dari `migrations/`, memakai transaksi dan advisory lock, lalu mencatat versinya di `naruto.schema_migrations`. Migrasi `0001_database_naruto.py` menggunakan `../scheme/database-naruto.sql` sebagai baseline yang sama dengan server. Database yang sudah menerapkan SQL tersebut dikenali sebagai `applied`; menjalankan migrasi ulang tidak membuat tabel atau arena ganda. Perubahan skema berikutnya ditambahkan sebagai file `0002_*.py` dengan `VERSION` dan fungsi `apply(connection)`, tanpa `BEGIN`/`COMMIT` sendiri. Tidak tersedia perintah drop/reset otomatis.

Seed untuk pengujian manual:

| Email | Nama | Posisi awal |
|---|---|---|
| `naruto@example.test` | Naruto Dev | Host `DEV Arena 1 - A`, kapasitas 4 |
| `sasuke@example.test` | Sasuke Dev | Host `DEV Arena 1 - B`, kapasitas 2 |
| `sakura@example.test` | Sakura Dev | Belum bergabung room |
| `kakashi@example.test` | Kakashi Dev | Belum bergabung room |

Password awal seluruh akun: **`NarutoDev!2026`**, hanya untuk data dev sintetis. Untuk akun baru dengan password lain, set `NARUTO_SEED_PASSWORD` sebelum menjalankan seed. Hash Argon2id mengikuti parameter backend Go; seed tidak membuat cookie/sesi atau melewati login. Akun baru ditandai email terverifikasi agar pengujian login tidak memerlukan SMTP.

Kedua room publik memakai arena 1, aturan normal, target chakra 3000 dan voice nonaktif. Host ditandai `disconnected`, `ready=false`, tanpa koneksi palsu; login lalu buka WebSocket agar status terhubung. Room fixture tetap tersedia sampai dipakai/dikeluarkan melalui alur aplikasi. Seed tidak membuat match, kartu, atau hasil gameplay contoh.

Seed dapat dijalankan ulang: akun/room memakai UUID stabil, password dan state yang sudah ada dipertahankan, dan room tidak dibuat bila host telah bergabung room lain. Benturan email dengan akun di luar fixture membatalkan transaksi. Gunakan `python scripts/seed.py --accounts-only` bila hanya membutuhkan akun tanpa room. `NARUTO_SEED_PASSWORD` tidak mereset password akun lama; gunakan alur reset password aplikasi.

Buat kunci aplikasi satu kali dengan `openssl rand -base64 32`, simpan secara lokal, lalu export nilai yang sama setiap restart:

```sh
export NARUTO_APP_KEY='KUNCI_BASE64_32_BYTE_YANG_DISIMPAN_LOKAL'
go run ./cmd/api
```

Server membaca `configs/config.json` dan environment proses; file `.env` tidak dimuat otomatis. Kunci dipakai untuk CSRF, kode undangan, cursor, email outbox dan receipt terenkripsi. Menggantinya sembarangan membuat data terenkripsi lama tidak dapat dibaca.

Konfigurasi bawaan:

| Komponen | Alamat |
|---|---|
| HTTP | `127.0.0.1:8080` |
| Origin web | `http://localhost:5173`, `http://127.0.0.1:5173` |
| SMTP lokal | `127.0.0.1:1025` |
| LiveKit | `ws://localhost:7880` |

Jalankan penerima SMTP lokal, misalnya Mailpit, pada alamat tersebut. Pengiriman gagal disimpan untuk retry; register mengembalikan `verificationEmailSent=false` bila email belum terkirim. Token verifikasi/reset dapat diambil dari inbox lokal dan dikirim ke endpoint terkait. Adapter SMTP saat ini khusus lingkungan lokal tanpa autentikasi/TLS.

Voice memerlukan server LiveKit serta `LIVEKIT_API_KEY` dan `LIVEKIT_API_SECRET`. Tanpa kredensial, endpoint token voice mengembalikan 503. Pengujian otomatis memeriksa JWT audio-only dan revocation/outbox database; aliran audio mikrofon dan pemutusan peserta pada SFU nyata masih perlu pengujian dengan LiveKit. Pada deployment sendiri, JWT yang sudah terbit tetap harus diperhitungkan sampai kedaluwarsa; penghapusan peserta aktif bukan pencabutan kriptografis JWT.

Gunakan hostname yang konsisten antara web dan API agar cookie SameSite bekerja, serta `credentials: "include"` pada fetch. Mutasi menyertakan Origin yang diizinkan dan `X-CSRF-Token` dari login/me/refresh. Create room, join dan report juga memerlukan `Idempotency-Key` UUID.

`/healthz` memeriksa proses. `/readyz` memeriksa versi skema dan data arena; status ready menyatakan layanan API siap, bukan bahwa engine gameplay sudah tersedia.

## Arsitektur dan batas operasional

Alur: `routes → middleware → controller → usecase → models/repo → view`. Semua SQL bisnis berada di `repo/`; constructor use case menerima context dan repository dibentuk per operasi. Model mencakup 25 tabel dengan tag `db` dan `json:"-"`. Bentuk respons dan status HTTP mengikuti OpenAPI, termasuk 201/202/204; tidak ditambah envelope generik yang mengubah kontrak.

HTTP receipt tersimpan minimal 24 jam. Hasil dengan kode privat dienkripsi. Cursor terenkripsi dan terikat user, resource serta filter. JSON ambigu, field asing/duplikat, UUID tidak sah, Origin dan CSRF yang salah ditolak.

Jalankan **satu proses API/worker** untuk MVP lokal. Hub WebSocket dan rate limiter berada dalam memori. Beberapa proses membutuhkan fan-out event dan rate limiter bersama; worker outbox pada proses lain tidak dapat menjangkau socket di proses ini. Event outbox dikirim minimal sekali; client tetap perlu deduplikasi berdasarkan ID/versi. Retensi jangka panjang email token, sesi, chat dan event belum dijadwalkan.

OpenTelemetry memasang instrumentasi HTTP dan span controller; exporter belum dikonfigurasi. URL upgrade bertiket dikecualikan dari instrumentasi HTTP agar tiket tidak menjadi atribut URL trace. Shutdown menutup socket, menunggu handler dan worker, lalu menutup koneksi database.

## Pengujian

```sh
go test ./...
go vet ./...
```

Tes use case dan integrasi dilewati bila database pengujian tidak diberikan. Pisahkan database test dari `mydb` menggunakan layanan Compose yang sama. Buat `naruto_test` satu kali; lewati perintah `createdb` jika database tersebut sudah ada:

```sh
docker compose -f ../compose.yaml exec -T postgres createdb -U myuser naruto_test
export NARUTO_TEST_DATABASE_URL='postgres://myuser:mypassword@127.0.0.1:5432/naruto_test?sslmode=disable'
python scripts/migrate.py --test
python scripts/seed.py --test
go test -p 1 -race ./... -count=1
```

Flag `--test` mewajibkan `NARUTO_TEST_DATABASE_URL` dan tidak pernah fallback ke database dev. Tanpa flag ini skrip memakai URL dari `configs/config.json`, dengan override melalui `NARUTO_DATABASE_URL`. Seed tidak wajib untuk suite Go yang membuat akun sintetisnya sendiri, tetapi dapat dipakai untuk pengujian manual API pada database test.

Tes integrasi skrip Python juga tersedia:

```sh
python -m unittest discover -s scripts -p 'test_*.py' -v
```

Tes ini memakai koneksi `NARUTO_TEST_DATABASE_URL` untuk membuat database sementara bernama `naruto_scripts_*`, lalu menghapus database yang dibuatnya setelah tes. Role test membutuhkan izin `CREATEDB` (role bawaan Compose memilikinya). Cakupannya meliputi rollback migrasi yang gagal, pengulangan migrasi/seed, benturan email, dan pelestarian password serta room yang sudah ditutup.

Gunakan `-p 1` ketika suite berbagi database: tiap proses tes mempunyai SMTP dan hub socket sendiri, sehingga worker antarproses tidak boleh saling mengambil event. Tes memakai akun sintetis, SMTP sementara dan server HTTP/WebSocket nyata; tidak menyentuh database aplikasi jika URL test mengarah ke database terpisah. Data tes tetap berada di database test setelah suite selesai.

Cakupan meliputi register/login/verifikasi/reset, rotasi sesi, CSRF, Origin, kapasitas room pada join serentak, retry/conflict idempotensi, privasi room, tiket sekali pakai, chat/block/report, voice JWT, migrasi host, penutupan room, dan proyeksi kartu/RNG/AI.

Untuk menghentikan PostgreSQL dev tanpa menghapus container/data:

```sh
docker compose -f ../compose.yaml stop postgres
```

Konfigurasi Compose saat ini belum mendefinisikan named volume untuk PostgreSQL; gunakan `stop`/`start` selama dev, bukan menganggap penghapusan atau pembuatan ulang container akan mempertahankan database.
