# Aturan CPU / Bot Naruto

Game acuan: **Naruto: Shinobi no Sato no Jintori Gassen**, PS1 Jepang `SLPS_035.53`. Tanggal dokumentasi: 8 November 2026.

Dokumen ini menjelaskan keputusan CPU yang telah ditelusuri dari executable dan overlay BOARD. Aturan legal permainan tetap mengikuti [GAME_RULE.md](GAME_RULE.md). CPU memilih tindakan dari menu yang sah; efek, biaya, konsumsi kartu, perpindahan dan kemenangan diselesaikan oleh rules engine.

**Status:** kebijakan berikut sudah mempunyai model dan pengujian berdasarkan sumber. Seluruh perilaku CPU satu sesi belum dibuktikan identik dengan eksekusi PS1. Bagian yang memerlukan state runtime atau belum dipetakan ditandai secara eksplisit. Dokumen ini menjadi referensi implementasi bot; belum mengaktifkan bot dalam aplikasi online.

## 1. Inisialisasi dan kontrak state

Saat pertandingan dibuat:

1. Muat konfigurasi arena, mode, peserta, karakter dan teknik dari tabel asli.
2. Tetapkan slot CPU menggunakan flag pemain `0x100`. Gulungan memakai flag `0x200`; kristal memakai bit mulai `0x1000`.
3. Muat parameter karakter dari [board-ai.json](research/board-ai.json). Jangan menyamakan semua CPU dengan satu tingkat kesulitan.
4. Simpan arah dan empat slot tetangga petak dalam urutan asli, termasuk sentinel `255`.
5. Simpan state RNG u32, byte keputusan menu, penanda percobaan kartu/ninjutsu/gulungan, target roulette sebelumnya dan state pilihan pertahanan yang persisten.
6. Bangun daftar aksi dan target yang legal sebelum menjalankan kebijakan CPU.

State minimum pemain: posisi, arah, chakra, flag, byte status, tim, inventori tiga slot, langkah tetap, poin ninjutsu, daftar teknik dan status roulette. State petak: tipe, pemilik, level, HP, efek, harga beli, biaya upgrade, lima tarif kunjungan, penghitung perbaikan, koordinat dan empat slot tetangga.

Field `status`, `actorStatus` dan `playerStatus` pada modul riset perlu dipetakan ke byte native yang dimaksud masing-masing helper. Jangan membuat salinan status yang saling berbeda: bit inaktif `1` dan kerasukan `0x20` harus dibaca dari state yang benar.

Relationship harus berasal dari data loader yang sesuai. Untuk skenario cerita pertama, baris peserta adalah `[0,0,0,0]` dan `[1,0,0,0]`. Loader membaca byte unsigned: `255` tetap `255`, `128` tetap `128`. Jangan memakai relasi cerita pertama sebagai default seluruh pertandingan Party.

Sumber: [board-ai.md](research/board-ai.md), [story1-cpu.md](research/story1-cpu.md), [BOARD_AI_MAIN.c](decompiled/BOARD_AI_MAIN.c).

## 2. Parameter per karakter

Tabel mentah `characterBoardBytes[id]` mempunyai sembilan byte:

| Byte | Pemakaian |
| --- | --- |
| 0 | Skill roulette gerakan: `(nilai × 25) & 255`. |
| 1 | Parameter cadangan chakra: `reserveByte = (nilai × 25) & 255`. |
| 2 | Baris prioritas memilih kartu chance. |
| 3 | Baris prioritas membuang kartu dan prioritas memakai kartu simpanan. |
| 4 | Frekuensi mencoba kartu sebelum bergerak. |
| 5 | Baris prioritas ninjutsu papan. |
| 6 | Frekuensi mencoba ninjutsu papan. |
| 7 | Baris prioritas kekuatan gulungan. |
| 8 | Frekuensi kekuatan gulungan. |

`characterCombatBytes[id]` berisi `[skillPilihanTeknik, skillStopRouletteTempur]`. Jangan menukar dua skill ini.

