# Audit kelengkapan aturan game asli

Tanggal: 8 November 2026. Game: **Naruto: Shinobi no Sato no Jintori Gassen**, PS1, `SLPS_035.53`.

## Kesimpulan

**Belum lengkap untuk seluruh game, dan belum cukup untuk menyatakan replika 1:1.** [GAME_RULE.md](../GAME_RULE.md) sebelumnya merupakan dokumentasi Party Mode dengan beberapa batas eksplisit. Audit ini menambah aturan yang dapat ditelusuri, tetapi tidak menghapus ketidakpastian hanya karena suatu aset tersedia atau suatu tes JavaScript lulus.

Ada tiga hal yang harus dinilai terpisah:

1. **Data tersedia:** gambar, suara, tabel kartu/peta/teknik sudah diekstrak.
2. **Aturan diketahui:** kondisi, sasaran, perubahan state, urutan pemeriksaan, dan pengecualian sudah ditelusuri dari kode asli.
3. **Perilaku sama:** implementasi memberi hasil yang sama untuk input, state, dan urutan RNG yang sama, termasuk seluruh transisi. Ini memerlukan pembandingan eksekusi, bukan hanya melihat tabel atau aset.

Folder `arena1` memenuhi cakupan aset yang disebut dalam [README-nya](../arena1/README.md); manifest file bukan daftar lengkap seluruh cabang gameplay. Audit ini tidak mengubah runtime browser, tidak menambahkan hasil riset baru ke paket aset lama, dan tidak melakukan deployment.

## Metode dan batas bukti

