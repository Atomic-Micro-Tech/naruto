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

- Sentuh/klik langsung roda roulette untuk menghentikannya saat giliranmu; tombol Stop dan keyboard tetap tersedia. Roda lawan/CPU tidak menerima input.
- Panah biru di dekat karakter memilih arah awal perjalanan; penanda merah menunjuk petak tujuan setelah seluruh sisa langkah habis. Harga pada petak tujuan disorot biru. Sentuh panah biru, petak tetangga, atau tombol arah untuk memilih jalur.
- Keyboard: tombol arah untuk rute; Space/Enter untuk putar/stop/lanjut. Saat memilih kartu, kiri/kanan mengganti sorotan dan Enter mengonfirmasi. Input chat tidak mengambil shortcut game.
- Geser satu jari pada papan (atau drag dengan mouse) untuk menggeser kamera. Kamera dibatasi tepi arena dan tetap pada posisi manual sampai **Ikuti karakter** disentuh. HUD tetap diam. Tap memilih petak/rolet setelah jari dilepas; gerakan geser tidak memilih aksi.
- **Lihat peta** membuka tampilan seluruh arena; **Ikuti karakter** mengembalikan kamera. Kamera tidak digeser selama rolet/animasi gerak berlangsung; tampilan seluruh arena sudah memperlihatkan semua petak.
- **Layar penuh** memperbesar game. Tombol menu di sudut layar membuka kontrol atau keluar dari fullscreen. Pada ponsel landscape, papan mendapat prioritas layar.
- Gerak otomatis hanya berlaku pada satu pilihan langkah legal dan akhir giliran. Pembelian, kartu, teknik, menyerah, dan percabangan tidak dipilih otomatis.

## Batas bukti

Roulette memakai interpolasi waktu kontinu, cache lapisan tekstur, dan pengereman yang mempertahankan kecepatan awal lalu melambat tanpa melewati hasil server. Efek WAV asli: menu SEQ3 berulang (periode 0,1 detik dari render-report), SEQ4 untuk stop, SEQ5 untuk tiga benturan berjarak 2/60 detik. Benturan kedua selaras dengan roda berhenti.

Setelah roda berhenti, angka pada sektor terpilih tetap terang di posisi aslinya, tanpa kotak hasil tambahan. Penunjuk diposisikan pada tepi roda sesuai anchor sprite asli agar tidak menutupi angka hasil. Angka pada sebelas sektor lain (termasuk angka kembar) memudar bertahap setelah benturan ketiga: sekitar 1,03 detik, lalu hasil ditahan sampai 2 detik sebelum roda keluar selama 8/30 detik. Durasi presentasi ini mengikuti cuplikan 00:12–00:14 dan 00:26–00:28; tidak mengubah tick atau hasil server. Kurva intensitas berasal dari `BOARD.c` `FUN_8010b4a8` (4096 turun 128 per pembaruan, batas 128) dan `UI_DRAW.c` `FUN_8001fd0c` (sektor terpilih tetap penuh). Browser menginterpolasi kurva tersebut dengan durasi 30 pembaruan per detik yang terlihat di video, menyisakan intensitas minimum 1/32 pada angka lain. Durasi pengereman adalah adaptasi presentasi untuk menyelaraskan hasil server, bukan replay timing PS1 yang identik. Tidak ditambahkan jingle hasil yang tidak terbukti dari sumber. Musik dikecilkan selama roulette agar efek terdengar.

Tiga shuriken terbang dari kanan dan menancap bergantian, memakai jadwal benturan audio yang sama. Sprite asli dari `BOARD.c` (`FUN_8010b084`/`FUN_8010b9b8`), resource 57: UV terbang (112,96), menancap (68,96), ukuran 44×44. Atlas PNG palette 7 yang sudah ada dipakai ulang dengan pemetaan warna ke CLUT asli (112,511), palette 27, di canvas; tidak menambah salinan aset. Durasi terbang 3/60 detik, selang peluncuran 2/60 detik. Offset X kosmetik dibuat tetap untuk menggantikan jitter RNG visual; putaran dan jejak adalah adaptasi presentasi.

