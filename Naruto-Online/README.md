# Naruto Online — pengujian lokal

Arena 1 sudah terhubung dari browser Phaser 3 ke server Go, WebSocket dan PostgreSQL. Pemain register/login dengan email, membuat atau bergabung room, memilih karakter, menekan **Saya siap**, lalu host memulai pertandingan. Gunakan dua browser/profile berbeda untuk dua akun.

## Jalankan

Prasyarat: **Go 1.26+**, **Node.js 22.12+**, **Python 3.9+**, dan Docker Compose yang sedang berjalan.

```sh
cd Naruto-Online
python3 dev.py --setup
```

Buka **http://127.0.0.1:5173**. Setup menyalakan PostgreSQL, Mailpit dan LiveKit, memasang dependency, menjalankan migrasi/seed, lalu menjalankan API dan frontend. Data yang sudah ada tidak di-reset. Startup berikutnya cukup:

```sh
python3 dev.py
```

Kunci aplikasi dibuat sekali di `.local/app.key` dan dipakai kembali. Jika database sebelumnya sudah memakai `NARUTO_APP_KEY`, export **kunci yang sama** sebelum menjalankan script agar receipt/kode undangan terenkripsi tetap dapat dibaca. `NARUTO_DATABASE_URL` dapat mengganti database dev dari `server/configs/config.json`.

Untuk mencoba hasil build yang dilayani langsung oleh Go:

```sh
python3 dev.py --build
```

Buka **http://127.0.0.1:8080**. Mode ini menyesuaikan URL email verifikasi/reset ke port 8080. `Ctrl+C` menghentikan API/frontend; layanan Compose dan data tetap ada. Hentikan dependensi tanpa menghapus data dengan `docker compose stop`.

## Akun dev

Untuk room **test** melawan CPU Sasuke, jalankan `python3 dev.py --build --cpu-room`, buka port 8080, login dengan akun pemain, lalu gabung room **test** dan tekan **Saya siap**. Pertandingan dimulai otomatis. Pendamping lobby memakai browser headless untuk menyiapkan kursi; saat pertandingan dimulai, koneksinya ditutup dan worker CPU Go mengambil alih. Sesudah pertandingan, pendamping kembali menyiapkan lobby. Ini fasilitas pengujian lokal; jalankan satu pendamping saja. Jika Chromium belum tersedia, jalankan `npx playwright install chromium` dari folder `client`. Kredensial peserta otomatis disimpan di `.local/cpu-room.json` dengan izin 0600 dan tidak ditampilkan.

| Email | Password awal | Room awal |
|---|---|---|
| `naruto@example.test` | `NarutoDev!2026` | Host DEV Arena 1 - A |
| `sasuke@example.test` | `NarutoDev!2026` | Host DEV Arena 1 - B |
| `sakura@example.test` | `NarutoDev!2026` | Belum bergabung |
| `kakashi@example.test` | `NarutoDev!2026` | Belum bergabung |

Seed mempertahankan password dan keanggotaan akun yang sudah ada. Untuk percobaan cepat, login sebagai Naruto dan Sakura, lalu Sakura bergabung ke room Naruto. Kamu juga dapat mendaftarkan akun baru dari halaman awal.

## Yang dapat dimainkan

Presentasi arena mengikuti [video gameplay lokal](client/REFERENCE.md): kamera mengikuti karakter, HUD dan roulette memakai sprite asli, menu berada di dalam papan, dan karakter melanjutkan jalur tunggal secara otomatis. Pilih arah saat bercabang; pilih lalu konfirmasi kartu kesempatan. Tersedia tampilan seluruh peta, layar penuh, dan kontrol keyboard selain sentuh.

- Party normal arena 1, 2–4 pemain; target chakra dipilih saat membuat room.
- Empat karakter, roulette, pilihan jalur, kristal/bonus gerbang, kartu, ninjutsu, gulungan, pembelian/peningkatan/penjualan penghalang, dan pertempuran.
- Hasil pertandingan, konfirmasi menyerah, serta kembali ke room untuk pertandingan baru.
- Room publik/privat, kode undangan dan chat teks.
- CPU mengambil alih saat disconnect atau keputusan dibiarkan 120 detik. Reconnect lalu tekan **Ambil alih kontrol**. Keluar room saat bermain menyerahkan kursi kepada CPU; pertandingan tetap berjalan meski semua manusia keluar.
- Voice room melalui LiveKit: centang **Aktifkan voice room** ketika membuat room, lalu tekan **Gabung voice**. Mikrofon memerlukan izin. Tersedia mute dan keluar voice.
- PNG/WAV dimuat langsung dari folder `assets/`, tanpa menyalin ulang library aset ke build frontend.

Mailpit berada di **http://127.0.0.1:8025** untuk membaca email verifikasi/reset. LiveKit lokal menggunakan konfigurasi dev resmi `devkey` / `secret`; port 7880/7881/7882 dibatasi loopback. Konfigurasi ini ditujukan untuk browser pada komputer yang sama. Pengujian ponsel fisik melalui LAN memerlukan HTTPS dan alamat media yang dapat dijangkau perangkat; layout sentuh sudah diuji melalui viewport mobile.

## Status kesetaraan original

Ini **integrasi lokal yang playable, belum sertifikasi replika PS1 1:1**. Aturan yang telah direkonstruksi digunakan kembali sebagai source JavaScript yang dijalankan di dalam Go melalui Goja; tidak memakai emulator atau layanan Node untuk gameplay. Server menentukan RNG, hasil, giliran dan aksi legal.

CPU memakai versi **`local-party-v1`**. Bagian keputusan yang sudah dipetakan digunakan kembali; menu opsional sebelum roulette dilewati dan beberapa sasaran/relationship memakai kebijakan lokal. Kasus rute yang memerlukan RAM asli tetap mencatat ketidakpastian. Detail batas dan perubahan terdapat di [dokumentasi engine](server/internal/game/README.md), [GAME_RULE.md](../GAME_RULE.md), dan [AI_RULE.md](../AI_RULE.md).

Animasi battle/camera dan keseluruhan timing tampilan belum identik dengan PS1. Facebook Instant Games belum diaktifkan; tahap ini tetap web lokal sesuai [PLAN.md](PLAN.md).

## Pengujian

```sh
cd client
npm test
npx playwright install chromium
NARUTO_TEST_VOICE=1 npx playwright test
```

Tes browser memerlukan API/frontend dan layanan Compose berjalan. Tes membuat akun/room sintetis; gunakan database terpisah melalui `NARUTO_DATABASE_URL` ketika menjalankannya. Playwright memakai mikrofon sintetis, menguji track audio antarbrowser, dan tidak merekam mikrofon pengguna.

Suite aturan menyelesaikan 36 pertandingan dengan 2–4 peserta serta memeriksa replay deterministik, privasi proyeksi, kartu teleport dan menyerah. Tes browser mencakup desktop/touch, register, room, ready, chat, gameplay, voice, CPU takeover, reclaim, hasil dan rematch. Pengujian Go mencakup transaksi/idempotensi, stale version/epoch, fencing koneksi lama, keluar saat bermain, race detector dan kontrak API; lihat [README server](server/README.md).

Jalankan satu proses API untuk MVP lokal. Hub WebSocket masih berada dalam memori; beberapa instance memerlukan distribusi event bersama. PostgreSQL menyimpan checkpoint pertandingan sehingga restart tidak menghapus giliran, kartu atau RNG.
