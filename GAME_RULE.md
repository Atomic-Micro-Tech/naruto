# Aturan Casual / Party Mode — Game PS1 Asli

Game: **Naruto: Shinobi no Sato no Jintori Gassen**, executable `SLPS_035.53`.

“Casual” dalam dokumen ini berarti **Party Mode** (`パーティーモード`, menu ID 1), yaitu pertandingan papan bebas. Istilah ini bukan nama tingkat kesulitan yang ditemukan di menu asli. Aturan di bawah ditelusuri dari executable, overlay `MENU`/`BOARD`, tabel data, dan gambar petunjuk dari disc lokal.

Dokumen ini mendeskripsikan aturan asli yang sudah dapat dibuktikan, bukan menjadikan perilaku rekonstruksi browser sebagai sumber kebenaran. Nama efek dalam bahasa Indonesia merupakan penjelasan fungsi; bukan klaim terjemahan resmi.

**Status audit 8 November 2026: spesifikasi Party diperluas, kesetaraan eksekusi 1:1 belum disertifikasi.** Bagian 1–9 membahas Party Mode; mode cerita, tim, balap kartu, dan progres mempunyai aturan tambahan. Audit terbaru menutup alur menyerah, tujuan scene hasil Party, pemilihan sasaran kartu, target nol, serta pemilihan pemenang eliminasi. [Kontrak implementasi 1:1](research/party-1to1-contract.md) mencatat urutan pemeriksaan, kasus batas, dan ketergantungan memori yang harus dipertahankan. Bukti sebelumnya ada di [audit Party lanjutan](research/party-casual-audit.md) dan [audit kelengkapan](research/rules-completeness-audit.md).

## 1. Persiapan pertandingan

| Pengaturan | Perilaku game asli yang terverifikasi |
| --- | --- |
| Jumlah peserta | **2–4 karakter** dalam Party Mode. Menu awal mengatur 4, lalu jumlahnya dapat diubah menjadi 2 atau 3. |
| Manusia dan CPU | Jumlah CPU dapat dipilih dari 0 sampai jumlah peserta dikurangi 1. Dengan demikian ada setidaknya satu pemain manusia. Pertandingan 3 peserta juga didukung. |
| Karakter | Terdapat 13 ID karakter. ID 0–3 tersedia sejak awal; ID 4–12 memerlukan pembukaan lewat progres. |
| Papan | Pemilih papan Party Mode mempunyai **9 slot**, indeks 0–8. Slot 0 tersedia sejak awal; slot 1–8 memerlukan pembukaan. Ini bukan seluruh 18 aset peta di disc. |
| Target chakra | Dapat diedit melalui lima digit pada menu pengaturan pertandingan. Jangan memaksakan target Bab 1 cerita sebagai target semua pertandingan Party Mode. |
| Aturan tambahan | Pilih aturan normal atau satu dari empat varian yang sudah terbuka. Pilihan ini bukan empat sakelar yang bebas digabungkan. |

Sumber: [MENU.c](decompiled/MENU.c), `FUN_800b5eb0`/`800b606c` untuk peserta dan CPU; `800b944c`/`800b99a4` untuk papan; `800b9d44` untuk target chakra; `800ba0a8` untuk varian. Pembukaan karakter/papan juga ditelusuri dalam [progression.md](research/progression.md).

### Preset Party yang telah ditelusuri ulang

Fungsi asli `80012780` membaca tabel **tersendiri** di `0x80064918`, dengan ukuran 48 byte per preset. Untuk seluruh sembilan pilihan papan Party (0–8), nilai awalnya sama: **1500 chakra, target default 3000, bonus dasar 400, 3 poin ninjutsu awal, dan +4 poin setiap bonus putaran**. Target kemudian dapat diedit. Kesamaan dengan Bab 1 dibuktikan dari tabel Party, bukan diasumsikan dari konfigurasi cerita.

| Papan / map ID | Dek | Dua belas angka roulette awal |
| --- | --- | --- |
| 0 | 0 | 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6 |
| 1 | 1 | 1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8 |
| 2 | 2 | 1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8 |
| 3 | 3 | 1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8 |
| 4 | 4 | 1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9 |
| 5 | 5 | 1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9 |
| 6 | 6 | 1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9 |
| 7 | 7 | 1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9 |
| 8 | 4 | 1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8 |

Tabel biner mempunyai 18 record, tetapi pemilih papan Party biasa hanya mengekspos sembilan yang ditunjukkan di atas. Mengganti ke papan yang tersedia memanggil kembali pemuat preset serta inisialisasi pemain; target dan konfigurasi yang dimuat tidak boleh dianggap tetap dari papan sebelumnya.

Parameter default varian **batas putaran = 5** dan **bonus sambil membawa gulungan = 5**. Keduanya memakai editor dua digit yang menolak nol, sehingga nilai menu yang dapat dikonfirmasi adalah 1–99. Eliminasi dan target-dengan-gulungan tidak memakai parameter tambahan. Target chakra memakai lima digit, **0–99999**, dengan perputaran angka 0↔9 pada digit yang diedit; tidak ada penolakan nol pada konfirmasi editor. Setter target menyimpan nilainya tanpa mengubah nol menjadi default.

**Target nol bukan pengaturan “tanpa batas kemenangan”.** Pemeriksaan pada sumber tetap `chakra setelah bonus >= target`: untuk target 0, saldo akhir nol/positif memenuhi syarat, tetapi pertandingan tidak langsung selesai ketika baru dimulai atau ketika menerima kartu chakra di petak lain. Varian mask 8 masih memerlukan gulungan; mask 4 tetap menerima jalur target chakra. Target 99999 juga dapat dipenuhi pada sumber karena saldo dijepit pada maksimum 99999. Ini kesimpulan cabang angka asli, bukan klaim bahwa setiap animasi dengan pengaturan ekstrem sudah dibandingkan pada PS1.

Sumber baru: [PARTY_RULE_HELPERS.c](decompiled/PARTY_RULE_HELPERS.c), `80012780`, `80012af0`, `80012c70`; hasil ekstraksi [party-rules.json](research/party-rules.json), dapat dibuat ulang dengan [extract_party_rules.py](scripts/extract_party_rules.py).

### Daftar ninjutsu per karakter dan pembukaannya

Party memakai tabel daftar teknik di `0x800648e4`, bukan daftar teknik skenario cerita. Angka di bawah adalah ID ninjutsu papan pada bagian 7; tanda `—` berarti slot kosong (ID 14).

| ID karakter | Karakter | Empat slot jika semua pembukaan teknik terpenuhi |
| --- | --- | --- |
| 0 | Naruto | 10, 1, 8, 5 |
| 1 | Sasuke | 10, 12, 3, — |
| 2 | Sakura | 0, 1, 2, 7 |
| 3 | Kakashi | 10, 1, 5, — |
| 4 | Zabuza | 10, 1, 2, 3 |
| 5 | Haku | 0, 1, 2, 3 |
| 6 | Demon Brothers | 0, 1, 2, — |
| 7 | Zori & Waraji | 2, 3, —, — |
| 8 | Iruka | 0, 2, 9, — |
| 9 | Konohamaru | 11, 1, 3, 4 |
| 10 | Mizuki | 10, 13, 2, — |
| 11 | Hiruzen | 4, 7, 8, 9 |
| 12 | Naruto berkacamata | 10, 1, —, — |

