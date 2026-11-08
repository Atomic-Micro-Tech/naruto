# Spesifikasi implementasi Party untuk kesetaraan dengan game asli

Acuan: `SLPS_035.53`, PS1 Jepang. Tanggal audit: 8 November 2026. Aturan untuk pemain: [GAME_RULE.md](../GAME_RULE.md). Cakupan di sini adalah **Party individu, 2–4 peserta, salah satu mask 0/1/2/4/8**. Team Battle, cerita, dan balap kartu mempunyai cabang berbeda.

Dokumen ini menetapkan hasil yang harus dipertahankan implementasi dan bukti setiap keputusan. Ia tidak menyatakan bahwa browser yang ada sudah menjalankan semua cabang tersebut. Tidak ada emulator yang ditambahkan ke game browser.

## Koreksi utama dari audit sebelumnya

| Kekosongan sebelumnya | Hasil penelusuran sekarang |
| --- | --- |
| Dampak seri Party terhadap progres belum jelas | Hasil Party menuju MENU 2, melewati CONCNOTI 16. Predikat unlock tidak dijalankan oleh hasil Party biasa. |
| Flag hasil khusus belum dikenal | Callback menyerah `80114390` menulis `8001a1e4(1)`; inisialisasi hasil `80110adc` menulis 0. Flag ini berbeda dari `board+0x92c` untuk akhir pertandingan tanpa manusia. |
| Kursor peta mungkin menawarkan sasaran kartu tambahan | Alur konteks kartu 7/0x54 pada `800d15a8` selalu memasang pemilih daftar atau melanjutkannya; sesudahnya langsung konfirmasi/batal. Jalur kursor lama tidak dicapai dalam konteks ini. |
| Target nol belum mempunyai interpretasi | Nilai nol tetap disimpan dan dibandingkan sebagai nol pada bonus sumber; tidak berarti kemenangan dinonaktifkan. |
| Pemenang eliminasi saldo nol belum diketahui | Algoritme diketahui: pembanding mulai 0, penggantian memakai `>`, kandidat lama dipertahankan jika tidak ada saldo aktif positif. Nilai kandidat konkret bergantung state masuk. |
| Batas putaran dianggap satu pemeriksaan umum | Akhir giliran memakai `round == limit`; pembuat badge memakai `round >= limit`. Penghitung u16 naik hanya pada akhir giliran slot terakhir dan berhenti pada 65535. |

## Bukti tambahan dan cara mengulang

- [PARTY_FLOW_MAIN.c](../decompiled/PARTY_FLOW_MAIN.c): getter mode, counter putaran, pengurutan saat menyerah, reset hasil, clamp chakra, dan getter target.
- [PARTY_FLOW_BOARD.c](../decompiled/PARTY_FLOW_BOARD.c): callback menyerah dan callback hasil yang sebelumnya belum diekspor, berikut konteks inisialisasi hasil.
- [PartyFlowAudit.java](../scripts/ghidra/PartyFlowAudit.java): post-script Ghidra. Argumen pertama path keluaran, argumen kedua `main` atau `board`. Gunakan proyek yang sesuai dengan `-readOnly -noanalysis`; programnya `SLPS_035.53` atau `board_overlay.bin` pada basis `0x800ad450`.
- [party-outcomes.mjs](party-outcomes.mjs): spesifikasi yang dapat dieksekusi untuk kemenangan bonus sumber, akhir batas putaran, keputusan eliminasi, urutan hasil, dan badge. Modul riset ini tidak dipasang ke browser.

```sh
node --test research/party-outcomes.test.mjs
```

Sebelas pengujian lulus. Kasusnya berasal dari perbandingan dan urutan state di C, bukan rekaman eksekusi konsol. Pengujian tersebut tidak membuktikan seluruh game sudah identik.

Penelusuran juga memindai instruksi J/JAL pada EXE dan enam overlay lokal. Dua call-site setter flag hasil ditemukan di BOARD: `80110b34` memanggil `8001a1e4` dengan 0; `801144c8` memanggilnya dengan 1. Call-site kedua tidak muncul sebagai fungsi pada BOARD.c lama karena berada di callback. Pembacaan MIPS pada `801144c0..80114530` mengonfirmasi urutan penyimpanan rank, flag menyerah, pemeriksaan mode, lalu pembukaan hasil. Pemindaian panggilan langsung tidak diklaim sebagai pembuktian seluruh penulisan RAM tidak langsung.

