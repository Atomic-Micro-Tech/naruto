# Naruto — Shinobi Jintori, penulisan ulang browser

Target proyek adalah replika lengkap **tanpa emulator** dari SLPS-03553. Implementasi saat ini **belum 1:1**: browser menjalankan JavaScript baru, bukan MIPS, BIOS, ROM, atau inti emulator. Aset dan aturan dipindahkan dari disc lokal, executable, serta overlay MENU/BOARD/STORY. Pseudocode Ghidra tidak bisa langsung dikompilasi menjadi game browser.

## Menjalankan

```sh
cd browser-game
npm start
```

Buka http://localhost:4173. Alternatif:

```sh
python3 -m http.server 4173 --directory browser-game/dist
```

Tidak ada dependensi JavaScript atau build framework. HTTP diperlukan untuk ES modules. Situs privat: https://shinobi-jintori-browser.workspace-141735.chatgpt.site

Title screen dan carousel memakai grafik asli. `Enter` memilih, tombol panah berpindah, `Esc` kembali. **Party Mode** atau **Buka pertandingan uji** membuka pertandingan yang tersedia. Menu yang belum dipindahkan menampilkan statusnya, tidak diarahkan diam-diam ke mode berbeda.

Pertandingan uji mendukung 13 karakter, 10 papan, empat peserta (1/2/4 pemain lokal dengan CPU). Klik kartu, arah perjalanan, teknik, dan peningkatan wilayah pada panel tindakan. Simpanan versi 2 memakai slot browser terpisah; simpanan versi 1 tidak ditimpa atau dianggap kompatibel.

## Yang sudah berjalan

- Title 640×480 dengan crop tampilan atas/bawah 16 piksel; carousel menu 320×240 dari tabel sprite.
- Aset seluruh 13 karakter, pose diam dan gerak empat arah dari SPK asli, 18 latar papan, sprite petak dan 20 penghalang, font Jepang, teks serta gambar 52 kartu.
- RNG PsyQ, shuffle dan siklus dek, pilihan tiga kartu, tiga slot inventori, kartu chakra/pajak/pembayaran ke lawan, poin ninjutsu, langkah tetap, jeda giliran, pengubah roulette dan teleport.
- Rangkaian penghalang mengikuti slot tetangga 0; sewa, bonus, perbaikan setiap dua bonus dan biaya peningkatan beberapa level mengikuti fungsi asli.
- Pilihan teknik dibatasi sesuai karakter/lawan; kartu pertarungan mengubah biaya/kekuatan; roulette 12 bidang memakai mask asli; penghentian CPU memakai nilai skill karakter; counter dan kerusakan memakai aritmetika hasil port.
- Arsip audio browser memutar 722 klip XA melalui decoder JavaScript mandiri. Data dikirim per klip saat diminta, tanpa memuat seluruh arsip di awal.

## Batas fidelitas yang masih ada

Ini belum merupakan keseluruhan game. Mode cerita, mini-game/race, Bingo Book, Treasure Box, perkembangan unlock, save memory-card asli, semua ninjutsu papan, gulungan segel beserta proteksi/penyitaan, kebangkrutan dan sinkronisasi tim belum menjadi alur permainan lengkap. Konfigurasi kampanye sudah diekstrak, tetapi pertandingan uji masih memakai empat peserta dan tujuan sederhana, bukan semua aturan tiap skenario.

Antarmuka pertandingan masih antarmuka browser; kamera, kedalaman/blending GPU, animasi transisi dan susunan HUD belum identik. Kecepatan gerak antarpetak dan sebagian timing input masih adaptasi. AI jalur/aksi/teknik belum memakai seluruh keputusan asli. Roulette langkah memakai clock, shuffle dan jeda stop asli; pengundian RNG partikel visual masih belum terintegrasi. Roulette pertarungan belum memakai seluruh clock widget yang sama. Jarak pertahanan sementara memakai BFS; fungsi asli memakai arah, koordinat dan percabangan, bahkan memiliki pembacaan stack yang perlu referensi runtime. Musik SPU/sekuens, ADSR/reverb, pemicu suara dalam adegan dan penjadwalan dialog belum lengkap. Sampel SFX pilihan pada UI belum dipetakan ke pemicu aslinya.

Kelulusan tes memvalidasi aturan tertentu dan kestabilan pertandingan; **bukan bukti bahwa game identik 1:1**.