Lima pembukaan terpisah berlaku: **Naruto ID 0 / teknik 8 → flag 87; Sakura / teknik 7 → 88; Kakashi / teknik 5 → 89; Naruto ID 0 / teknik 5 → 90; Sasuke / teknik 3 → 91**. Jika flag belum diperoleh, `80012c70` mengganti slot teknik itu dengan ID 14. Pembukaan karakter dan pembukaan teknik adalah dua syarat berbeda. Label karakter mengikuti [pemetaan aset asli](extracted/original-ui/characters.json).

### Kondisi progres untuk papan dan teknik Party

Kondisi berikut dibaca ketika **scene progres `CONCNOTI` (16)** dijalankan melalui alur cerita. Hasil pertandingan Party biasa kembali langsung ke menu, **tidak memanggil scene pemberian progres ini**. Jadi papan/teknik/varian Party menggunakan pembukaan dari progres tersimpan; memainkan Party saja tidak otomatis mengevaluasi syarat berikut. `campaign` dan `stage` adalah **indeks internal berbasis nol**, bukan nomor bab yang langsung ditampilkan kepada pemain.

| Yang dibuka | Flag | Kondisi dalam tabel progres |
| --- | --- | --- |
| Papan 1 / 2 / 3 | 79 / 80 / 81 | Campaign 0, stage 1 / 2 / 4, masing-masing |
| Papan 4 / 5 / 6 | 82 / 83 / 84 | Campaign 0, stage 5 / 7 / 8, masing-masing |
| Papan 7 | 85 | Seluruh 56 harta, flag 0–55, sudah diperoleh |
| Papan 8 | 86 | Campaign 1, stage 2 |
| Naruto teknik 8 dan Sakura teknik 7 | 87 dan 88 | Campaign 0, stage 1 |
| Kakashi teknik 5 | 89 | Campaign 0, stage 2 |
| Naruto teknik 5 | 90 | Campaign 0, stage 4 |
| Sasuke teknik 3 | 91 | Campaign 0, stage 5 |

Sumber: record 79–91 pada [progression-data.json](research/progression-data.json), `MENU 800c2f44/800c33a8`. Predicate tahap hanya memeriksa campaign/stage; angka `500` yang juga terdapat pada beberapa record tipe 10 **tidak dibaca sebagai syarat chakra**. Tabel ini tidak menyatakan bahwa membuka menu tahap saja memberi hadiah, atau bahwa semua cabang kalah menjalankan progres yang sama. Flag diperiksa dan diberikan dalam alur hasil (`800c1d9c/800c25ac`), bukan saat menu Party dibuka.

## 2. Tujuan dan kemenangan aturan normal

1. Bergerak mengelilingi papan dan mengumpulkan seluruh kristal air yang diwajibkan peta.
2. Kembali ke **sumber penghalang** atau petak awal setelah koleksi kristal lengkap.
3. Terima bonus chakra untuk putaran lengkap tersebut.
4. Jika chakra setelah bonus mencapai atau melampaui target, pertandingan dimenangkan pada kunjungan itu.

Mencapai target dari kartu atau pembayaran lawan di petak lain **belum langsung mengakhiri pertandingan**. Pemeriksaan kemenangan normal berlangsung pada rangkaian bonus di sumber. Melewati sumber dengan langkah tersisa juga dapat memicu bonus dan kemenangan; tidak wajib berhenti tepat di sana.

Setelah bonus, koleksi kristal direset untuk putaran berikutnya. Pemeriksaan kemenangan dilakukan sebelum penawaran peningkatan wilayah dan pemberian gulungan berikutnya.

Sumber: `BOARD FUN_800edd68`; petunjuk asli [sumber penghalang](extracted/textures/tim_019d4000.png) dan [roulette/kristal](extracted/textures/tim_0197a000.png).

## 3. Alur satu giliran

1. Selesaikan status yang berlaku, misalnya giliran terlewat atau pemulihan kerasukan.
2. Pada menu sebelum bergerak, pemain dapat memakai ninjutsu papan yang tersedia dan menggunakan kartu simpanan yang sesuai.
3. Ninjutsu papan dibatasi **satu penggunaan berhasil per giliran**. Penggunaan kartu simpanan sebelum bergerak juga dibatasi **satu per giliran**; kedua batas itu terpisah.
4. Pilih roulette gerakan, lalu hentikan. Jumlah langkah mengikuti hasil akhirnya. Roulette mempunyai 12 slot, tetapi angka dan pengulangannya mengikuti konfigurasi; jangan menganggap peluang angka 1–6 selalu sama.
5. Jika pemain mempunyai nilai langkah dari kartu, aksi langkah tersebut **menggantikan roulette**. Pemakaiannya tidak mengurangi hitungan durasi efek roulette sementara.
6. Bergerak mengikuti koneksi papan. Ketika permainan menawarkan pilihan arah, pilih salah satu jalur yang diizinkan.
7. Selesaikan kejadian sepanjang jalan dan aksi petak tempat berhenti. Jika masih ada langkah setelah kejadian, lanjutkan pergerakan sesuai hasil kejadian itu.
8. Setelah aksi selesai, giliran beralih ke peserta berikutnya.

Memakai **kekuatan gulungan** merupakan cabang tersendiri: gulungan dikonsumsi, efek diselesaikan, lalu giliran berakhir tanpa roulette gerakan biasa.

Menu informasi pemain dan inspeksi peta kembali ke menu sebelumnya tanpa menghabiskan giliran. Pada roulette manusia, tombol berhenti memulai animasi palu; hasil final ditetapkan pada benturan palu kedua, bukan langsung pada frame tombol ditekan. Karena itu memilih angka acak ketika tombol ditekan tidak mereplikasi interaksi asli. Lihat [audit roulette](research/fidelity-roulette.md).