| ID | Karakter | Sembilan byte papan | Dua byte pertarungan |
| --- | --- | --- | --- |
| 0 | Naruto | 2,3,2,2,2,0,2,0,1 | 2,1 |
| 1 | Sasuke | 3,2,0,0,3,0,2,2,1 | 3,2 |
| 2 | Sakura | 3,6,1,1,2,0,3,1,2 | 2,3 |
| 3 | Kakashi | 7,2,0,0,3,0,2,2,2 | 5,3 |
| 4 | Zabuza | 6,1,0,0,2,0,2,2,2 | 4,4 |
| 5 | Haku | 4,5,1,1,3,0,2,1,1 | 3,2 |
| 6 | Demon Brothers | 1,4,2,2,3,0,1,2,1 | 2,2 |
| 7 | Zori & Waraji | 1,5,0,0,2,0,2,0,1 | 3,3 |
| 8 | Iruka | 3,3,1,1,2,0,2,0,2 | 4,2 |
| 9 | Konohamaru | 1,5,2,2,3,0,2,2,1 | 1,1 |
| 10 | Mizuki | 1,3,1,0,2,0,1,0,1 | 1,2 |
| 11 | Hiruzen | 10,1,0,0,5,0,4,1,2 | 9,8 |
| 12 | Naruto berkacamata | 2,2,3,3,2,0,2,1,2 | 1,1 |

Data otoritatif dan tabel preferensi lengkap: [board-ai.json](research/board-ai.json). Tabel chance, discard, penggunaan kartu dan ninjutsu berbeda; jangan memakai satu tabel untuk semuanya.

## 3. RNG dan waktu keputusan

Gunakan RNG asli dengan perkalian u32:

```text
state = (state × 1103515245 + 12345) modulo 2^32
rand  = (state >> 16) & 32767
```

RNG merupakan state bersama. Setelah helper mengembalikan `rngState` dan `draws`, commit state baru tepat sekali pada event aslinya, termasuk ketika hasil akhirnya memilih roulette atau tidak memakai aksi khusus. Jangan menjalankan pengambilan keputusan pada setiap frame render, refresh UI atau retry request jaringan.

Seed PS1 berasal dari `srand(VSync(-1))` saat masuk menu. Seed yang dibuat server online merupakan adaptasi online dan harus direkam bersama input/tick untuk replay. Menyamakan seed saja belum menyamakan seluruh urutan RNG sesi karena animasi dan efek lain juga memakai draw.

## 4. Memilih aksi sebelum bergerak

Urutan evaluasi menu asli: roulette atau langkah tetap → ninjutsu → gulungan bila dipegang → kartu bila tersedia. Langkah tetap menggantikan pilihan roulette.

| Aksi | Prioritas keputusan |
| --- | --- |
| Roulette / langkah tetap | 250 |
| Ninjutsu yang dapat dipakai pada cabang ini | 255 |
| Kartu yang dapat dipakai pada cabang ini | 350 |
| Kekuatan gulungan yang dipilih dan dapat dieksekusi | 1000 |

Angka ini diproses mengikuti urutan dan pemeriksaan cabang sumber, bukan sekadar mengurutkan empat kandidat secara bebas. Simpan `policyState` antar-kembalinya menu dalam giliran yang sama. Percobaan yang sudah gagal tidak dicoba ulang sebelum gerak benar-benar dipilih. Ketika roulette/langkah tetap dipilih, state percobaan direset.

Setiap masuk kebijakan menu memakai satu draw awal, termasuk masuk ulang setelah aksi. Kartu/ninjutsu mempunyai batas penggunaan per giliran yang terpisah menurut GAME_RULE.

- Gate kartu dan ninjutsu biasa: `frequency > rand()%10 + 1`.
- Gate gulungan: menerima ketika `frequency >= rand()%10 + 1`, dengan kemungkinan dipaksa oleh skor cabangnya.
- Frekuensi ninjutsu Mizuki adalah 1. Pada map 0 tanpa petak tipe 8, ia tidak dapat melewati gate ninjutsu normal tersebut.

Implementasi acuan: [story1-cpu-preroll.mjs](research/story1-cpu-preroll.mjs), [penjelasan integrasi](research/story1-cpu-preroll.md), BOARD `800c88f0`.

## 5. Kartu chance, inventori dan kartu simpanan

**Memilih tiga kartu chance:** gunakan `cardPriorities`, cari posisi kartu dalam baris karakter, pilih skor terendah dan pertahankan kandidat pertama pada seri. Kartu 11 mendapat pengurangan skor 200 jika kristal belum lengkap. Evaluasi kartu 36 pada mode 8 dapat mengubah target teleport persisten walaupun kartu lain akhirnya dipilih. Prioritas >=5 memakai satu draw `%3`.

