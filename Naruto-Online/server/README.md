# Server Naruto Online

Ini adalah struktur awal modul Go untuk backend lokal. Kontrak HTTP dan WebSocket ada di [`../api/naruto.yaml`](../api/naruto.yaml), skema PostgreSQL di [`../scheme/database-naruto.sql`](../scheme/database-naruto.sql), dan alur MVP di [`../PLAN.md`](../PLAN.md). Aturan game dan CPU ada di `../../GAME_RULE.md` serta `../../AI_RULE.md`.

Struktur mengikuti `.agents/skills/api-creator/SKILL.md`. Folder `backendexample/` yang disebut skill belum tersedia di repositori ini, sehingga pembagian tanggung jawab di bawah mengikuti instruksi tertulis skill. Direktori kosong dilacak dengan `.gitkeep`; belum ada endpoint atau game server yang berjalan.

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

Belum ada `configs/config.json` karena konfigurasi runtime belum diimplementasikan. Kredensial database, kunci sesi, kunci enkripsi, dan secret layanan suara diberikan dari lingkungan lokal saat implementasi, tanpa menyimpannya di Git.
