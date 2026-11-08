# Naruto-Online — aset gameplay arena 1

Arena 1 = map ID 0: latar 640×480, 22 petak. Paket ini berisi hasil ekstraksi lokal yang sudah tersedia, ditambah suara gameplay seluruh 13 karakter dan badge hasil. Tidak ada cutscene, timeline cerita, dialog XA, musik cerita, sprite menu pemilihan karakter, atau bank efek story0.

- `image/`: latar arena, ilustrasi/teks kartu, dan badge hasil pertandingan.
- `sprite/`: objek papan, penghalang empat pemain, HUD, roulette, serta 13 karakter × 26 animasi papan. JSON menyimpan frame, anchor dan durasi asli.
- `texture/`: atlas, font dan varian palet dalam PNG dari resource gameplay terpilih. Salinan TIM sudah dikonversi dan dihapus; `texture/textures.json` menunjuk PNG dengan hash/ukuran PNG serta identitas sumber untuk pelacakan. Atlas bersama dapat memuat bagian yang tidak digunakan dalam satu pertandingan.
- `audio/samples/`: sampel asli hasil decode ADPCM ke WAV PCM16 mono 44.1 kHz. Pitch pemutaran ditentukan tone/SEQ; sampel instrumen bukan lagu lengkap.
- `audio/music/`, `audio/sfx/`, `audio/voice/`: WAV stereo siap diputar, hasil render SEQ asli satu kali. Bank musik 10 = arena, 22 = pertarungan, 24/25 = hasil pertarungan. Bank menu juga dipakai roulette dan pilihan saat gameplay.
- `metadata/audio/catalog.json`: katalog pemutaran langsung WAV, ID resource, bank, slot suara dan durasi. Folder `audio/` hanya berisi WAV; salinan SEQ/VH/VB sudah dikonversi lalu dihapus. Metadata berada di luar folder audio.

Kartu disertakan sebagai library gameplay bersama (52 kartu), bukan klaim semua kartu dapat ditarik dari dek arena 1. Roster disertakan 13 karakter untuk pemakaian arena yang sama di Party; bukan hanya dua peserta cerita pertama. Sprite animasi belum membakar seluruh rotasi/skala/blending PS1; gunakan metadata animasi.

WAV hasil render memakai sequencer JavaScript asli proyek dan OfflineAudioContext Chrome, tanpa emulator PS1. Render satu kali menonaktifkan pengulangan SEQ, menyisakan ekor maksimal 5 detik lalu memangkas hening akhir. Lagu ini bukan rekaman console dan bukan loop WAV yang sudah disambung mulus. Reverb hardware, interpolasi Gaussian, allocator 24 suara dan mixer asli belum direplikasi persis. `metadata/audio/render-report.json` mencatat durasi, peak, diagnostik dan faktor penurunan gain untuk mencegah clipping PCM16.

Ini paket aset gameplay yang berhasil dipetakan, bukan klaim seluruh efek/animasi pertarungan game sudah diekstrak atau terbukti 1:1. Tidak ada aset pengganti buatan AI. `manifest.json` menyimpan asal, ukuran, hash SHA-256, dimensi PNG dan format WAV setiap berkas.

Ekspor ulang dari root repositori: `.venv/bin/python scripts/export_gameplay_assets.py`. WAV yang sudah ada dipakai ulang; jika belum tersedia, sequence dirender otomatis. `--render-audio` memaksa render ulang. Script menolak menimpa berkas yang isinya berbeda; gunakan `--output` ke folder baru untuk regenerasi. Sumber asli tidak diubah.