## 1. Batas state dan urutan pemeriksaan

Jangan mengganti event asli dengan satu fungsi `cekMenang()` yang dipanggil setiap kali saldo berubah. Minimal pisahkan titik berikut:

| Titik pemrosesan | Pemeriksaan yang harus dipertahankan |
| --- | --- |
| Pembayaran/transfer sedang dianimasikan | Tunggu semua delta chakra `board+0x2ee..0x2f4` yang relevan selesai sebelum penentuan eliminasi/akhir giliran. |
| Bonus sumber selesai | Baca saldo final yang sudah dijepit; uji target/gulungan menurut varian, sebelum menawarkan peningkatan dan pemberian gulungan berikutnya. |
| Akhir giliran slot terakhir | Naikkan counter melalui `80012c20`; di fase akhir berikutnya uji kesamaan dengan batas bila mask 2 aktif. |
| Eliminasi | Proses pemain negatif aktif satu per satu, baru hitung peserta/manusia aktif dan tentukan apakah berakhir. |
| Penetapan hasil | Susun urutan slot, simpan ID karakter pemenang hanya pada cabang yang memang menetapkannya, lalu hitung badge secara terpisah. |
| Konfirmasi hasil Party | Menu 2; jangan otomatis menjalankan evaluator unlock. |

Sumber utamanya `BOARD 800edd68`, `800dc2e0`, `800e0b3c`, `800e1958`, `801111f4`; getter/setter hasil ada pada [PARTY_CASUAL_HELPERS.c](../decompiled/PARTY_CASUAL_HELPERS.c).

## 2. Target nol dan batas angka

Editor `MENU 800b9d44` memecah target menjadi lima digit. Mengurangi digit nol memutarnya ke 9, menaikkan 9 memutarnya ke 0, tanpa carry ke digit lain. Setter `EXE 80012a64` menulis u32 target; getter `80012a70` mengembalikannya. Tidak ada penggantian target 0 menjadi 3000 pada setter.

Untuk Party, setelah bonus sumber selesai:

| Mask | Predikat kemenangan |
| --- | --- |
| 0, 1, 2 | `chakra >= target` |
| 4 | `chakra >= target || (hasScroll && scrollBonusCount >= bonusLimit)` |
| 8 | `chakra >= target && hasScroll` |

`hasScroll` mengacu pada flag 0x200 pemain. Predikat ini **hanya** berlaku pada titik bonus sumber yang memenuhi syarat. Target nol tidak membuat papan otomatis menang pada frame pertama. Saldo negatif sesudah bonus tetap tidak memenuhi target 0 pada jalur uang; jalur bonus gulungan mask 4 tetap mempunyai pemeriksaannya sendiri.

Setter chakra `8001387c` menjepit ke `[-9999,99999]`. Target maksimum yang dapat dimasukkan, 99999, dapat dipenuhi ketika saldo final mencapai batas tersebut. Tampilan target dan panel aturan membaca angka itu; pemanggil getter target yang ditelusuri tidak menambahkan pembagian oleh target untuk jalur ini. Tidak ada kesimpulan “target nol pasti crash” yang ditambahkan tanpa bukti.

Akhir putaran mask 2 diuji pada `800dc2e0` setelah antrean delta kosong, dengan `actor == playerCount - 1` dan **`counter == limit`**. Jangan menggantinya dengan `>=` hanya karena pembuat label menggunakan `>=`. Untuk konfigurasi menu normal, counter bergerak berurutan sampai batas 1–99.

## 3. Alur sasaran kartu yang benar-benar dicapai

Untuk `board+0x2eb` bernilai 7 atau 0x54 pada state 0 `800d15a8`:

```text
selectionState != 0
    → lanjut/tunggu daftar
selectionState == 0 dan konteks 7/0x54
    → selectionState = 1
    → bangun daftar 80103e8c
    → lompat ke lanjut/tunggu daftar
daftar ditutup
    → selectionState = 0
    → baca target 80104098
    → target < 4: langsung ke dispatcher konfirmasi
    → selain itu: langsung ke dispatcher batal
```

