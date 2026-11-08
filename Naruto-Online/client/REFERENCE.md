# Referensi gameplay: naruto_basic.mp4

Referensi lokal: `../../naruto_basic.mp4`, durasi 36,67 detik, 854×480/30 fps. Frame diperiksa per detik; tidak dipakai sebagai texture atau video latar game.

| Waktu video | Perilaku terlihat | Implementasi browser |
|---|---|---|
| 00:00–00:03 | Papan lalu kamera memusat ke karakter; HUD di atas | Viewport dunia 320×240, kamera pan, face/name/panel/digit HUD asli |
| 00:04–00:10 | Ringkasan misi dan pengantar giliran | Menu giliran di dalam papan; target tetap memakai pengaturan room |
| 00:11–00:14 | Roulette besar dari kiri, latar meredup, hasil langkah | Geometri dan texture roulette asli, putaran berdasarkan tick server, hasil berasal dari server |
| 00:14–00:16 | Pilihan arah, jalan beberapa petak | Panah dan tombol arah; jalur tunggal berjalan otomatis melalui command server per petak |
| 00:16–00:20 | Tiga kartu, sorotan pilihan, deskripsi, konfirmasi | Artwork PNG tiga kartu, pilih lalu konfirmasi; ID kartu hanya dikirim kepada peserta yang berhak memilih |
| 00:21–00:30 | Giliran berikutnya, roulette, pilihan arah | Akhir giliran otomatis setelah jeda; roulette dan rute tetap dipilih manusia |
| 00:31–00:36 | Biaya petak, pilihan pembelian, penghalang muncul | Harga pada papan, konfirmasi pembelian dan sprite penghalang dari hasil transaksi server |

## Kontrol

- Sentuh/klik tombol di dalam layar. Pada percabangan, gunakan panah pada petak atau tombol arah.
- Keyboard: tombol arah untuk rute; Space/Enter untuk putar/stop/lanjut. Saat memilih kartu, kiri/kanan mengganti sorotan dan Enter mengonfirmasi. Input chat tidak mengambil shortcut game.
- **Lihat peta** membuka tampilan seluruh arena; **Ikuti karakter** mengembalikan kamera.
- **Layar penuh** memperbesar game. Tombol menu di sudut layar membuka kontrol atau keluar dari fullscreen. Pada ponsel landscape, papan mendapat prioritas layar.
- Gerak otomatis hanya berlaku pada satu pilihan langkah legal dan akhir giliran. Pembelian, kartu, teknik, menyerah, dan percabangan tidak dipilih otomatis.

## Batas bukti

Ini penyesuaian presentasi terhadap adegan yang terlihat, bukan klaim replika frame-per-frame. Dialog/portrait cerita, panel misi, efek segel pembelian, transisi kartu tertutup, audio per-frame dan semua animasi battle belum direplikasi dari cuplikan ini. Video tidak memperlihatkan battle, hasil akhir, atau seluruh aturan Party. Konfigurasi room dan aturan Go tetap menjadi sumber kebenaran; posisi atau hasil dari video tidak di-hardcode.

`src/native-camera.js` disalin dari `research/board-camera.mjs` beserta sumber fungsi di komentarnya. Geometri roulette berasal dari `assets/sprite/common/assets.json`; semua PNG/WAV tetap dimuat dari library aset yang sama. Tidak ada library aset duplikat.

## Verifikasi

`tests/reference.spec.js` memakai transport sintetis untuk memeriksa roulette, percabangan yang harus menunggu, langkah tunggal otomatis, pilihan tiga kartu, pembelian yang tidak otomatis, serta layout portrait/landscape. `tests/gameplay.spec.js` tetap menguji browser dengan backend Go/PostgreSQL nyata. `tests/presentation.test.mjs` mengunci batas aksi otomatis agar perubahan tampilan tidak mengambil keputusan pemain.
