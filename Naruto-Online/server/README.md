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

## Menjalankan lokal

Gunakan Go 1.25+ dan PostgreSQL 15+. Dari direktori ini, arahkan URL ke database pengembangan milik Anda:

```sh
export NARUTO_DATABASE_URL='postgres://USER:PASSWORD@127.0.0.1:5432/DB?sslmode=disable'
```

Untuk database kosong, terapkan skema satu kali:

```sh
psql "$NARUTO_DATABASE_URL" -v ON_ERROR_STOP=1 -f ../scheme/database-naruto.sql
```

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

Tes use case dan integrasi dilewati bila database pengujian tidak diberikan. Buat database PostgreSQL terpisah, terapkan skema yang sama, lalu jalankan:

```sh
export NARUTO_TEST_DATABASE_URL='postgres://USER:PASSWORD@127.0.0.1:55433/TEST_DB?sslmode=disable'
go test -p 1 -race ./... -count=1
```

Gunakan `-p 1` ketika suite berbagi database: tiap proses tes mempunyai SMTP dan hub socket sendiri, sehingga worker antarproses tidak boleh saling mengambil event. Tes memakai akun sintetis, SMTP sementara dan server HTTP/WebSocket nyata; tidak menyentuh database aplikasi jika URL test mengarah ke database terpisah. Data tes tetap berada di database test setelah suite selesai.

Cakupan meliputi register/login/verifikasi/reset, rotasi sesi, CSRF, Origin, kapasitas room pada join serentak, retry/conflict idempotensi, privasi room, tiket sekali pakai, chat/block/report, voice JWT, migrasi host, penutupan room, dan proyeksi kartu/RNG/AI.