Tidak ada jalur dari keputusan-keputusan tersebut menuju pemilihan kursor `800bbaf4`. Karena itu sasaran yang sah untuk alur kartu biasa tetap daftar pemain aktif: diri sendiri tersedia untuk kartu simpanan, tetapi dikeluarkan untuk kartu 36. Menganggap cabang kursor lama sebagai fitur alternatif akan memperluas aturan asli.

Efek kartu ditulis **sebelum** penghapusan kartu dan penetapan jatah penggunaan. ID 19 pada diri sendiri tidak menulis status skip baru tetapi tetap menuju penghapusan bersama. Pembatalan tidak melewati dispatcher tersebut. Efek langkah tetap/roulette diganti, bukan dijumlahkan; batas satu kartu sebelum bergerak tetap berlaku.

## 4. Eliminasi, termasuk kasus tidak biasa

Urutan `800e0b3c` untuk pertandingan individu:

1. Tunggu delta chakra dan animasi HUD yang diperiksa selesai.
2. Cari slot terendah yang masih aktif dengan saldo <0.
3. Jalankan dialog/animasi; kosongkan word flag pemain dan tandai actorStatus bit 0.
4. Hapus penghalang biasa miliknya: type 5 → 4, packed ownership/level/HP menjadi `0xf020`, efek dibersihkan pada byte yang ditulis kode, lalu hitung ulang rangkaian.
5. Ulangi pencarian dari awal sampai tidak ada pemain negatif aktif.
6. Hitung manusia aktif dari actorStatus bit 0 dan flag CPU 0x100.
7. Selesaikan pertandingan jika tinggal satu peserta aktif atau tidak ada manusia aktif.

Kode ini tidak mengembalikan inventori ke dek, tidak mengubah saldo menjadi nol, dan tidak membagikan tanah pemain keluar kepada lawan. Jangan menerapkan “kebangkrutan Monopoly” generik.

Jika berakhir, scan kandidat menggunakan `bestChakra = 0` dan hanya mengganti slot jika `chakra > bestChakra`. Tabel berikut memisahkan data pasti dan state yang diperlukan:

| State setelah pemindaian eliminasi | Hasil pemilihan |
| --- | --- |
| Satu pemain aktif dengan chakra >0 | Slot itu menjadi kandidat. |
| Semua manusia keluar, dua CPU positif sama besar | Slot CPU positif tertinggi pertama menjadi fokus kamera; lalu winner slot ditulis 255 karena masih ada beberapa CPU. |
| Satu pemain aktif dengan chakra 0 | Tidak ada penulisan kandidat baru; byte `board+0x58b` lama dipertahankan. |
| Tidak ada pemain aktif | Tidak ada penulisan kandidat baru; jalur “tidak ada manusia” tetap masuk hasil. |
| Beberapa pemain aktif, semuanya 0, semuanya CPU | Kandidat lama dipakai untuk fokus kamera, lalu winner slot ditulis 255. |

`FUN_800faebc(candidate)` dipanggil **sebelum** sentinel 255 pada kasus beberapa CPU. Jika kandidat lama bukan slot sah, fungsi kamera dapat membaca data di luar peserta. Model riset mengembalikan `needsPriorMemory` dan `validActiveCandidate` agar nilai itu tidak disembunyikan sebagai pemenang baru yang dibuat-buat.

Allocator board `8002dec4` memakai `malloc3`, bukan allocator yang menjamin isi nol. Pemeriksaan inisialisasi board tidak memberi dasar untuk menganggap byte kandidat ini selalu nol pada semua riwayat permainan. Maka hasil visual terakhir kasus ini memerlukan isi memori masuk. Ini ketergantungan nyata sumber, bukan aturan tie-break yang belum dipilih pengembang replika.

`board+0x92c` untuk berakhirnya pertandingan tanpa manusia tidak menulis flag menyerah `80089da4`. Sebagai contoh, satu manusia negatif dan dua CPU dengan 500/500 menghasilkan urutan CPU lebih dahulu dan badge biasa `1位,2位,ドベ`, bukan otomatis `1位,1位,ドベ` seperti cabang batas putaran atau menyerah.

## 5. Menyerah dan penilaian hasil

Teks dialog pesan 493 adalah `こうさんしますか？`. `80114128` memasang callback `80114390` saat konfirmasi dan `8011435c` saat batal.

Untuk Party individu, callback konfirmasi:

- `80017034` mengurutkan chakra mentah dengan pertukaran pasangan `<`. Tidak memakai penalti peserta inaktif dari hasil biasa.
- Slot `80013610()` digeser satu per satu sampai terakhir. Urutan peserta lainnya mengikuti hasil sort tersebut.
- `8001a19c` menyimpan empat byte urutan, `8001a1e4(1)` memilih cabang menyerah, lalu mode Party membuka layar hasil melalui `80110b98`.
- Pembuat badge mulai dari peringkat 0; slot yang menyerah diganti badge 3. Override actorStatus inaktif hanya berlaku pada posisi kedua dan seterusnya, sama seperti sumber. Jangan memperbaiki posisi pertama secara diam-diam.

Contoh: `[300,100,100]`, slot 0 menyerah → `[1,2,0]`, badge `[0,0,3]`. Untuk dua peserta, pemain yang tidak menyerah mendapat 1位, yang menyerah ドベ.

Cabang Team Battle menyusun dua lawan dahulu, rekan penyerah berikutnya, dan penyerah terakhir. Itu tidak dimasukkan dalam model Party individu. Cabang mode cerita juga memilih scene sesudah menyerah secara berbeda.

## 6. Hasil Party tidak memberikan progres cerita

Ini koreksi penting terhadap penggunaan predikat unlock secara terpisah dari pemanggilnya:

1. `MENU 800b3de4` case 1 menetapkan mode melalui `800128f4(1)` untuk Party. Getter `80012904` membaca word mode itu di `0x80070730`.
2. `BOARD 801111f4` case 4, ketika hasil dikonfirmasi dan mode bukan 0, menulis tujuan scene 2, lalu melewati fade menuju `80011a60(2)`.
3. `80011a60` hanya menulis tujuan scene; dispatcher `800117a4` tidak menyisipkan scene 16.
4. `MENU 800af640` menjalankan reset hasil `80019f38`, yang mengosongkan blok `0x80089d60..0x80089db3`.

Scene 16 (`CONCNOTI`) lah yang memanggil `800c2748` untuk statistik dan `800c25ac` untuk unlock. Jalur cerita yang lolos pemeriksaan hasil dapat menuju scene 8, 9, atau 16; scene penutup/hadiah kemudian mempunyai transisinya sendiri ke 16. Hasil Party langsung ke 2.

Akibat untuk implementasi:

- Jangan memanggil `applyResultCounters`/`evaluateProgression` setelah **setiap** pertandingan Party.
- Flag papan, teknik, karakter, dan varian yang tersedia di Party dibaca dari progres tersimpan. Predikat flag 98–101 yang dijelaskan pada GAME_RULE tidak berarti dapat diperoleh hanya dengan menjalankan kejadian tersebut di Party.
- Banyaknya badge 1位 pada hasil seri Party tidak memicu hadiah berulang atau menetapkan beberapa ID karakter pemenang.
- Tidak adanya evaluasi hasil Party tidak berarti seluruh data game bebas berubah: penghitung sesi saat peluncuran pertandingan dan pengaturan menu adalah mekanisme terpisah.

## 7. CPU, RNG dan timing termasuk perilaku yang harus dipertahankan

Bagian ini merangkum kontrak yang sudah ditelusuri pada modul lain, bukan mengklaim seluruh AI lengkap.