**Membuang kartu:** evaluasi empat slot termasuk kartu baru. Pada kebijakan biasa, pilih posisi preferensi terbesar dalam `discardPriorities`. Kebijakan discard 3 memakai satu draw `%4`; slot keempat tidak boleh diabaikan.

**Memakai kartu sebelum bergerak:** gunakan tabel terpisah `cardUsePriorities` pada modul preroll. Pertimbangkan kartu bertipe 5/7/13/14/15 dan pertahankan urutan slot asli. Tipe 15 mendapat pengurangan skor 1000. Keputusan yang sudah dikalahkan oleh prioritas lebih tinggi tetap harus mengikuti konsumsi RNG/attempt flag sumber.

| Kartu | Sasaran CPU yang ditelusuri |
| --- | --- |
| 28/30 | Diri sendiri. |
| 19/27/29 | Lawan dengan seluruh `actorStatus == 0`; jangan cukup memeriksa bit inaktif. |
| 13–18 | Evaluasi tujuan langkah memakai posisi dan arah pengguna, kemudian coin flip diri sendiri/lawan; perilaku ini tetap dipertahankan meskipun tampak kurang optimal. |

Skor sasaran lawan:

```text
chakra + jumlah_penghalang × 100
       + jumlah_kristal × 2000
       + nilai_bit_gulungan_0x200
       + 10000 jika pemegang gulungan dalam mode non-tim
```

Draw hubungan `%256 <= relationship` dapat meniadakan skor sasaran. Rekan tim mendapat skor nol. Kandidat harus mengalahkan skor terbaik secara ketat; jangan mengganti seri dengan pilihan acak tambahan.

Kartu langkah tetap memeriksa kegunaan petak proyeksi: chance berguna; tanah kosong memerlukan harga >150 dan chakra >800; penghalang sendiri memerlukan level <5 dan chakra >800; sumber/kristal memerlukan wilayah sendiri dan chakra >800. Efek petak 2/8/9 menonaktifkan kegunaan diri sendiri. Detail cabang dan urutan draw mengikuti helper sumber.

Konsumsi kartu, pengembalian ke dek, cancel dan target legal tetap mengikuti GAME_RULE. Helper AI hanya mengusulkan pilihan.

## 6. Ninjutsu papan

Mulai dari empat slot teknik yang benar-benar tersedia, biaya poin, kondisi petak dan target sah. ID teknik kosong/terkunci harus dinormalisasi sesuai kontrak helper: helper memakai 255 untuk slot tidak tersedia.

- Gunakan `jutsuPriorities` karakter. Kebijakan biasa memakai gate frekuensi pada bagian 4.
- Keberadaan petak tipe 8 melewati kegagalan gate tertentu pada cabang sumber; jangan menerapkannya pada arena yang tidak mempunyai tipe 8.
- Teknik 0/4/5 pada penghalang sendiri mendapat penyesuaian skor −50/−70/−60.
- Teknik lain pada cabang pemilihan memakai `rank + 10 − rand()%21`.
- Skor dibandingkan bertanda, tetapi skor terbaik kemudian dipersempit ke byte. Pertahankan wrap ini saat port ke Go.
- Teknik kerusakan 10–13 mengevaluasi target dengan `upgradeBase − (level−1)×100`, penyesuaian relationship, tim dan mode. Pemilihan target mengikuti urutan daftar asli.

Gunakan [cpuBoardJutsu](research/board-ai.mjs) dan kondisi legal dari GAME_RULE. Memanggil ninjutsu tanpa melalui persaingan menu preroll akan mengubah urutan keputusan dan RNG.

## 7. Cadangan chakra, pembelian dan upgrade

Ambang cadangan:

```text
reserveThreshold = 300 + ((reserveByte + 1) / 180) × 300
```

Pembagian di sini mempertahankan nilai pecahan pada pembanding. Jangan mengubahnya menjadi pembagian integer Go tanpa meniru hasil aslinya.

**Membeli/upgrade dari menu sumber atau kristal:** kebijakan awal menerima bila chakra >= ambang. Harga dan keterjangkauan tetap divalidasi menu/rules engine. Untuk kandidat upgrade jarak jauh yang terjangkau, skor `rent_berantai + (level−1)×30`; nilai terbesar menang, seri mempertahankan kandidat pertama dalam urutan menu.

