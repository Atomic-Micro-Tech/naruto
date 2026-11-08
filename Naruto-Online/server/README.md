# Server Naruto Online

Ini adalah struktur awal modul Go untuk backend lokal. Kontrak HTTP dan WebSocket ada di [`../api/naruto.yaml`](../api/naruto.yaml), skema PostgreSQL di [`../scheme/database-naruto.sql`](../scheme/database-naruto.sql), dan alur MVP di [`../PLAN.md`](../PLAN.md). Aturan game dan CPU ada di `../../GAME_RULE.md` serta `../../AI_RULE.md`.

Struktur mengikuti `.agents/skills/api-creator/SKILL.md`. Folder `backendexample/` yang disebut skill belum tersedia di repositori ini, sehingga pembagian tanggung jawab di bawah mengikuti instruksi tertulis skill. Direktori yang masih kosong dilacak dengan `.gitkeep`.

```text
server/
├── go.mod                 # akar modul Go
├── cmd/api/               # entry point API
├── configs/               # config.json saat bagian yang diperlukan sudah ditetapkan
├── controller/            # decoding/validasi request dan pemilihan respons HTTP
├── internal/              # interface use case, request/param/data, config, koneksi, error
│   ├── auth/              # primitive hash password/token/sesi
│   ├── game/              # state machine, aturan dan RNG deterministik
│   ├── cpu/               # kebijakan AI dan konteks takeover/reclaim
│   └── voice/             # adapter layanan suara
├── middleware/            # autentikasi, otorisasi, CSRF, Origin, pembatasan akses
├── models/                # model tabel dan interface repo per model
├── repo/                  # implementasi query PostgreSQL
├── routes/                # registrasi seluruh route HTTP per tag
├── server/                # lifecycle server HTTP/WS
├── telemetry/             # setup dan lifecycle OpenTelemetry
├── usecase/               # implementasi bisnis per tag OpenAPI
├── view/                  # serialisasi respons HTTP
├── worker/                # pekerjaan CPU, outbox, cleanup
├── testcase/              # test langsung pada use case saja
└── integration/           # test lintas paket dan database sementara
```

Alur HTTP: `routes → middleware → controller → usecase → models/repo`; hasil diserialisasi oleh `view`. Route harus mengikuti `operationId` dan tag pada OpenAPI. File tag yang akan dibutuhkan saat implementasi meliputi `internal/Auth.go` dan `usecase/AuthCase.go`, `internal/Room.go` dan `usecase/RoomCase.go`, serta pasangan serupa untuk `System`, `Arena`, `Match`, `Chat`, `Voice`, `Moderation`, dan `Realtime`. `usecase/MockData.go` dibuat sebelum implementasi use case, memakai data sintetis untuk pengujian.

Kode Go baru memakai nama file CamelCase seperti `routes/Routes.go`, `server/HttpServer.go`, `middleware/Middleware.go`, `internal/Connection.go`, dan `view/Json.go`. Model SQL berada di `models/`, dan semua query berada di `repo/`. Proses startup kelak memuat konfigurasi, membuka koneksi database, menginisialisasi telemetry, memasang routes, lalu menyalakan server. Worker dan koneksi ditutup dengan urutan aman ketika proses berhenti.

`configs/config.json` kini mengatur alamat HTTP dan nama variabel lingkungan untuk URL PostgreSQL. Kredensial database, kunci sesi, kunci enkripsi, dan secret layanan suara diberikan dari lingkungan lokal, tanpa menyimpannya di Git.

## Server HTTP dan route

Butuh Go 1.25+ dan PostgreSQL 15+ yang berjalan. Dari folder `Naruto-Online/server`:

```sh
export NARUTO_DATABASE_URL='postgres://USER:PASSWORD@127.0.0.1:5432/DB?sslmode=disable'
go run ./cmd/api
```

Server mendengarkan `127.0.0.1:8080` dan berhenti dengan SIGINT/SIGTERM. Seluruh 26 method/path HTTP di `api/naruto.yaml` sudah didaftarkan di `routes/Routes.go`, dikelompokkan menurut tag. `/healthz` aktif dan mengembalikan `{"status":"ok"}`. `/readyz` memeriksa PostgreSQL, tetapi tetap mengembalikan 503 selama API bisnis belum diterapkan; ini mencegah health check menyatakan layanan siap terlalu dini.

Handler bisnis saat ini mengembalikan 503 dalam bentuk `components.schemas.Error`. Route privat menolak permintaan tanpa cookie dengan 401 dan tetap menolak cookie yang belum dapat divalidasi dengan 503. Upgrade `/v1/ws` belum aktif; tiket satu kali pakai dan transport WebSocket harus diterapkan sebelum respons 101 dapat diberikan. Tidak ada operasi yang mengembalikan data demo sebagai data produksi.

Kode mengikuti bentuk respons `naruto.yaml` secara langsung, termasuk `{"status":"ok"}` dan `{"error":...}`. Kontrak umum `ResponseAPI` pada skill `api-creator` berbeda dari bentuk respons spesifikasi proyek ini; untuk route ini bentuk OpenAPI dipertahankan. OpenTelemetry telah dipasang pada HTTP dan tracer, tetapi exporter belum dikonfigurasi. Jalankan `go test ./...` untuk memeriksa registrasi route dan perilaku dasar.

## Model PostgreSQL

`models/` sudah memuat satu file CamelCase untuk masing-masing dari 25 tabel di `scheme/database-naruto.sql`. Setiap file mempunyai struct, constructor `New<Model>`, getter/setter tiap kolom, dan interface `<Model>Repo`. Interface ini adalah kontrak; implementasi query di `repo/` akan ditambahkan bersama use case yang memerlukannya.

Nama kolom tercatat dalam tag `db`. Semua field memakai `json:"-"` karena model persistence dapat berisi password hash, token hash, RNG, tangan kartu, dan state AI privat; controller perlu membentuk DTO API yang aman. UUID memakai `github.com/google/uuid`, `numeric(4,3)` memakai `github.com/shopspring/decimal`, JSONB memakai `json.RawMessage`, timestamp memakai `time.Time`, dan angka SQL memakai lebar yang sesuai. Kolom nullable memakai pointer atau `nil` untuk `[]byte`/`json.RawMessage`. Getter/setter untuk byte dan JSONB menyalin slice agar perubahan di luar model tidak mengubah data secara diam-diam.

Constructor mengembalikan nilai kosong untuk dipakai saat scan/penyusunan row. Default SQL, rentang nilai, enum, dan hubungan antartabel tetap divalidasi PostgreSQL dan logika bisnis; memanggil constructor saja tidak menghasilkan row siap `INSERT`.