- Membaca ulang `MENU`, `BOARD`, `COMBAT_SETUP`, executable utama, serta catatan riset yang lebih baru daripada audit awal.
- Mengekspor fungsi konfigurasi Party yang sebelumnya tidak ada pada berkas dekompilasi: `80012780`, `800129f4`, `80012af0`, `80012b74`, `80012c70`, dan `800122e4`, dengan Ghidra terhadap proyek EXE dalam mode baca-saja. Hasil: [PARTY_RULE_HELPERS.c](../decompiled/PARTY_RULE_HELPERS.c); skrip: [PartyRulesAudit.java](../scripts/ghidra/PartyRulesAudit.java).
- Mengekstrak tabel preset dan teknik langsung dari byte executable, terpisah dari tabel skenario cerita. Hasil: [party-rules.json](party-rules.json); reproduksi: `python3 scripts/extract_party_rules.py`.
- Membandingkan teks lama dengan katalog 52 kartu, 14 ID ninjutsu papan, 18 slot preset, daftar teknik 13 karakter, dan cabang penyelesaian pertandingan.
- Memeriksa sumber web primer sebagai konteks. [Halaman resmi TV Tokyo tahun 2003](https://www.tv-tokyo.co.jp/anime/naruto2002/goods/playstation.html) menjelaskan dua kelompok utama, pertandingan dan cerita, serta perebutan wilayah dan gulungan. Halaman itu **bukan buku aturan lengkap** dan tidak dipakai untuk menebak angka atau pengecualian mekanik.

SHA-256 executable acuan: `a97b3ebea329b267c186ae52fd21edb1891d66377d475cef32db5f133c296569`.

Istilah **terverifikasi statis** dalam audit ini berarti tabel/percabangan asli mendukung pernyataan tersebut. Itu tidak sama dengan pengujian seluruh permainan pada PS1. Nama fungsi dekompilasi dan parameter yang tidak terselesaikan tetap perlu diperlakukan hati-hati; fungsi tidak lengkap tidak dijadikan dasar fakta baru.

## Temuan baru yang menutup kekosongan dokumentasi

| Temuan | Bukti | Dampak pada aturan |
| --- | --- | --- |
| Preset Party terpisah dari cerita | `80012780`, tabel `0x80064918`, stride 48 byte | Jangan mengisi Party dari skenario cerita meskipun beberapa angka sama. |
| Sembilan pilihan Party mempunyai awal 1500, target 3000, bonus dasar 400, poin awal 3, penghargaan poin 4 | Record 0–8 dari tabel tersebut | Nilai default kini dapat ditulis sebagai fakta; target tetap dapat diedit. |
| Map 8 memakai dek 4; roulette awal terbagi menjadi tiga susunan | Record map/dek/12 slot | ID papan bukan selalu ID dek. Roulette bukan dadu seragam 1–6. |
| Dua aturan berparameter mempunyai default 5 | `80012780` membaca byte `0x80064c78`; `80012af0` membaca tabel parameter di `0x80010000` | Batas putaran dan jumlah bonus pemegang gulungan sama-sama mulai dari 5. Editor menerima 1–99. |
| Pemilihan papan memuat ulang konfigurasi dan state awal pemain | `MENU 800b944c/800b99a4` memanggil `80012780` dan `80012c70` | Pengaturan awal tidak boleh diasumsikan diwarisi tanpa perubahan setelah berganti papan. |
| Daftar ninjutsu Party berasal dari karakter | `80012c70`, tabel `0x800648e4` | Empat ID pada skenario cerita bukan daftar universal semua mode. |
| Ada lima pembukaan ninjutsu tambahan | `80012c70`, tabel `0x8006d6a0` dan `0x8006d6a8`, flag 87–91 | Membuka karakter tidak berarti seluruh tekniknya langsung terbuka. |

Urutan flag teknik: 87 Naruto/ID 8; 88 Sakura/ID 7; 89 Kakashi/ID 5; 90 Naruto/ID 5; 91 Sasuke/ID 3. Naruto di sini adalah karakter 0, bukan varian berkacamata 12. Tanpa flag, slot itu diganti sentinel 14; bukan diganti teknik lain.

Tabel preset mempunyai 18 record untuk fungsi pemuat bersama. **Hanya 0–8** yang dipilih oleh menu Party biasa. Record 9–17 yang juga diekstrak tidak menambah sembilan papan Party tersembunyi secara otomatis. Record 16/17 memuat konfigurasi balap kartu.

Nilai `storedValue` pada empat pasangan aturan di record preset sengaja disimpan mentah. Pemuat Party yang ditelusuri menggabungkan mask, tetapi mengambil parameter dari tabel default terpisah. Cara ini berbeda dari pemuat skenario `80012eac`, yang memproses pasangan mask/nilai skenario.

## Rincian penting yang sebelumnya terlalu ringkas

### Pertarungan

- `COMBAT_SETUP 8011ccb8` menghapus pilihan serangan terakhir untuk karakter 9/12 jika pembela bukan 11/8. Memunculkan seluruh teknik dari tabel mentah pada setiap lawan mengubah aturan.
- Modifikasi biaya kartu diterapkan sebelum keterjangkauan. Biaya tetap dibayar saat gagal/ditangkal; pilihan nol chakra masih sah saat saldo negatif.
- `BOARD 8011f2fc` memakai 12 slot dengan mask berdasarkan jarak. Slot aktif biasa diisi 1–3 untuk serang dan 1–4 untuk bertahan; sejumlah slot menjadi nol. Mask paling rendah tetap mempunyai satu slot aktif. Penjelasan “makin jauh, angka maksimum makin kecil” tidak tepat.
- `8011f4d8` menghitung kerusakan dari selisih teknik+roulette, dibatasi HP. HP tidak dimasukkan dua kali. Serangan sama dengan pertahanan teknik+roulette memberi kerusakan nol; serangan sama dengan **HP + pertahanan teknik+roulette** cukup untuk menghabiskan HP tanpa penangkal.
- Durabilitas sementara dari ninjutsu harus dibedakan dari level dan pemulihan HP setelah perebutan. Serangan alat langsung yang menghancurkan wilayah mengosongkannya, bukan merebutnya.

Rujukan: [fidelity-combat.md](fidelity-combat.md), [board-effects.md](board-effects.md), [story1-flow.md](story1-flow.md).

### Kartu, dek, dan sasaran

- Semua 52 definisi sekarang dicakup dalam tabel efek di `GAME_RULE.md`; itu belum merupakan terjemahan resmi 52 nama/deskripsi kartu.
- Dek 0 berisi **51 entri dan 29 ID unik**. Tidak semua definisi kartu hadir di arena pertama.
- Dispatcher memiliki tipe 2 (transfer ke pemain acak), tetapi tabel 52 kartu tidak mempunyai kartu tipe 2. Cabang kode yang ada tidak selalu merupakan fitur yang dapat dimainkan.
- Ada kartu bernomor berbeda dengan efek sama, dan kartu balap dengan perlakuan khusus jika ID >44. Jangan menggabungkan ID berdasarkan kemiripan efek saja.
- Pengembalian kartu, pemadatan inventori, dan membuang kartu baru saat tangan penuh adalah operasi berbeda. Memilih membuang kartu baru tidak melewati pengembalian kartu inventori lama pada `800ec574`.
- Teleportasi diri dapat memicu petak tujuan, tetapi pemanggilan semua lawan mempunyai cabang tanpa pengulangan kejadian tujuan. Sasaran, pemain tidak aktif, dan tim harus diperiksa per cabang.

Rujukan: [full-rules.json](full-rules.json), `BOARD 800ec574/800f2a9c/800db29c`, [fidelity-rules.md](fidelity-rules.md).

### Eliminasi dan hasil

`800e0b3c` menunjukkan penghapusan flag peserta, penandaan tidak aktif, pengosongan penghalang biasa, penghitungan ulang rangkaian, dan pemeriksaan jumlah manusia aktif. Cabang pertandingan individu dapat berakhir ketika semua manusia tereliminasi, walaupun lebih dari satu CPU masih aktif. Ini berbeda dari aturan buatan “lanjut sampai hanya satu CPU tersisa”.

`800e1958` sudah cukup untuk membuktikan **urutan array hasil**: skor chakra 32 bit dengan penalti 10000 untuk peserta tidak aktif, prioritas maksimum untuk pemenang yang sudah ditetapkan, lalu pertukaran pasangan dengan perbandingan `<`. Pengurutan stabil generik tidak setara; skor `[100,100,200]` menghasilkan `[2,1,0]`.

Namun urutan array tidak dengan sendirinya membuktikan kebijakan seri yang ditampilkan dan semua akibat progres. Masih perlu pemeriksaan kasus semua saldo nol/negatif, kemenangan belum ditetapkan, dan team mode dengan indeks pemenang sentinel 255. Pada cabang eliminasi tertentu, pencarian pemenang dimulai dari pembanding nol dan hanya mengganti kandidat untuk saldo yang lebih besar; jangan menganggap kasus nol telah tertangani tanpa melihat state masuknya.

## Matriks cakupan seluruh game

| Sistem | Yang sudah diketahui | Yang belum cukup untuk klaim lengkap |
| --- | --- | --- |
| Setup Party | Peserta/CPU, sembilan pilihan papan, preset, daftar teknik, flag teknik, editor/varian | Perilaku seluruh kombinasi pengaturan ekstrem dan pengujian alur menu asli |
| Giliran dan ekonomi | Roulette/kartu/jutsu/gulungan, kejadian saat melintas, bonus, tarif, peningkatan, penjualan | Seluruh interaksi status dan kejadian bersarang pada semua peta |
| Pergerakan | Topologi 18 peta; rute pembela map 0 ditelusuri penuh | Semua persimpangan, aturan map 5/7, data RAM di luar record yang dibaca kode asli |
| Kartu/ninjutsu | Katalog data, biaya, efek utama, sasaran dasar, penggunaan/inventori | Matriks lengkap sasaran/status/tim pada setiap konteks dan seluruh urutan RNG |
| Pertarungan | Pilihan, keterjangkauan, kartu, roulette, kerusakan, penangkal, gulungan | Seluruh keputusan teknik CPU, interaksi reaktif, dan rangkaian state asli |
| Gulungan | Pemberian/perebutan, proteksi, empat kekuatan, penghitung pengisian | Seluruh kombinasi tim, eliminasi, dan efek bersamaan |
| Akhir Party | Empat varian, jalur menang sumber, cabang eliminasi, algoritme peringkat | Semua seri, state ekstrem, tampilan hasil, dan akibat progres |
| Cerita | Tabel tiga kampanye, skenario, dialog; alur Bab 1 lebih rinci | Semua kondisi menang/kalah, transisi dan cerita untuk semua tahap |
| Team Battle | Aturan tutorial, cabang berbagi uang/kristal, pengecualian sasaran | Port terpadu dan pembandingan tiap kombinasi tim/seri/eliminasi/gulungan |
| Balap kartu | Peta 16/17, dek, pembuka, draw/rest, efek petak, urutan menang | Urutan RNG program penuh, timing roulette CPU, seluruh presentasi dan hadiah |
| Pembukaan/harta | 160 record progres, 28 keluarga predikat, 56 harta, syarat pengambilan | Semua pemasok statistik kejadian, hasil terpadu, format/siklus penyimpanan asli |
| Interaksi 1:1 | Sebagian timing roulette/gerak, sprite, font, musik, dialog | Semua prompt/menu, respons tombol, kamera, animasi, suara, dan sinkronisasi frame |

Tidak diberikan persentase kelengkapan karena jumlah seluruh cabang relevan dan cakupan eksekusinya belum diukur. Menghitung banyaknya fungsi, gambar, atau tes bukan ukuran kesetaraan gameplay.

## Prioritas untuk target arena pertama / cerita Bab 1

1. Jadikan konfigurasi cerita 0 sebagai acuan Bab 1: Naruto berkacamata versus Mizuki. Preset Party 0 mempunyai angka ekonomi yang sama tetapi pilihan pemain dan pembukaan teknik mengikuti alur berbeda.
2. Bandingkan perjalanan lengkap yang memicu: lewat chance, lewat sumber dengan bonus dan peningkatan, kristal terakhir, inventori penuh, perubahan roulette, gulungan, perebutan, penjualan paksa, dan kemenangan sumber.
3. Tutup keterbatasan keputusan CPU: pilihan teknik reaktif serta pembacaan rute yang bergantung pada RAM. Catatan integrasi saat ini masih menyatakan fallback untuk `UNKNOWN_ROUTE_RAM`; hasil fallback bukan bukti keputusan asli.
4. Bandingkan menu sebelum gerak, waktu berhenti roulette, urutan pesan, tur pembuka peta, dan alur kemenangan → penutup → hasil/progres. Aturan numerik benar belum menjamin pengalaman dimainkan identik.
5. Simpan jejak pembanding berisi input, RNG, giliran, posisi/arah, chakra, poin, inventori/dek, kristal, gulungan, level/HP/efek setiap petak, dan alasan hasil. Replika tetap tanpa emulator; pembuktian dapat memakai rekaman atau eksekusi referensi game asli bila tersedia.

Status batas integrasi terakhir dijelaskan di [story1-flow.md](story1-flow.md#integrated-first-chapter-status-2026-11-08). Audit ini tidak menjalankan pembandingan konsol baru dan tidak mengklaim keterbatasan itu telah diselesaikan.

## Menggunakan catatan lama

Beberapa riset awal sengaja menyebut bagian yang ketika itu belum diketahui. Untuk konflik spesifik ini, gunakan bukti lanjutan:

- Empat ID pada konfigurasi pemain adalah **ninjutsu papan**, bukan kartu inventori atau daftar serangan tempur.
- Byte konfigurasi +17 adalah penghargaan poin bonus; `unknownSetting17` merupakan nama lama dalam JSON.
- Kata hasil pembela `board+0x5ce` untuk perpindahan gulungan sudah ditelusuri di `story1-flow.md`: pertahanan gratis terakhir menulis sentinel `0xffff`.
- Jarak pembela map 0 sudah ditelusuri; catatan lama bahwa semua fungsi jarak belum dipindahkan terlalu luas. Peta bercabang tetap belum setara secara menyeluruh.
- Aturan balap, efek ninjutsu, dan pemutar font sudah mempunyai riset lanjutan; daftar kekurangan historis pada `fidelity-rules.md` tidak boleh dipakai sendirian sebagai status terbaru.

Pernyataan yang masih belum pasti tetap ditandai. File JSON bernama `full-rules.json` adalah kumpulan tabel hasil ekstraksi, **bukan sertifikasi bahwa semua aturan telah direkonstruksi**.