**Berhenti pada penghalang sendiri:** pakai delapan slot aksi menu asli. Kebijakan selalu mengonsumsi satu draw, termasuk ketika decision byte telah terkunci. Pilih kenaikan level terbesar yang masih menyisakan cadangan, dengan biaya `base × 1/4/8/16` untuk kenaikan 1/2/3/4. Prioritas upgrade 300, selesai 250. Jika selesai dipilih, reset decision byte.

Cabang skenario `0x80` mempunyai larangan pembelian berdasarkan slot peserta dan defeat counter. Jangan mengaktifkan cabang itu untuk Party normal.

Sumber: BOARD `800c7f7c`, `800ce628`; [board-ai.mjs](research/board-ai.mjs).

## 8. Target roulette gerakan

Arena 1 berarti map ID 0 dengan 22 petak tanpa persimpangan tipe 3. Jalankan kebijakan target sebelum widget roulette melakukan pengocokan dan draw sudut awal.

Kebijakan mengambil minimum/maksimum dari **slot 0–10**, bukan seluruh 12 slot. Bila chakra <700, tinggal satu kristal, atau kristal sudah lengkap, target awal adalah `maksimum − rand()%3`. Selain itu lakukan lookahead berarah.

| Tujuan kandidat | Skor |
| --- | --- |
| Sumber/kristal | `100×angka + 500` jika punya penghalang, selain itu 0. |
| Chance | `100×angka + 400`. |
| Tanah kosong | `trunc(harga×((reserveByte+1)/180) + 1000 + 100×angka)` jika terjangkau. |
| Penghalang sendiri, level <5 | `100×angka + rent_berantai + 2000`. |
| Penghalang lawan | `10×angka − rent_berantai`; tambah 10000 untuk pemegang gulungan pada mode 8. |
| Penghubung tipe 7 | `100×angka`. |
| Petak khusus tipe 8 | `100×angka + 100000`. |

Efek jebakan 2/8/9 mengubah skor menjadi nol kecuali penghubung tipe 7. Penghalang sendiri level 5 tidak memberi skor kandidat baru. Pilih maksimum ketat pertama.

Untuk arah yang sudah diketahui, sumber menilai petak saat ini terhadap angka minimum sebelum maju. Pada arah 255, loop empat arah mempertahankan perubahan cursor/arah antar-iterasi. Jangan menginisialisasinya ulang ke posisi awal pada setiap iterasi.

Setelah lookahead, konsumsi satu draw skill: target dibatalkan bila `skillByte <= rand()%250`. Fallback memilih integer uniform pada rentang min..max slot 0–10. Target berhasil yang tidak terdapat pada 11 slot tersebut diganti nilai slot 10. Setter mencari seluruh 12 slot; jika nilai yang diminta tidak ada, target persisten sebelumnya tetap dipakai. State board sebelumnya 1/14 melewati lookahead dan gate skill tetapi tetap memakai fallback.

Widget memakai pengocokan 64 pertukaran, satu draw sudut, kecepatan 180 unit/tick modulo 4096 dan pemicu CPU berdasarkan kecocokan angka pertama. Palu membeku pada benturan kedua. **Target merupakan pemicu berhenti; hasil final dapat melampaui angka target.** Jangan memaksa hasil sama dengan target CPU.

Siklus widget yang diaudit mengonsumsi 191 draw, termasuk jitter dan partikel: 65 awal +2 jitter +41/+41/+42 benturan. Langkah tetap melewati widget, draw roulette dan pengurangan durasi status roulette.

Sumber: [story1-cpu-roulette.md](research/story1-cpu-roulette.md), [fidelity-roulette.md](research/fidelity-roulette.md), [faithful-roulette.mjs](research/faithful-roulette.mjs).

## 9. Arah dan pemilihan rute

Empat slot arah tetap dalam urutan asli. Probe berarah mengabaikan penghubung tipe 6 dalam penghitung langkah, berhenti pada tujuan atau persimpangan, dengan batas 100 langkah yang dihitung. Menemukan persimpangan belum membuktikan tujuan akhir telah dicapai.

Skor rute mempertimbangkan jarak geometris asli, kristal yang belum dimiliki, kepemilikan, biaya kunjungan, jebakan, gulungan dan mode. Contoh bobot sumber: jebakan −20000, jalur yang mendapat kristal sebelum persimpangan +50000, dan bonus mengejar gulungan pada cabang mode 8. Seri memilih maksimum ketat pertama. Pemain kerasukan memakai rejection sampling arah yang tersedia.

