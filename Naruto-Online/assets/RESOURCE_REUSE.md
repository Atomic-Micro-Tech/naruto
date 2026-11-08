# Registry resource bersama

`resource-library.json` adalah katalog aset yang telah diekspor ke Naruto-Online. Path di dalamnya relatif terhadap folder ini, sehingga bisa dipakai semua arena.

- `files`: lokasi berkas, sumber ekstraksi, ukuran, SHA-256, ID resource asli dan arena yang mereferensikannya.
- `assets`: identitas berdasarkan SHA-256 isi berkas + ekstensi; `canonicalPath` adalah lokasi yang dipakai ulang, `existingPaths` mencatat salinan identik yang sudah terlanjur ada.
- `resources`: ID resource DATA.BIN, offset, ukuran resource asli dan daftar berkas terkait. Satu resource dapat menghasilkan banyak sprite, palet, frame atau sequence.

**Jangan menyalin ulang berdasarkan nama folder arena.** Cari aset berdasarkan hash dan formatnya. Bila sudah ada, simpan path hasil lookup langsung dalam metadata arena baru. Jangan membuat salinan atau symlink baru. ID resource saja tidak cukup untuk menyamakan dua aset karena varian palet, potongan sprite, hasil render audio dan format ekspor bisa berbeda.

JSON tidak dideduplikasi lintas folder berdasarkan hash: path relatif di dalamnya bisa mempunyai arti berbeda. Parameter playback, loop, anchor, animasi dan palet tetap milik metadata masing-masing pemakai walaupun PNG/WAV-nya sama. Resource IDs adalah dependensi/referensi asal, bukan pernyataan bahwa seluruh isi resource sudah diekspor. Arena IDs berarti paket arena memakai aset itu, bukan semua aset pasti muncul pada satu pertandingan.

## Untuk eksportir arena berikutnya

Gunakan fungsi Python berikut dari direktori `scripts`:

```python
from gameplay_asset_library import reuse_or_copy

asset = reuse_or_copy(
    output_root,                  # folder Naruto-Online yang sama
    extracted_png,                # sumber gambar PNG / audio WAV
    'sprite/arena2/example.png',   # lokasi jika belum ada
    arena_id=2,
    resource_ids=[38],
)
arena_metadata['sprite'] = asset['path']  # WAJIB memakai path yang dikembalikan
# asset['reused'] == True: tidak ada salinan baru yang dibuat.
```

Fungsi memeriksa ulang hash aset bersama sebelum memakainya, menolak konflik isi pada tujuan, lalu mencatat pemakai arena baru dalam registry. Panggil secara serial. Pertahankan path library bersama ketika mengemas/deploy beberapa arena; manifest arena baru menjadi daftar referensi, bukan duplikasi seluruh file. Pemanggil tetap perlu memvalidasi asset terhadap edisi disc yang benar sebelum menambahkan resource IDs dari disc lain.

Perbarui katalog dari paket arena 1 yang ada, tanpa menyalin atau merender ulang:

```sh
.venv/bin/python scripts/export_gameplay_assets.py --index-only
```

Ekspor arena 1 biasa juga memperbarui registry dan melewati penulisan berkas yang sudah identik. File audio yang telah dirender tetap tercatat ketika ekspor berikutnya dijalankan tanpa `--render-audio`.

Salinan identik yang sudah ada dipertahankan agar metadata lama tidak rusak. Ekspor arena berikutnya memakai `canonicalPath`; penghapusan salinan lama memerlukan pembaruan semua referensinya terlebih dahulu.

## Audio hanya WAV

Semua berkas di `audio/` harus WAV PCM16. SEQ/VH/VB sudah memiliki hasil render/decode WAV dan salinan format sumber di paket telah dihapus. Metadata pemutaran langsung ada di `metadata/audio/catalog.json`; gunakan path WAV di katalog ini. Riwayat konversi mencatat hash salinan sumber yang dihapus, bukan referensi aset aktif.

`reuse_or_copy` menolak audio non-WAV: konversikan dahulu, lalu daftarkan WAV hasilnya. Fungsi juga memeriksa isi WAV sehingga mengganti ekstensi saja tidak diterima. Metadata JSON diletakkan di luar `audio/`.

## Gambar hanya PNG

Aset di `image/`, `sprite/` dan `texture/` hanya PNG, disertai metadata JSON bila diperlukan. Semua 190 salinan TIM telah dicocokkan piksel RGBA hasil decode-nya dengan PNG sebelum dihapus. Pemetaan historis file lama ke PNG ada di `metadata/image/conversions.json`.

`texture/textures.json` menggunakan `file`/`png` relatif terhadap `texture/`; `sha256`, `size`, `width` dan `height` menjelaskan PNG. `sourceSha256`, `sourceSize`, `sourceMode`, `sourceFormat` serta offset/resource mencatat asal TIM tanpa membutuhkan file TIM di paket. Gunakan `file` untuk membuka gambar, bukan membuat nama file dari ID resource.

Ekspor berikutnya tidak menyalin TIM. `reuse_or_copy` menolak format gambar non-PNG dan memverifikasi format isi PNG; mengganti ekstensi saja tidak diterima. Konversi gambar baru dahulu, lalu daftarkan PNG untuk pemakaian bersama.