Untuk urutan permainan yang identik, RNG memakai state 32 bit bersama dan urutan pemanggilan aslinya. Masuk ke menu menginisialisasi seed dari penghitung VSync (`srand(VSync(-1))`), lalu roulette, CPU, dan efek visual mengonsumsi draw dari state tersebut. Rumus, jumlah draw widget, prioritas CPU, dan state yang diperlukan dicatat pada [spesifikasi implementasi](research/party-1to1-contract.md#7-cpu-rng-dan-timing-termasuk-perilaku-yang-harus-dipertahankan).

Sumber: `BOARD FUN_800cee18`, `800ea18c`, `800f3658`, `800d15a8`; [story1-flow.md](research/story1-flow.md) mencatat cabang menu bersama tersebut. Detail yang khusus map 0 dalam riset itu tidak otomatis berlaku pada papan lain.

## 4. Fungsi petak papan

| Petak | Ketika dilewati | Ketika berhenti |
| --- | --- | --- |
| Sumber penghalang | Jika semua kristal lengkap, proses bonus dan cek kemenangan. Setelah bonus, peningkatan wilayah dapat ditawarkan meski masih ada langkah. | Proses bonus jika memenuhi syarat; tersedia cabang peningkatan wilayah milik sendiri. |
| Kristal air | Ambil kristal yang belum dimiliki. | Ambil kristal, lalu dapat meningkatkan salah satu penghalang sendiri. |
| Kuil kartu / chance | Kejadian kartu tetap berjalan. | Kejadian kartu berjalan; lanjutkan alur petak setelah efek selesai. |
| Tanah kosong | Tidak otomatis dibeli. | Dapat memasang penghalang jika chakra cukup, atau melewatkan pembelian. |
| Penghalang sendiri | Tidak otomatis ditingkatkan. | Dapat meningkatkan level dengan membayar biaya. |
| Penghalang lawan | Tidak dikenai pembayaran biasa hanya karena melintas. | Bayar biaya kunjungan atau tantang penghalangnya jika serangan tersedia. Efek tertentu dapat menutup pilihan aksi. |
| Persimpangan / penghubung | Mengikuti koneksi dan aturan arah peta. | Perilaku mengikuti tipe petak dan efek yang terpasang. |

Jebakan dapat mengubah perjalanan ini. Contohnya, efek penghentian paksa menghabiskan sisa langkah ketika dilintasi; kebanyakan efek jebakan lain baru aktif ketika langkah habis.

Sumber: `BOARD FUN_800f3658`, `800eb434`, `800ec574`, `800edd68`, `800f0c10`, `800f1290`; [board-effects.md](research/board-effects.md).

## 5. Chakra, penghalang, dan peningkatan

### Penghalang

- Penghalang biasa yang baru dipasang dimulai pada **level 1, durabilitas 2**.
- Level maksimum adalah **5**. Kapasitas durabilitas biasa adalah `level + 1`.
- Harga pembelian, biaya peningkatan dasar, serta nilai kunjungan tiap level berasal dari data masing-masing petak. Tidak ada satu harga yang berlaku untuk seluruh papan.
- Menaikkan level menambah durabilitas sebesar kenaikan level. Ini bukan otomatis menyembuhkan seluruh kerusakan lama.

Peningkatan dari sumber atau kristal menaikkan **satu level** dengan biaya dasar. Peningkatan ketika berhenti di penghalang sendiri dapat melompati beberapa level:

| Kenaikan level | Biaya |
| --- | --- |
| +1 | Biaya dasar × 1 |
| +2 | Biaya dasar × 4 |
| +3 | Biaya dasar × 8 |
| +4 | Biaya dasar × 16 |

Sumber: `BOARD FUN_800d15a8`, `800e3e74`; [story1-economy.md](research/story1-economy.md).

### Biaya kunjungan dan rangkaian wilayah

Lawan yang berhenti pada penghalang membayar nilai kunjungan kepada pemilik, kecuali penyelesaiannya berubah karena pertarungan atau efek khusus.

Rangkaian penghalang dengan pemilik sama meningkatkan nilai kunjungan. Untuk rangkaian biasa yang menghasilkan nilai internal 0–4, pengalinya adalah:

| Jumlah penghalang dalam rangkaian | Pengali nilai dasar level |
| --- | --- |
| 1 | ×1 |
| 2 | ×1,2 |
| 3 | ×1,5 |
| 4 | ×1,8 |
| 5 | ×2 |

Hasil pecahan dibulatkan ke bawah. Penentuan rangkaian mengikuti **urutan koneksi asli peta**, bukan semua wilayah yang tampak berdekatan. Nilai internal di luar 0–4 masuk cabang nilai nol dalam fungsi asli; jangan memperpanjang tabel pengali dengan tebakan.

Efek pengganda biaya kunjungan membuat pembayaran berikutnya menjadi dua kali lipat dan kemudian habis.

Sumber: `BOARD FUN_800be0e4`, `800b770c`, `800dc2e0`; [faithful-rules.mjs](research/faithful-rules.mjs).

### Bonus putaran

```text
bonus chakra = bonus dasar konfigurasi
             + floor(jumlah nilai kunjungan seluruh penghalang sendiri / 2)
```

Nilai penghalang dalam rumus sudah memperhitungkan level dan rangkaian. Bonus juga memberi poin ninjutsu sesuai konfigurasi, dengan batas **8 poin**. Setiap penghalang mempunyai penghitung perbaikan: setiap dua bonus putaran yang dihitung untuknya, durabilitas pulih 1 hingga batas `level + 1`.

Sumber: `BOARD FUN_800bdc4c`, `800edd68`, `80109fec`.

### Kekurangan chakra pada aturan normal

Penyimpanan chakra pemain dibatasi pada **−9999 hingga 99999** (`SLPS FUN_8001387c`). Batas ini berbeda dari syarat kemenangan atau eliminasi.

- Saldo negatif tidak otomatis mengeliminasi pemain dalam aturan normal.
- Setelah pembayaran kunjungan membuat saldo negatif, pemain harus menjual penghalang sendiri jika masih memilikinya.
- Penjualan diulang sampai saldo tidak negatif atau penghalang habis.
- Harga jual menggunakan data jual petak: `nilai jual dasar + (level − 1) × kenaikan nilai jual`.
- Harga jual bukan pengembalian penuh biaya pembelian/peningkatan.
- Jika penghalang sudah habis tetapi utang masih ada, permainan normal dapat berlanjut.
- Jangan menerapkan penjualan paksa pada setiap saldo negatif tanpa melihat penyebabnya; cabang pembayaran kunjungan berbeda dari beberapa efek kartu/gulungan.

Aturan tambahan eliminasi mengubah perilaku ini; lihat bagian 9.

Sumber: `BOARD FUN_800dc2e0`, `800e03b0`, `800d15a8`.

## 6. Pertarungan penghalang

Ketika pemain berhenti di wilayah lawan dan memilih menyerang:

1. Pemain penyerang dan bertahan menyelesaikan pilihan kartu pertarungan yang sesuai.
2. Keduanya memilih teknik. Teknik yang tidak terjangkau oleh chakra tidak dapat dipilih, kecuali biaya sudah berubah oleh kartu yang sah.
3. Roulette penyerang dan pembela menentukan tambahan nilai masing-masing. Susunan angkanya bergantung pada teknik; jarak perjalanan pembela ikut memengaruhi pembentukan roulette pertahanan.
4. Teknik mengonsumsi chakra sesuai biaya akhirnya. Pembela memiliki pilihan pertahanan tanpa biaya chakra.
5. Hitung hasil dengan rumus berikut.

```text
nilai serangan   = kekuatan teknik serang + hasil roulette serang
nilai pertahanan = kekuatan teknik bertahan + hasil roulette bertahan
kerusakan        = min(durabilitas saat bertarung,
                       max(0, nilai serangan − nilai pertahanan))
durabilitas akhir = durabilitas saat bertarung − kerusakan
```

Pertahanan penangkal yang cocok dengan kategori serangan dapat meniadakan kerusakan. Jangan menerapkan pembatalan pada semua teknik bertahan secara umum.

- Jika durabilitas akhir nol, penghalang direbut oleh penyerang; level dipertahankan dan durabilitas normal dipulihkan menjadi `level + 1`.
- Jika penghalang bertahan, kerusakan yang terjadi tetap diperhitungkan dan penyerang membayar biaya kunjungan.
- Nilai serangan dan pertahanan yang sama menghasilkan **nol kerusakan**.
- Gulungan pemilik dapat ikut direbut melalui cabang khusus. Pertahanan gratis terakhir dan kartu pelindung mempunyai pengecualian tersendiri; lihat bagian 8.

Sumber: [COMBAT_SETUP.c](decompiled/COMBAT_SETUP.c), `FUN_8011ca60`; [BOARD.c](decompiled/BOARD.c), `8011f2fc`, `8011f4d8` dan alur kembali ke papan; [faithful-combat.mjs](research/faithful-combat.mjs).

### Pengecualian dan angka pertarungan

- **Konohamaru (9) dan Naruto berkacamata (12)** kehilangan pilihan serangan terakhir, kecuali pembelanya **Hiruzen (11) atau Iruka (8)** (`8011ccb8`). Daftar semua teknik karakter tidak otomatis sama dengan pilihan sah pada setiap pertarungan.
- Kartu pengurang biaya diterapkan **sebelum** pemeriksaan kecukupan chakra. Saldo negatif diperlakukan sebagai nol untuk pemeriksaan pilihan, sehingga pilihan berbiaya nol tetap dapat dipakai.
- Biaya teknik tetap dibayar bila serangan gagal atau ditangkal. Kartu 22 membagi dua biaya dengan membuang pecahan; kartu 23 menggratiskan pertahanan; kartu 24/25/26 menambah kekuatan 1/2/3.
- Untuk teknik biasa, slot aktif roulette serang bernilai acak **1–3**, sedangkan pertahanan **1–4**. Jarak asli menentukan slot yang bernilai nol: baris mask `max(0, 12 − jarak)` dipakai; baris 2–12 mempunyai sebanyak nomor baris slot aktif, sedangkan baris 0 dan 1 sama-sama menyisakan satu slot aktif. Jadi pembela yang sangat jauh tetap mempunyai satu slot aktif, bukan roulette yang seluruhnya nol.
- Jarak mengikuti fungsi rute asli, bukan garis lurus atau pencarian jalur terpendek umum. Untuk map 0, jarak dan pemilihan arah seri sudah ditelusuri untuk semua 484 pasangan posisi; itu belum membuktikan aturan persimpangan pada semua peta.

Dalam rumus di atas, `nilai pertahanan` berarti **kekuatan teknik + roulette**, belum termasuk durabilitas. Petunjuk game juga menggunakan total pertahanan yang memasukkan durabilitas. Contoh tanpa penangkal: durabilitas 2, teknik+roulette pertahanan 3, serangan 5 menghasilkan kerusakan 2 dan penghalang direbut. Pernyataan “seri = nol kerusakan” hanya berlaku jika dua nilai **tanpa tambahan durabilitas** yang dibandingkan sama.

Sumber: `BOARD 8011f2fc/8011f4d8`, [audit pertarungan](research/fidelity-combat.md), [pembuktian jarak map 0](research/story1-flow.md#map0-defender-path-proof). Cabang roulette teknik berflag `0x10` ada di kode, tetapi tidak ditemukan pada teknik valid dalam executable ini.

## 7. Kartu dan ninjutsu papan

### Kartu

- Petak chance menawarkan pilihan dari **tiga kartu terdepan** dalam dek pada tahap pemilihan.
- **Berhenti tepat di petak kesempatan (sisa langkah 0):** ketiga kartu ditampilkan terbuka; pemain boleh melihat isi sebelum memilih.
- **Hanya melewati petak kesempatan (sisa langkah masih > 0):** ketiga kartu ditampilkan tertutup. Pemain memilih posisi kartu dan mengonfirmasi tanpa melihat ID, gambar depan, atau deskripsinya. Setelah pilihan sah diproses, hasil kartu dijelaskan dan efeknya dijalankan; perjalanan dilanjutkan jika masih ada sisa langkah dan efek tidak mengubah alurnya. Dalam versi online, server tidak mengirim ID/deskripsi ketiga pilihan tertutup kepada klien; menyembunyikan gambar saja tidak cukup.
- Efek langsung diselesaikan saat kartu diperoleh; kartu simpanan masuk inventori.
- Inventori mempunyai **3 slot**. Jika penuh, pemain memilih kartu yang dikembalikan dari kombinasi tiga kartu lama dan kartu baru.
- Kartu yang dipakai/dikembalikan masuk lagi ke dek mengikuti prosedur asli; kartu bukan item sekali muncul untuk seluruh pertandingan.
- Sesudah kartu dihapus dari inventori, slot tersisa dirapatkan dengan mempertahankan urutannya.
- Dek memuat pengulangan ID kartu sebagai bobot kemunculan. Seluruh 52 definisi kartu tidak berarti semuanya ada pada setiap dek Party Mode; sebagian terkait mode lain.

Efek yang telah dipetakan meliputi perubahan chakra, pembayaran kepada seluruh lawan yang memenuhi syarat, pajak berdasarkan **jumlah level** penghalang, tambahan poin ninjutsu, langkah yang ditentukan, teleportasi, giliran terlewat, serta perubahan roulette sementara. Cabang transfer ke pemain acak (tipe 2) ada pada dispatcher, tetapi **tidak ada kartu tipe 2** dalam 52 definisi asli; jangan menambahkannya sebagai kartu nyata.

Kartu roulette tertentu mengganti 12 slot menjadi pengulangan angka **1–3**, **4–6**, atau **10–12** selama dua penyelesaian roulette gerakan. Kartu tempur dapat mengurangi biaya serangan menjadi setengah, menggratiskan pertahanan, atau menambah kekuatan serangan. Kartu pencuri/pelindung gulungan digunakan pada pertemuan yang sesuai, bukan sebagai bonus serangan umum.

Sumber: tabel kartu `0x80055cec` dan dek `0x8005603c` dalam [full-rules.json](research/full-rules.json); `BOARD FUN_8010f3e0`, `800ec574`, `800d15a8`; [RULE_HELPERS.c](decompiled/RULE_HELPERS.c). Cabang tampilan chance di `800ec574` memanggil `8010cd2c(1)` ketika gerakan berakhir (dan bukan cabang perpindahan khusus), selain itu `8010cd2c(0)`; `8010d3a8` menahan deskripsi pada kartu tertutup sampai konfirmasi. Gambar belakang kartu berasal dari `8010eae4`, resource 38, UV (0,120), ukuran 64×96, CLUT (224,243).

#### Katalog efek seluruh 52 ID kartu

Tabel berikut mencatat efek, bukan nama resmi kartu. Sasaran yang dapat dipilih tetap tunduk pada pemeriksaan menu/status; tabel ini tidak membolehkan semua efek diarahkan ke sembarang pemain.

| ID kartu | Efek / angka asli |
| --- | --- |
| 0, 1 | Langsung +150 chakra |
| 2, 3, 4 | Langsung +100 / +75 / +200 chakra |
| 5, 6 | Langsung −50 / −30 chakra |
| 7, 8 | Bayar 50 / 25 kepada masing-masing lawan yang memenuhi syarat; ada cabang khusus tim/inaktif |
| 9 | −50 × jumlah level seluruh penghalang sendiri |
| 10 | Memperoleh seluruh kristal, pindah ke sumber, lalu proses kejadian tujuan |
| 11, 12 | Pindah ke kristal / persimpangan yang dipilih, lalu proses kejadian tujuan |
| 13–18 | Simpanan langkah 2, 3, 4, 5, 6, 7 |
| 19 | Membuat sasaran lain melewatkan satu giliran |
| 20, 21 | Pencuri / pelindung gulungan; pemakaian bersyarat pada bagian 8 |
| 22, 23 | Separuh biaya serang / pertahanan gratis |
| 24–26 | Kekuatan serang +1 / +2 / +3 |
| 27, 29 | Roulette 1, 2, 3 berulang, dua penyelesaian roulette |
| 28 | Roulette 4, 5, 6 berulang, dua penyelesaian roulette |
| 30 | Roulette 10, 11, 12 berulang, dua penyelesaian roulette |
| 31–34 | Langsung +1 / +2 / +3 / +4 poin ninjutsu, batas akhir 8 |
| 35 | Memindahkan pemain lain yang memenuhi syarat ke petak pengguna; tidak mengulang kejadian tujuan |
| 36 | Pengguna pindah ke posisi pemain lain yang dipilih; memicu kejadian tujuan |
| 37–43 | Langsung +500 / +400 / +350 / +250 / +50 / +25 / +100 chakra |
| 44 | Simpanan langkah 1 |
| 45–51 | Kartu gerakan 1–7; cabang balap kartu membedakan ID di atas 44 |

Teleportasi membatalkan sisa langkah dan mereset arah pada cabang yang bersangkutan. Inventori penuh tidak boleh disederhanakan menjadi “semua kartu pasti kembali ke dek”: pada `800ec574`, mengganti kartu lama memakai pengembalian inventori, sedangkan memilih membuang kartu baru melewati cabang itu.

**Dek arena pertama:** dek 0 mula-mula memuat **51 entri, 29 ID berbeda**, bukan seluruh 52 kartu. Dua pool awalnya identik. Pengulangan ID memberi bobot, tetapi peluang pilihan berikutnya juga dipengaruhi pengocokan, kartu di tangan, pengembalian, dan pilihan tiga kartu; bukan undian seragam dari 52 ID.

#### Sasaran kartu, penimpaan efek, dan pembatalan

Pada pemilih sasaran standar kartu papan, daftar berisi pemain yang masih aktif; diri sendiri disertakan dan menjadi pilihan awal, kecuali untuk kartu teleportasi ID 36.

| Kartu | Sasaran dan perilaku saat dikonfirmasi |
| --- | --- |
| 13–18, langkah tetap | Diri sendiri atau pemain aktif lain. Nilai langkah berikutnya **diganti**, bukan ditambah dengan efek langkah tetap sebelumnya. |
| 19, melewatkan giliran | Pemain aktif lain mendapat status melewatkan giliran. Diri sendiri tetap dapat dipilih, tetapi cabang itu tidak memasang status baru; **kartu tetap habis dan jatah penggunaan kartu giliran itu tetap terpakai**. |
| 27–30, pengubah roulette | Diri sendiri atau pemain aktif lain. Status roulette baru **menimpa** status pengubah sebelumnya; durasi tidak ditumpuk. |
| 36, teleportasi ke pemain | Harus memilih pemain aktif lain. Pembatalan pada pemilih sasaran kejadian ini dinonaktifkan. |

Membatalkan pemilih sasaran kartu simpanan sebelum konfirmasi mengembalikan pemain ke pemilihan kartu, tanpa mengonsumsi kartu atau jatah penggunaannya. Setelah konfirmasi, kartu dihapus melalui fungsi pengembalian inventori dan menu kartu dinonaktifkan untuk sisa giliran, termasuk kasus ID 19 diarahkan ke diri sendiri.

Kartu pasif gulungan ID 20/21 tidak dipilih melalui menu kartu papan. Menu serangan menawarkan tipe kartu 8/9, sedangkan menu pertahanan menawarkan tipe 10/11; **tidak ada definisi kartu tipe 11** dalam tabel disc. Jangan menyamakan nomor tipe efek dengan ID kartu.

Sumber: `BOARD 800d15a8`, `80103e6c/80103e8c`, `8010f3e0`. Audit alur kendali berikutnya memastikan konteks kartu 7/0x54 selalu masuk pemilih daftar, lalu langsung menuju konfirmasi atau pembatalan. Jalur kursor `800bbaf4` yang masih tersimpan dalam fungsi besar itu **tidak dicapai oleh alur kartu biasa**; jangan menambahkan pilihan sasaran inaktif berdasarkan cabang tersebut. Filter strategi CPU tetap terpisah dari daftar sasaran manusia.

### Ninjutsu papan

Ninjutsu papan memakai **poin ninjutsu**, sedangkan teknik pertarungan memakai **chakra**. Karakter hanya dapat memilih ninjutsu yang terdapat pada daftar kemampuannya dan mempunyai sasaran sah.

Efek yang telah dibuktikan mencakup tambahan durabilitas sementara saat bertahan, jebakan teleportasi, pembalikan arah, penutupan aksi lawan, penggandaan biaya kunjungan, kerasukan, melewatkan giliran berikutnya, penghentian langkah, dan kerusakan langsung pada penghalang lawan.

Pemasangan efek umumnya memerlukan petak saat ini yang bukan sumber dan belum mempunyai efek. Beberapa efek mensyaratkan penghalang sendiri atau penghalang tertentu. ID teknik 6 disembunyikan oleh pemeriksaan ketersediaan asli; jangan memberinya efek rekaan.

Kerasukan tidak mempunyai durasi giliran tetap: pemain melakukan roulette pemulihan dan hanya hasil **1** menghapus status tersebut. Ruang angka pemulihan menyempit pada percobaan berikutnya, dengan sedikitnya dua nilai yang mungkin.

Sumber: `BOARD FUN_800bbe54`, `800d9570`, `800dd7c0`, `800cee18`, `800f3658`; tabel biaya dan sasaran di [board-effects.md](research/board-effects.md).

| ID ninjutsu | Biaya poin | Efek dan syarat sasaran |
| --- | --- | --- |
| 0 | 2 | Tambahan durabilitas pertarungan +1; petak sendiri saat ini, bukan sumber, tanpa efek |
| 1 | 3 | Jebakan teleportasi acak; petak saat ini bukan sumber, tanpa efek |
| 2 | 3 | Jebakan pembalikan arah; petak saat ini bukan sumber, tanpa efek |
| 3 | 3 | Menutup aksi pemain lawan yang berhenti; petak penghalang biasa saat ini, tanpa efek |
| 4 | 6 | Menggandakan pembayaran kunjungan berikutnya; petak sendiri saat ini, bukan sumber, tanpa efek |
| 5 | 4 | Tambahan durabilitas pertarungan +2; petak sendiri saat ini, bukan sumber, tanpa efek |
| 6 | 4 dalam tabel | Tidak dapat dipilih; tidak ada efek penggunaan sah yang boleh dikarang |
| 7 | 6 | Jebakan kerasukan; petak saat ini bukan sumber, tanpa efek |
| 8 | 4 | Jebakan melewatkan giliran berikutnya; petak saat ini bukan sumber, tanpa efek |
| 9 | 8 | Jebakan penghentian langkah, termasuk ketika dilintasi; petak saat ini bukan sumber, tanpa efek |
| 10, 11 | 4 masing-masing | Merusak penghalang lawan sebesar 1 durabilitas |
| 12 | 8 | Merusak penghalang lawan sebesar 3 durabilitas |
| 13 | 6 | Merusak penghalang lawan sebesar 2 durabilitas |

Serangan langsung ID 10–13 menghancurkan penghalang biasa menjadi tanah kosong jika durabilitas habis; **bukan merebut kepemilikannya** seperti kemenangan pertarungan. Sasaran khusus tipe 8 mempunyai cabang CPU tersendiri; sasaran rekan satu tim dikecualikan. Efek yang sudah terpasang tidak secara umum melarang serangan langsung.

Jebakan teleportasi mengecualikan petak asal dan penghubung tipe 6, memicu kejadian tujuan, dan dibatasi satu teleportasi jebakan per giliran. Tidak ada dasar untuk memberi seluruh jebakan batas waktu universal. Tambahan durabilitas ID 0/5 dipakai pada persiapan pertarungan lalu efeknya dikonsumsi; itu bukan kenaikan level permanen.

## 8. Gulungan dan empat kekuatannya

### Mendapatkan dan merebut gulungan

Gulungan pertama diberikan pada kunjungan bonus yang memenuhi salah satu kondisi berikut, selama belum ada pemegang:

- Semua peserta sudah pernah memperoleh bonus putaran pertama; atau
- Pemain pengunjung sudah memperoleh bonus putaran kedua.

Setelah pernah diberikan, gulungan yang tidak lagi dipegang dapat diberikan lagi pada kunjungan bonus berikutnya yang memenuhi alur tersebut.

Gulungan dapat direbut dengan berhenti pada petak pemegang. Kartu pencuri ID 20 memungkinkan cabang pencurian saat melintas; kartu pelindung ID 21 mencegah pencurian dan habis dipakai. Kartu pencuri yang ikut digunakan juga habis meskipun dicegah.

Merebut penghalang pemegang dapat memindahkan gulungan, tetapi **tidak selalu**: hasil pertarungan harus memenuhi pemeriksaan asli. Pilihan pertahanan gratis terakhir menghalangi cabang perpindahan itu; kartu pelindung ID 21 juga dapat mencegahnya dan dikembalikan ke dek setelah terpakai.

Perolehan/perpindahan gulungan mereset penghitung pengisian milik penerima. Satu gulungan dikonsumsi ketika kekuatannya digunakan, lalu giliran berakhir.

### Pilihan kekuatan

| Kekuatan asli | Syarat tambahan saat membawa gulungan | Hasil |
| --- | --- | --- |
| **大革命の術** | Dua bonus putaran yang dicatat ketika chakra masih negatif **sebelum bonus dibayar** | Membalik tanda chakra seluruh pemain; nilai negatif dibatasi minimum −9999. |
| **天変地異の術** | Sudah mendapat sedikitnya satu bonus putaran sambil memegang gulungan | Roulette 0–11; hasil 6–11 berhasil. Semua level penghalang biasa menjadi `6 − level lama`, lalu durabilitas menjadi `level baru + 1`. |
| **結界ブン取りの術** | Ada penghalang biasa milik lawan yang sah ditargetkan | Pemilik wilayah memutar 0–11 lebih dahulu. Angka 11 langsung menggagalkan tantangan. Selain itu, penantang harus memperoleh angka **lebih tinggi**. |
| **究極チャクラ大吸収の術** | Delapan penyelesaian roulette gerakan biasa sambil memegang gulungan | Setiap lawan yang masih aktif menghentikan roulette gerakan; kehilangan `500 × hasil`, lalu pemakai mendapat total transfernya. |

Dalam tantangan perebutan gulungan, seri berarti gagal. Perebutan berhasil mempertahankan level, durabilitas, dan efek wilayah. Jika gagal, pemakai kehilangan biaya kunjungan biasa wilayah sasaran, tetapi pemilik **tidak menerima** uang tersebut; efek pengganda biaya juga tidak dikonsumsi oleh cabang ini.

Langkah dari kartu tidak dihitung sebagai roulette pengisian. Penghitung bonus dalam utang juga tidak boleh direset begitu saja setiap kali saldo menjadi positif; kode asli mempunyai pemeriksaan dan penanda pemberitahuan tersendiri.

Sumber: `BOARD FUN_800ba43c`, `800e70c8`, `800edd68`, `800ea18c`, `800d8930`, `800db29c`, `800f3658`, `800f9520`; [story1-scroll.md](research/story1-scroll.md) dan [story1-flow.md](research/story1-flow.md). Bagian ini untuk pertandingan individu, bukan perluasan otomatis ke Team Battle.

## 9. Empat aturan tambahan Party Mode

Menu memilih **normal atau satu varian**. Empat varian memerlukan flag pembukaan 98–101. Pilihan dengan parameter numerik mempunyai editor dua digit dan menolak konfirmasi nilai nol. Nama asli berikut dibaca dari pesan pembukaan; menu pengaturan menampilkan kalimat penjelasannya. [Gambar teks asli](research/party-casual/rule-text.png) dan [ID pesan](research/party-casual/evidence.json) disertakan untuk pemeriksaan.

| Pilihan | Flag runtime | Perubahan aturan yang terverifikasi |
| --- | --- | --- |
| Normal | `0x0000` | Kemenangan dengan target chakra pada kunjungan bonus sumber; tidak ada eliminasi otomatis hanya karena saldo negatif. |
| Eliminasi chakra negatif | `0x0001` | Pemeriksaan setelah penyelesaian perubahan chakra dapat mengirim pemain aktif dengan saldo **di bawah nol** ke proses eliminasi. Nol tidak sama dengan negatif. Cabang penjualan paksa normal tidak digunakan dengan flag ini. |
| Batas putaran | `0x0002` | Pertandingan berakhir ketika penghitung mencapai batas yang dikonfigurasi, pada akhir giliran peserta terakhir. Hasil menggunakan peringkat chakra; jika kemenangan sumber terjadi lebih dahulu, jalur kemenangan itu tetap berlaku. |
| Syarat bonus pemegang gulungan | `0x0004` | Pada sumber, dapat menang bila masih membawa gulungan dan penghitung bonus selama memegangnya mencapai batas; mencapai target chakra juga tetap merupakan jalur kemenangan. Penghitung ini bukan jumlah kristal atau jumlah kali merebut gulungan. |
| Target chakra dengan gulungan | `0x0008` | Pada sumber, harus sekaligus mencapai target chakra **dan** sedang membawa gulungan. |

Untuk batas putaran, penghitung dinaikkan sekali pada penyelesaian giliran **slot peserta terakhir**, dengan saturasi 65535. Cabang akhir giliran menunggu antrean chakra selesai dan menguji **kesamaan** penghitung dengan batas, bukan `>=`. Label hasil kemudian memakai pemeriksaan `>=` tersendiri. Nilai menu 1–99 membuat batas biasa dilewati secara berurutan; replika tetap harus mempertahankan perbedaan kedua pemeriksaan untuk state yang dimuat ulang atau diuji langsung.

### Nama asli dan syarat membuka varian

| Flag | Nama dalam pesan asli | Syarat saat progres hasil diperiksa |
| --- | --- | --- |
| 98 | **マイナスチャクラで脱落** — eliminasi chakra negatif | Pemain pertama, slot 0, pernah mengalami perubahan saldo dari nol/positif menjadi negatif dalam pertandingan tersebut. Tidak harus masih negatif pada layar hasil. |
| 99 | **決められたターンで終了** — berakhir pada batas putaran | Penghitung putaran mencapai **40 atau lebih**; map balap kartu 16/17 dikecualikan. Ini bukan 40 kali mencapai sumber atau 40 giliran individu yang dijumlahkan antarpartisipan. |
| 100 | **封印の書をもったままマップを周回で勝ち** — menang melalui bonus putaran sambil membawa gulungan | Pemain pertama telah memakai kekuatan gulungan **究極チャクラ大吸収の術**, penghitung kategori 3 bukan nol. |
| 101 | **封印の書をもったままクリア** — menyelesaikan target sambil membawa gulungan | Pemain pertama telah memakai **keempat jenis kekuatan gulungan dalam satu pertandingan**, penghitung kategori 0–3 masing-masing bukan nol. |

Pencatatan penggunaan kekuatan dilakukan ketika masuk cabang pemakaiannya. Untuk **天変地異の術** dan **結界ブン取りの術**, penghitung naik sebelum hasil roulette/tantangan diketahui; tidak disyaratkan selalu berhasil. Empat penggunaan oleh empat pemain berbeda tidak memenuhi kondisi slot 0. Pemakaian yang tersebar pada beberapa pertandingan juga tidak dijumlahkan untuk flag 101: penghitung lima kategori disalin dengan **penimpaan** saat hasil diproses. Flag pembukaan yang sudah diperoleh tetap tersimpan.

Predikat flag 98–101 sendiri tidak menambahkan pemeriksaan pemenang atau karakter tertentu, tetapi **pemanggilnya menentukan kapan hadiah dapat diberikan**. Alur cerita yang menuju scene 16 mengevaluasinya; hasil Party biasa, termasuk hasil seri dan menyerah, menuju menu 2 dan melewati evaluasi itu. Karena itu tabel ini bukan instruksi membuka varian dengan memenuhi syarat di pertandingan Party. Sumber: `BOARD 801111f4/80112c50`, `MENU 800c1d9c/800c2748/800c25ac`, predicate `800c3e34/800c355c/800c3328/800c32c8`, `BOARD 800d8930`, dan setter `80016bb8` pada [PROGRESSION_HELPERS.c](decompiled/PROGRESSION_HELPERS.c).

Sumber pemilihan: `MENU FUN_800b9d44`, `800ba0a8`, `800ba2d0`, `800bcad4`. Sumber penyelesaian: `BOARD FUN_800edd68`, `800dc2e0`, `800e0b3c`, `800e1958`, serta pemeriksaan akhir giliran. Teks asli varian bonus menyebut bahwa jumlah bonus yang ditentukan **juga** dapat memberi kemenangan; ini mendukung cabang alternatif terhadap target chakra, bukan kewajiban memenuhi keduanya.

### Eliminasi dan urutan hasil yang sudah dapat dibuktikan

Pada `800e0b3c`, penyelesaian eliminasi menunggu antrean perubahan chakra selesai, menandai peserta tidak aktif, menghapus flag pemain termasuk gulungan/kristal, dan mengembalikan penghalang biasa miliknya menjadi tanah kosong. Penghalang itu **tidak diberikan kepada lawan**. Rangkaian wilayah lalu dihitung ulang.

Peserta aktif dengan saldo negatif diproses menurut urutan slot 0, 1, 2, 3. Setelah satu peserta selesai dikeluarkan dan penghalangnya dihapus, pemindaian dimulai lagi; pemeriksaan akhir pertandingan dilakukan setelah tidak ada peserta negatif aktif tersisa. Saldo peserta yang dieliminasi **tidak disetel menjadi nol**. Jalur ini juga tidak mengembalikan kartu tangannya ke dek; jangan menambahkan pengembalian otomatis sebagai bagian eliminasi.

Pertandingan individu dapat masuk hasil ketika hanya satu peserta aktif tersisa **atau tidak ada pemain manusia aktif lagi**. Jadi permainan tidak wajib meneruskan duel antar-CPU setelah semua manusia tereliminasi. Jika beberapa CPU masih aktif dalam kondisi terakhir tersebut, kode memakai penanda hasil khusus; jangan mengarang pemenang manusia atau menjalankan simulasi otomatis tambahan.

Pemilihan kandidat pemenang eliminasi memulai pembanding pada **0**, lalu hanya menggantinya bila menemukan saldo pemain aktif yang **lebih besar**. Jika saldo positif tertinggi seri, slot pertama dalam pemindaian menjadi kandidat. Bila tidak ada saldo aktif positif—termasuk satu penyintas dengan saldo tepat 0—kode mempertahankan byte kandidat `board+0x58b` sebelumnya. Jangan menggantinya diam-diam dengan satu-satunya penyintas atau selalu slot 0. Kasus itu memerlukan state memori sebelumnya untuk hasil yang benar-benar identik.

Ketika tidak ada manusia dan masih ada beberapa CPU, kamera terlebih dahulu memakai kandidat tersebut, lalu slot pemenang diubah menjadi sentinel **255** dan `board+0x92c` ditandai. Penanda ini **berbeda dari flag menyerah** `8001a1f0()`: eliminasi tersebut tetap mengikuti cabang label hasil biasa. Jika pertandingan berlanjut, pemain asal dipulihkan bila masih aktif; jika sudah dieliminasi, alur pemilihan giliran berikutnya dijalankan.

Urutan hasil pada `800e1958` memakai chakra 32 bit dikurangi 10000 bagi peserta tidak aktif; pemenang yang sudah ditetapkan diberi prioritas maksimum. Pengurutan menukar pasangan hanya jika nilai kiri lebih kecil, tetapi pertukaran dengan peserta ketiga dapat membalik urutan dua nilai yang sama. Contoh skor slot `[100, 100, 200]` menghasilkan urutan slot `[2, 1, 0]`. **Urutan tampilan dan label peringkat dihitung terpisah**; posisi dalam array bukan aturan pemutus seri.

### Label peringkat dan hasil seri

Aset hasil asli mempunyai label **1位, 2位, 3位, ドベ**: peringkat 1, 2, 3, dan **paling akhir**. Label terakhir bukan selalu “peringkat 4”; pertandingan dua pemain juga menggunakannya. Dua label tambahan, **勝ち / まけ**, dipakai cabang tim. Lihat [gambar hasil ekstraksi](research/party-casual/result-labels.png).

Untuk Party individu yang berakhir karena **batas putaran sudah tercapai**, dengan semua peserta masih aktif, tanpa pemenang sumber yang diprioritaskan, dan penanda hasil khusus `8001a1f0() == 0`:

- Chakra yang sama mendapat label peringkat yang sama. Setiap nilai chakra yang lebih rendah menaikkan nomor peringkat satu tingkat.
- Kelompok dengan nilai terendah mendapat **ドベ**, jika ada kelompok bernilai lebih tinggi.
- Jika seluruh chakra sama, seluruh peserta mendapat label **1位**. Kode label ini tidak mengadakan roulette tambahan atau memilih pemenang berdasarkan nomor slot.

| Chakra, dalam urutan hasil | Label yang ditampilkan |
| --- | --- |
| 200, 100 | 1位, ドベ |
| 200, 100, 100 | 1位, ドベ, ドベ |
| 300, 200, 200, 100 | 1位, 2位, 2位, ドベ |
| 300, 300, 200, 100 | 1位, 1位, 2位, ドベ |
| 100, 100, 100, 100 | 1位, 1位, 1位, 1位 |

Pada kemenangan sumber normal, pemain yang sudah ditetapkan menang tetap mendapat **1位**, sedangkan perhitungan pemain lainnya dimulai dari peringkat 2. Jadi saldo yang sama dengan pemenang sumber tidak otomatis menghasilkan juara bersama. Pemain tidak aktif pada posisi hasil kedua dan seterusnya ditandai **ドベ**. Cabang penanda hasil khusus mempunyai perlakuan lain dan tidak disamakan dengan contoh di atas.

Sumber: `BOARD 80110d68/8011186c/80111aac`, tabel sprite `0x8013a6b0/0x8013a6c8`, resource 41, serta [PARTY_CASUAL_HELPERS.c](decompiled/PARTY_CASUAL_HELPERS.c). Ini membuktikan **label layar hasil dari kode dan aset**, bukan seluruh efek seri terhadap progres atau seluruh transisi eliminasi melalui eksekusi PS1. Nilai getter pemenang `8001a274` adalah **ID karakter**, berbeda dari slot peserta pada getter urutan `8001a1bc`.

### Menyerah dan keluar dari hasil Party

Dialog asli bertanya `こうさんしますか？` (menyerah?). Konfirmasi menjalankan callback **`80114390`**, yang tidak tercakup dalam dekompilasi BOARD lama dan kini diekspor pada [PARTY_FLOW_BOARD.c](decompiled/PARTY_FLOW_BOARD.c).

1. Urutkan peserta berdasarkan chakra mentah dengan `80017034`, tanpa penalti 10000 untuk peserta inaktif.
2. Geser slot pemain aktif menurut `80013610()` sampai posisi terakhir, berapa pun saldonya.
3. Simpan urutan dan set flag hasil `8001a1f0()` menjadi 1.
4. Pada Party, tampilkan hasil. Label slot yang menyerah menjadi **ドベ**; peserta lain memakai perbandingan chakra dan bisa berbagi peringkat.

Contoh: saldo `[300,100,100]`, slot 0 menyerah → urutan `[1,2,0]`, label `[1位,1位,ドベ]`. Ini bukan jalur eliminasi karena bangkrut. Membatalkan dialog kembali ke permainan dan tidak menjalankan callback penetapan hasil.

Setelah pemain mengonfirmasi layar hasil Party, tujuan scene adalah **MENU (2)**, baik hasil sumber, batas putaran, eliminasi, maupun menyerah. Jalur ini **tidak memberikan hadiah pembukaan atau menaikkan statistik progres melalui `CONCNOTI` (16)**. Jadi seri di Party memengaruhi label hasil tetapi tidak memicu pemberian unlock bersama. Menu kemudian menginisialisasi ulang blok hasil melalui `80019f38`; ID karakter pemenang tidak boleh disamakan dengan semua pemilik badge 1位.

Sumber: pemilihan Party `MENU 800b3de4` menetapkan mode 1; getter mode `EXE 80012904`; hasil `BOARD 801111f4` case 4/0xd/0xe; callback `80114390`; dispatcher scene `EXE 800117a4/80011a60`. Jalur cerita menggunakan pemilihan tujuan dan scene progres tersendiri.

## 10. Batas mode dan batas verifikasi

**Team Battle** (`チームバトル`, menu ID 5) dan **Minigame** (menu ID 6, termasuk balap kartu) merupakan pilihan terpisah. Aturan berbagi chakra/kristal dua tim atau biaya mengambil kartu balapan tidak dimasukkan sebagai aturan normal Party Mode.

Untuk menjawab apakah dokumen ini mencakup **seluruh game**, perbedaan berikut harus ikut diperhitungkan:

- **Cerita:** tiga tabel kampanye berisi 10 / 3 / 6 entri tahap. Ada kombinasi aturan khusus, batas putaran, hitungan kekalahan/penghancuran penghalang, dialog dan progres. Bab 1 memakai aturan dasar, tetapi tidak mewakili seluruh tahap. Lihat [full-rules.json](research/full-rules.json), [story1-flow.md](research/story1-flow.md), dan [story-runtime.md](research/story-runtime.md).
- **Team Battle:** empat karakter dalam dua tim, berbagi chakra, kristal dan manfaat wilayah; tidak boleh menyerang penghalang rekan. Petunjuk asli menyatakan kembali ke sumber mengakhiri giliran. Sinkronisasi uang, perpindahan gulungan, dan hasil seri harus mengikuti cabang tim; jangan sekadar menjalankan aturan individu empat kali. Lihat [petunjuk asli](research/gameplay.md#rules-verified-from-original-instruction-textures) dan [board-effects.md](research/board-effects.md).
- **Balap kartu:** map 16/17, awal 600 chakra, dek 8, tangan awal kartu 46/47/48 (langkah 2/3/4), dan gerakan roulette pembuka. Menarik kartu membayar 100, memerlukan chakra sedikitnya 200 dan slot kosong, lalu kembali ke menu giliran yang sama. Istirahat menambah 100 dan mengakhiri giliran. Kartu gerakan ID >44 yang diarahkan ke lawan menggerakkannya mundur. Mencapai tujuan diperiksa sebelum kekalahan chakra ≤0; jika keduanya kehabisan chakra, pemeriksaan pemain yang sedang bertindak dilakukan lebih dahulu. Rincian petak, pengungkapan petak acak, dan pengecualian ada di [race-rules.md](research/race-rules.md).
- **Progres dan harta:** karakter, papan, teknik dan varian aturan mempunyai flag pembukaan. Harta bukan hadiah otomatis karena membeli tanah: cabang yang dipetakan memerlukan mode cerita, pemain manusia, petak pemain saat ini berlevel 5, dan ID harta 0–55 yang belum diperoleh, pada kejadian sesudah peningkatan. Lihat [progression.md](research/progression.md) dan [treasure.md](research/treasure.md).

Hal yang belum ditetapkan sebagai fakta lengkap di dokumen ini:

- Cabang target 0–99999 sudah dijelaskan; pembandingan input, animasi dan seluruh sesi pada pengaturan ekstrem dengan runtime asli belum dilakukan.
- Nama resmi setiap kartu/teknik yang belum ditranskripsikan. Nama dan penjelasan keempat varian Party kini sudah dibaca dari pesan asli.
- Party telah ditelusuri sampai kembali ke menu tanpa evaluasi unlock. Ketergantungan nilai kandidat lama pada eliminasi tanpa penyintas bersaldo positif tetap memerlukan state RAM pembanding; jangan mengarang hasil akhirnya. Cabang tim/cerita tidak otomatis tercakup oleh spesifikasi Party individu.
- Kesetaraan setiap keputusan CPU, urutan RNG antaranimasi, timing, suara, dan tampilan dengan perangkat PS1.

Rekonstruksi browser saat ini membuka semua karakter untuk pengujian dan menawarkan 10 papan. Itu adalah fasilitas versi rekonstruksi, **bukan aturan pembukaan Party Mode asli**. Dokumen ini tidak menyatakan bahwa seluruh aturan yang tercatat sudah diimplementasikan di browser.

## Referensi utama untuk implementasi

| Berkas | Kegunaan |
| --- | --- |
| [SLPS_035.53.c](decompiled/SLPS_035.53.c) | Data pemain, inventori, chakra, konfigurasi, teknik, dan akses tabel utama. |
| [MENU.c](decompiled/MENU.c) | Party Mode, jumlah peserta/CPU, pemilihan karakter/papan, target, dan aturan tambahan. |
| [PARTY_RULE_HELPERS.c](decompiled/PARTY_RULE_HELPERS.c), [party-rules.json](research/party-rules.json) | Preset Party yang terpisah dari cerita, daftar ninjutsu per karakter, dan lima pembukaan teknik. |
| [Audit Party lanjutan](research/party-casual-audit.md), [bukti teks/aset](research/party-casual/evidence.json) | Nama varian, syarat pembukaan, sasaran kartu, dan label hasil seri; ekstraksi dapat diulang dengan [extract_party_audit.py](scripts/extract_party_audit.py). |
| [Kontrak Party 1:1](research/party-1to1-contract.md), [model hasil](research/party-outcomes.mjs) | Alur hasil/progres, menyerah, eliminasi, target ekstrem, RNG/CPU, dan kontrak state; 11 pengujian batas bersumber dari cabang asli. |
| [BOARD.c](decompiled/BOARD.c) | Giliran, pergerakan, petak, bonus, kepemilikan, gulungan, penjualan, dan hasil pertandingan. |
| [COMBAT_SETUP.c](decompiled/COMBAT_SETUP.c) | Pilihan teknik, roulette pertarungan, biaya, penangkal, dan kerusakan. |
| [full-rules.json](research/full-rules.json), [maps.json](research/maps.json), [techniques.json](research/techniques.json) | Konstanta yang diekstrak dari disc. ID pada data ini berbasis nol. |
| [Petunjuk asli](research/gameplay.md#rules-verified-from-original-instruction-textures) | Indeks gambar petunjuk dan hasil pembacaan teksnya. |

Executable acuan memiliki SHA-256 `a97b3ebea329b267c186ae52fd21edb1891d66377d475cef32db5f133c296569`. Jika catatan riset lama bertentangan dengan cabang yang telah ditelusuri lebih lanjut, cocokkan kembali dengan executable/overlay asli. Contohnya, makna syarat pertahanan untuk perpindahan gulungan sudah dijelaskan dalam audit lanjutan `story1-flow.md`, meskipun catatan awal masih menandainya belum diketahui.