## Aset dan hasil penelitian

| Lokasi | Isi |
| --- | --- |
| `extracted/manifest.json` | 1.504 resource, 2.673 paket PK02, 696 TIM dengan offset/hash |
| `extracted/textures/`, `extracted/tim/` | PNG dan TIM mentah |
| `extracted/maps/` | 18 latar asli |
| `extracted/original-ui/` | Title, menu, font, kartu, HUD, petak dan karakter |
| `extracted/original-ui/board-characters/` | 13 × 26 animasi, 978 frame sumber, atlas dan timing |
| `extracted/audio/` | 714 bank VH/VB, 2.049 referensi, 1.081 sampel SPU unik |
| `extracted/xa/` | 722 WAV native 37.800 Hz, manifest/provenance dan validasi |
| `extracted/xa/browser/` | XA asli ringkas (~62 MiB), indeks dan decoder JS |
| `extracted/story/` | Tabel adegan, timeline, sprite, dialog dan kaitan suara cerita |
| `extracted/overlays/` | Enam overlay mentah, untuk penelitian lokal |
| `research/full-rules.json` | 52 kartu, dek, 19 skenario berisi roster, tiga kampanye, tabel pertarungan |
| `research/scenes.json` | 39 entri dispatch adegan, termasuk adegan debug/test |
| `research/faithful-rules.mjs`, `faithful-combat.mjs` | Port fungsi yang memiliki bukti alamat sumber |

`DATA2.BIN` dibaca sebagai sektor XA asli; ekstraksi 2048 byte/sector akan kehilangan payload Form2. Dari 735 slot EOF, 13 adalah placeholder tanpa audio, sehingga ada 722 klip valid. Total durasi sekitar 49 menit 58 detik. Decoder browser menghasilkan 113.331.456 frame PCM yang identik dengan decoder C dalam mode aritmetika hardware. Validasi FFmpeg terpisah memakai mode pembulatan FFmpeg; perbedaan pembulatan tidak disembunyikan.

Sampel SPU WAV 44.100 Hz menggunakan rate untuk audition; jangan menyamakan dengan pitch pemutaran asli. Kandidat `extracted/packed/` tetap ditandai eksplorasi palet, bukan semua gambar final.

## Reproduksi

Python 3.9+, Pillow 11.3.0, dan compiler C untuk decoder XA:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/extract_assets.py
.venv/bin/python scripts/extract_overlays.py
.venv/bin/python research/extract_gameplay.py
.venv/bin/python research/extract_full_rules.py
.venv/bin/python scripts/extract_maps.py
.venv/bin/python scripts/extract_audio.py
.venv/bin/python scripts/extract_xa.py
.venv/bin/python scripts/prepare_xa_browser.py
.venv/bin/python scripts/extract_original_ui.py
.venv/bin/python scripts/extract_character_config.py
.venv/bin/python scripts/extract_board_ui.py
.venv/bin/python scripts/extract_common_ui.py
.venv/bin/python scripts/extract_original_font.py
.venv/bin/python scripts/extract_board_characters.py
.venv/bin/python scripts/extract_story.py
.venv/bin/python scripts/prepare_browser_assets.py
```

Rincian dan batas interpretasi ada di `research/fidelity-rules.md`, `research/fidelity-combat.md`, `research/original-ui.md`, `research/xa.md` dan dokumentasi cerita. Disc/executable asli tidak dimodifikasi; hasil dekompilasi tambahan ada di `decompiled/MENU.c`, `STORY.c`, `STORY_ENGINE.c`, `BOARD.c`, `COMBAT_SETUP.c`, `RULE_HELPERS.c`.

## Verifikasi

```sh
npm --prefix browser-game test
node --test research/faithful-rules.test.mjs research/faithful-combat.test.mjs research/faithful-roulette.test.mjs
.venv/bin/python -m unittest discover -s tests -v
```

Tes mencakup fixtures RNG/dek, kartu/teleport, ekonomi, pertarungan, simpanan rusak dan pertandingan CPU sampai selesai. Pengujian decoder XA mencakup layout, predictor, kanal dan kontinuitas. Title browser terlihat berjalan di Chrome; perubahan UI pertandingan terbaru dan ukuran ponsel belum seluruhnya diverifikasi lewat browser nyata.