Suara aktif setelah interaksi pengguna pertama sesuai kebijakan browser. Tombol **Suara aktif/mati** mengatur musik dan efek sekaligus serta menyimpan preferensi lokal. Loop/efek terjadwal dibatalkan saat mute, tab tersembunyi, logout, atau keluar room. Efek roulette juga mengikuti giliran CPU/lawan; jeda/timing jaringan dan pemrosesan audio browser tetap berbeda dari perangkat PS1.

Ini penyesuaian presentasi terhadap adegan yang terlihat, bukan klaim replika frame-per-frame. Dialog/portrait cerita, panel misi, efek segel pembelian, transisi kartu tertutup, audio per-frame dan semua animasi battle belum direplikasi dari cuplikan ini. Video tidak memperlihatkan battle, hasil akhir, atau seluruh aturan Party. Konfigurasi room dan aturan Go tetap menjadi sumber kebenaran; posisi atau hasil dari video tidak di-hardcode.

`src/native-camera.js` disalin dari `research/board-camera.mjs` beserta sumber fungsi di komentarnya. Geometri roulette berasal dari `assets/sprite/common/assets.json`; semua PNG/WAV tetap dimuat dari library aset yang sama. Tidak ada library aset duplikat.

Pratinjau tujuan dihitung ulang dari posisi, sisa langkah, dan pilihan langkah legal yang diberikan server. Pada ring Arena 1, hasilnya cocok dengan `FUN_800b9e30`/`story1MovementPreview` untuk seluruh 22 posisi dan 1–12 langkah. Perhitungan mengikuti jalur tanpa langsung berbalik; kartu, warp, atau kejadian berikutnya dapat mengubah perjalanan. Penanda hilang selama rolet/animasi dan di luar fase memilih langkah. Ini hanya pratinjau, tidak mengirim langkah otomatis tambahan.

Sprite arah biru asli: `FUN_800bb5d8`, UV (80,176)/(104,176), 24×24, CLUT (112,242), offset arah ±24 dari karakter. Penanda merah: UV (88,16), 16×32, anchor (8,32), CLUT (128,242), ujung 4 piksel di atas pusat tujuan. Keduanya memakai atlas resource 38 yang sudah ada (`packed_018ec800_4bpp_pal00.png`) dengan pemetaan palette asli di canvas, tanpa menyalin aset baru.

Checkpoint memakai dua sprite asli dari `FUN_800f6988`: `crystal_N.png` untuk alas dan `crystal_N_overlay.png` untuk bola, keduanya 32×32 dengan anchor (16,16) pada posisi petak. Arena 1 memakai checkpoint merah pada petak 11 dan biru pada petak 17 (ID internal); PNG dimuat dari library yang sudah ada tanpa salinan baru.

## Verifikasi

`tests/reference.spec.js` memakai transport sintetis untuk memeriksa sentuhan roda pada viewport ponsel, penolakan input roda lawan, geser kamera melalui touch event asli di viewport ponsel, batas arena, HUD tetap diam, kembali mengikuti karakter, pembatalan/multitouch tanpa aksi, tiga suara benturan dan tampilan shuriken, roulette, percabangan yang harus menunggu, langkah tunggal otomatis, pilihan tiga kartu, pembelian yang tidak otomatis, serta layout portrait/landscape. `tests/gameplay.spec.js` tetap menguji browser dengan backend Go/PostgreSQL nyata. `tests/roulette-render.spec.js` memeriksa piksel atlas asli selama fade: sektor terpilih tidak berubah, angka lain memudar, dan tidak ada pop saat roda berhenti. `tests/presentation.test.mjs` mengunci batas aksi otomatis agar perubahan tampilan tidak mengambil keputusan pemain.