Jarak pertahanan bukan BFS umum. Spesialisasi lingkaran map 0 sudah diuji pada 484 pasangan posisi. Cabang peta lain dapat bergantung isi stack lama dan belum mempunyai pengganti umum yang terbukti identik.

Generator delapan kandidat preview dan nilai register yang dibawa harus mengikuti sumber. Pada kandidat penghalang lawan murah, skor dapat mempertahankan register sebelumnya; helper memerlukan `initialScore` bila belum ada skor yang dibentuk. Jangan mengisi nol secara diam-diam.

Rumus lengkap dan API: `cpuRouteProbe`, `cpuLandingCandidate`, `cpuRouteGeometry`, `cpuChooseRoute` di [board-ai.mjs](research/board-ai.mjs).

## 10. Memilih menyerang atau membayar

Pertama bangun kelayakan serangan dari biaya teknik asli. Cari minimum biaya **nonzero** signed16 dengan nilai awal 10000. Kartu 22 membagi dua minimum sekali. Jika kartu itu diperlukan karena chakra kurang dari minimum awal, tandai pemakaian wajib kartu 22. Biaya nol saja tidak otomatis mengaktifkan pilihan serang. Chakra negatif dengan teknik kelima yang sah mempunyai cabang eligibility bit 16.

Jika tidak eligible, pilih bayar tanpa draw kebijakan. Jika eligible, jalankan urutan berikut:

```text
relationship == 255 → bayar
mode 0x80 → bayar pembela CPU, serang pembela manusia
mode eliminasi 1 → serang
mode 8 dan pembela memegang gulungan → draw relasi tambahan sesuai sumber

rent = tarif kunjungan normal yang sudah memperhitungkan rangkaian
if (chakra-rent >= 0 AND rent < 701) OR relationship > 179:
    compare = HP penghalang == 1 OR trunc(chakra/3) < rent
    jika belum compare: compare = rand()%256 < reserveByte
    jika compare dan rand()%256 <= relationship: serang
    jika rent < 1001: bayar
serang
```

Efek pengganda biaya kunjungan tidak mengubah rent yang dievaluasi kebijakan ini. Panggil sekali ketika dialog serang/bayar diinisialisasi. Batas 701, 1001 dan operator perbandingan harus dipertahankan.

Sumber: BOARD `800f1290`; [story1-cpu.mjs](research/story1-cpu.mjs).

## 11. Kartu, teknik dan reaksi pertarungan

**Kartu tempur:** CPU/karakter kerasukan menerima dialog kartu yang ditawarkan. Penyerang mencari tipe 8/9, pembela tipe 10/11. Tidak ada kartu tipe 11 dalam definisi disc asli. Gunakan `rand()%3` berulang maksimal 50 percobaan sampai menemukan slot kompatibel; tidak ada gate kepribadian atau kekayaan tambahan.

Kartu 22 wajib melewati dialog dan RNG: pilih ID 22 pertama dalam tiga slot, pakai melalui jalur konsumsi inventori biasa, lalu bersihkan flag wajib. Jika tidak ditemukan, jangan mengarang kartu pengganti. Bila 50 percobaan gagal, helper melaporkan slot terakhir dengan `valid=false`; jangan mengonsumsi kartu yang tidak kompatibel.

**Urutan teknik:** penyerang memakai satu draw untuk memilih cost-first atau power-first; pembela memakai pilihan pertahanan persisten. Cost-first mengurutkan biaya naik, lalu power turun; power-first mengurutkan power turun, lalu biaya naik. Gunakan nilai signed16 dan exchange sort asli. Satu draw tambahan memberi kemungkinan 1/8 promosi teknik counter flag 4. Promosi menyisipkan kandidat dari belakang sehingga urutannya dapat terbalik.

**Pilihan pembela biasa:** cost-first pada eliminasi, atau pemegang gulungan dalam mode 8. Selain itu, cost-first bila nilai chain internal <2 dan rent mentah level <201; selainnya power-first. Petak tipe 8 memakai slot pemain 0 dan batas chakra 301. Cabang manusia mempertahankan pilihan persisten yang masuk.