| Sistem | Detail yang tidak boleh diganti heuristik umum | Bukti |
| --- | --- | --- |
| Menu CPU sebelum bergerak | Satu draw RNG setiap masuk evaluasi, termasuk masuk ulang; prioritas gerak 250, kartu berhasil 350, gulungan 1000; frekuensi kartu memakai `>` sedangkan gulungan `>=` | [CPU sebelum roulette](story1-cpu-preroll.md) |
| Serang atau bayar | Ambang biaya 701/1001, relasi 255 langsung bayar, urutan draw relasi/cadangan, batas keterjangkauan teknik asli | [CPU penghalang](story1-cpu.md) |
| Kartu CPU | Kartu 19/27/29 memeriksa seluruh actorStatus lawan sama dengan 0, bukan sekadar bit inaktif; hubungan tim dan prioritas tidak sama dengan izin sasaran manusia | [CPU sebelum roulette](story1-cpu-preroll.md) |
| Roulette | 64 pertukaran slot dan satu draw sudut awal; sudut bertambah 180 modulo 4096; indeks memakai pembagian 341; hasil berhenti pada benturan palu kedua | [Roulette](fidelity-roulette.md) |
| RNG visual roulette | 65 draw awal +2 jitter palu +41/+41/+42 draw benturan = **191 draw** untuk siklus widget yang ditelusuri, di luar RNG adegan/pemilih CPU lainnya | [Roulette](fidelity-roulette.md) |
| Pemicu berhenti CPU | Target merupakan pemicu palu; delay dapat membuat hasil melampaui angka yang ditarget. Jangan memaksa hasil sama dengan target CPU | [Roulette CPU](story1-cpu-roulette.md) |
| Langkah tetap | Melewati roulette, tidak mengonsumsi RNG roulette atau durasi status roulette; nilainya dibaca dan dibersihkan melalui aksi gerak tersendiri | [Roulette](fidelity-roulette.md) |
| Jarak pertahanan | Peta 0 telah ditelusuri untuk 484 pasangan; peta bercabang memakai algoritme rute asli, bukan BFS generik | [Jarak dan state stack](fidelity-roulette.md#distance-sentinel-confirmed-native-stack-dependency) |

Panggilan tambahan RNG dari adegan/partikel/menu di luar widget tetap memengaruhi hasil berikutnya. Menyamakan seed awal saja tidak menjamin urutan permainan sama. Update logika harus mengikuti tick asli dan urutan update-before-input, bukan frekuensi paint browser atau timer acak.

**Inisialisasi RNG juga bagian dari kontrak.** Setelah inisialisasi MENU berhasil, `800af640` memanggil `srand(VSync(-1))`. Seed berasal dari penghitung VSync saat masuk menu, bukan selalu angka tetap per pertandingan. `EXE 80035d78/80035da8` memakai state u32 pada `0x800a3118`:

```text
seed = (seed * 1103515245 + 12345) modulo 2^32
rand = (seed >> 16) & 32767
```

Port JavaScript harus mempertahankan perkalian integer 32 bit, misalnya melalui `Math.imul`, serta semua konsumsi draw di antara menu dan kejadian gameplay. Untuk replay pembanding, rekam state RNG yang benar-benar dipakai dan tick masuk menu; menambahkan seed baru pada setiap roulette mengubah perilaku.

## 8. Data yang masih diperlukan untuk pembuktian 1:1

Spesifikasi angka/percabangan di atas dapat direproduksi dari sumber. Untuk kasus yang membaca state lama, jangan mengganti data yang belum tersedia dengan angka yang dianggap masuk akal:

| Ketergantungan | Yang perlu disimpan/dibandingkan |
| --- | --- |
| Kandidat eliminasi tanpa saldo positif | Byte `board+0x58b` sebelum scan dan slot fokus kamera |
| Rute bercabang sentinel | Byte pada `callerSP+0x47`, dan pada cabang terkait `+0x4f`, yang dibaca kode asli |
| Kartu langkah CPU dengan direction 255 | Byte runtime tile `+0x100`; nilai 0 hanya telah dibuktikan untuk kondisi peta 0 segar yang didokumentasikan |
| Kesetaraan RNG satu sesi | State RNG sebelum/sesudah setiap event, jumlah draw, tick dan input |
| Waktu input dan presentasi | Rekaman/frame referensi, state dialog/animasi dan urutan input yang sama |

Snapshot per event setidaknya memuat konfigurasi, jumlah peserta, slot giliran/fokus, counter putaran, chakra/flags/actorStatus, posisi/arah, inventori, status roulette/langkah tetap, gulungan dan counter-nya, seluruh level/HP/pemilik/efek petak, antrean delta, winner slot, winner character, flag hasil, flag akhir tanpa manusia, serta RNG.

Tidak ditemukan berkas trace, save-state, memory-card, atau rekaman video pembanding melalui pencarian ekstensi terkait di workspace proyek pada audit ini. Pengguna juga mengonfirmasi bahwa save-state/dump RAM belum tersedia. Oleh karena itu kasus ketergantungan memori dan kesetaraan satu sesi belum diuji terhadap eksekusi asli. **Aturan sudah diperinci lebih jauh; sertifikasi 1:1 tetap membutuhkan referensi eksekusi tersebut.**