**Memilih rank:** draw tanda dan `rand()%5` mengubah skill pilihan teknik, clamp 0..11. Tabel rank adalah `[3,3,3,2,2,2,1,1,1,0,0,0]`. Penolakan khusus pembela dapat mengulang dengan skill yang sudah berubah. Setelah rank dipilih, scan ketersediaan secara melingkar mengikuti urutan teknik dan bitmask tombol asli.

**Reaksi counter:** hanya pada update reaksi sumber, chakra <1001 dan tanpa flag `0x40`. Divisor reaksi berasal dari `combatReactiveDivisors[characterId][side]`. Divisor 1 tidak mengonsumsi RNG. Penyerang yang sedang counter dan menghadapi counter dapat menurunkan prioritas counter; pembela tanpa counter yang menghadapi counter dapat mempromosikannya.

**Stop roulette tempur:** urutkan 12 angka naik, konsumsi satu draw yang dibuang lalu draw kedua; pilih rank `clamp(skillStop + draw%5, 0, 11)`. Skill stop berbeda dari skill pilihan teknik. Nilai itu menjadi target widget; hasil final tetap mengikuti timing palu.

Sumber: [story1-cpu-combatcard.mjs](research/story1-cpu-combatcard.mjs), [board-ai.mjs](research/board-ai.mjs), [faithful-combat.mjs](research/faithful-combat.mjs), BOARD `800d6e7c`, `8011e0a4`–`8011ef10`.

## 12. Pemilihan kekuatan gulungan

Hanya evaluasi kekuatan yang legal menurut syarat dan counter GAME_RULE. Frekuensi dan prioritas berasal dari karakter; gunakan `powerPriorities` dan lookup literal `[3,1,2,3]` pada helper preroll.

- Pada mode 8, CPU pemegang gulungan melewati penggunaan kekuatan pada cabang ini.
- Kekuatan 0 mensyaratkan rank bits bernilai 3 pada eksekusi kebijakan. Akibatnya tidak dipilih kebijakan ini dalam pertandingan dua peserta, meskipun ditawarkan sebagai opsi legal.
- Evaluasi prioritas kekuatan 1 hanya memeriksa petak sebanyak jumlah pemain; pemeriksaan eksekusinya kemudian memeriksa seluruh papan. Pertahankan perbedaan ini.
- Kekuatan 2 menilai target memakai tarif mentah level tanpa multiplier rangkaian, dengan filter hubungan/tim dan draw per target.
- Kandidat kekuatan 3 dipaksa pada cabangnya jika chakra >=−999; ini tetap memerlukan kekuatan tersebut tersedia.

Nilai prioritas tidak menggantikan syarat eksekusi. Untuk seluruh penyesuaian skor, gate dan urutan draw gunakan `cpuPreRollPower` pada [story1-cpu-preroll.mjs](research/story1-cpu-preroll.mjs).

## 13. Eliminasi dan hasil

Eliminasi merupakan aturan pertandingan, bukan strategi bot. Pada mode eliminasi, tunggu antrean chakra selesai, proses peserta negatif menurut urutan slot, bersihkan flag serta penghalang miliknya sesuai GAME_RULE. Saldo tidak diubah menjadi nol dan kartu tidak otomatis dikembalikan pada jalur ini.

Jika tidak ada manusia aktif dan masih beberapa CPU, game asli masuk hasil dengan winner sentinel 255. Kandidat kamera ditentukan sebelum sentinel ditulis. Jika tidak ada peserta aktif bersaldo positif, kandidat lama dapat dipertahankan; perlu state sebelumnya. Jangan membuat pemenang baru untuk kasus ini.

Bot tidak otomatis menyerah hanya karena chakra rendah, dan tidak boleh mengganti hasil dengan heuristik kekayaan. Menyerah, kemenangan sumber, hasil seri dan unlock mengikuti cabang GAME_RULE masing-masing.

## 14. Batas yang belum lengkap

| Kasus | Perlakuan implementasi |
| --- | --- |
| Jarak/rute bercabang membaca stack lama | Memerlukan state asli; laporkan belum teratasi. Spesialisasi map 0 mempunyai pembuktian tersendiri. |
| Kartu langkah dengan arah 255 | Sumber membaca runtime tile+0x100, byte flag sprite panah keempat. Map 0 segar yang diaudit bernilai 0; jangan menganggap nilai itu berlaku pada storage/peta lain. |
| Prioritas kartu >=5 | Cabang sumber membaca stack tidak terinisialisasi; tabel karakter yang diekstrak hanya 0..3. Jangan memakai cabang ini sebagai tingkat kesulitan tambahan. |
| Kandidat landing belum mendapat skor | Pertahankan register/state masuk; tidak tersedia berarti belum dapat diputuskan secara identik. |
| Semua teknik memenuhi kondisi partisi counter | Sumber dapat membaca melewati daftar; helper menolak state tersebut. |
| CPU balap kartu, mode khusus dan generator preview penuh | Belum tercakup lengkap oleh kebijakan Party/map 0 yang didokumentasikan. |
| RNG animasi/menu satu sesi dan timing lengkap | Widget yang dipetakan belum membuktikan identitas seluruh sesi PS1. |
| Penjualan paksa normal dan semua callback hasil | Integrasikan dengan rules engine; helper eliminasi sendiri tidak mencakup seluruh alur tersebut. |

Jika sebuah keputusan memerlukan state yang tidak tersedia, kembalikan hasil `unresolved` dan simpan trace. Jangan menyebut fallback buatan sebagai perilaku CPU asli. Kebijakan bot baru seperti easy/normal/hard atau strategi yang lebih kuat memerlukan nama/versi terpisah dari kebijakan sumber ini.

## 15. Integrasi backend Go

Bot berjalan di server sebagai penghasil command melalui validasi rules engine yang sama dengan manusia. Client Phaser menampilkan event hasilnya. Pemrosesan bot tetap berada dalam antrean match; keputusan, perubahan RNG, flag percobaan dan command harus konsisten ketika transaksi disimpan atau diulang.

Kontrak yang disarankan:

```text
DecideCPU(state, actor, nativeContext)
  → command / unresolved
  → rngState, draws, policyState, trace

ValidateAndApply(state, command)
  → committed state + events
```

Simpan versi kebijakan dan hash tabel bersama snapshot match. Gunakan tipe `uint32`, byte dan `int16` sesuai operasi sumber; audit pembagian pecahan, narrowing byte, strict tie dan urutan draw. Delay untuk presentasi bot boleh ditambahkan pada lapisan online, tetapi jangan melakukan keputusan ulang selama delay.

[Rencana online](Naruto-Online/PLAN.md) kini memasukkan CPU pengganti disconnect dalam MVP web lokal. Match dimulai oleh manusia; takeover memakai karakter dan state slot yang sama, lalu kontrol dapat dikembalikan kepada pemilik saat reconnect pada batas keputusan. Simpan `participantKind` terpisah dari `controllerKind` serta gunakan `controlEpoch` untuk menolak command controller lama. Pergantian kontrol tidak mereset RNG, inventori, giliran atau status. Adapter AI dan seluruh substate takeover harus diuji; kemampuan ini belum merupakan implementasi bot yang berjalan. Mekanisme takeover/reclaim merupakan adaptasi online, sedangkan keputusan CPU tetap mengikuti kebijakan sumber di dokumen ini.

## 16. Sumber dan verifikasi

Executable SHA-256: `a97b3ebea329b267c186ae52fd21edb1891d66377d475cef32db5f133c296569`. BOARD SHA-256: `9c531036e66c88849bc8fd16ee1717f10b1a7e42132f2a616635c122c809c60a`.

Tabel diekstrak oleh [extract_board_ai.py](research/extract_board_ai.py). Referensi utama: [BOARD.c](decompiled/BOARD.c), [board-ai.md](research/board-ai.md), [preroll](research/story1-cpu-preroll.md), [serang/bayar](research/story1-cpu.md), [kartu tempur](research/story1-cpu-combatcard.md), [roulette CPU](research/story1-cpu-roulette.md), dan [kontrak Party](research/party-1to1-contract.md).

Perintah verifikasi:

```sh
node --test research/board-ai.test.mjs research/story1-cpu.test.mjs research/story1-cpu-preroll.test.mjs research/story1-cpu-combatcard.test.mjs research/story1-cpu-roulette.test.mjs research/faithful-combat.test.mjs research/faithful-roulette.test.mjs
```

Pada audit dokumentasi ini, **62 pengujian lulus**. Pengujian memeriksa tabel, batas keputusan, target, draw RNG, kartu, teknik, timing roulette dan kasus state tertentu. Hasil tersebut merupakan validasi model berdasarkan sumber, belum pembandingan satu pertandingan lengkap terhadap save-state/rekaman PS1.
