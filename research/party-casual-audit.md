# Audit lanjutan Party / Casual

Tanggal: 8 November 2026. Acuan: disc lokal `SLPS_035.53`, **Naruto: Shinobi no Sato no Jintori Gassen**. Ringkasan aturan yang dapat dibaca pemain ada di [GAME_RULE.md](../GAME_RULE.md).

Audit ini menutup beberapa kekosongan yang masih disebut pada [audit sebelumnya](rules-completeness-audit.md): nama empat varian, kondisi pembukaannya, sasaran kartu simpanan, serta perbedaan urutan peserta dan label peringkat. Temuan bersifat **verifikasi statis kode dan aset asli**, bukan hasil perbandingan rekaman PS1. Runtime browser tidak diubah oleh audit ini.

**Pembaruan alur lengkap:** [spesifikasi Party 1:1](party-1to1-contract.md) menelusuri callback yang sebelumnya hilang. Hasil Party menuju menu tanpa evaluasi unlock; flag hasil nonzero berasal dari menyerah; jalur kursor kartu lama tidak dicapai oleh konteks kartu standar. Kondisi unlock di bawah tetap benar sebagai predikat, tetapi tidak berarti dapat diberikan lewat hasil Party.

## Bukti yang dapat direproduksi

```sh
.venv/bin/python scripts/extract_party_audit.py
```

Hasilnya adalah [evidence.json](party-casual/evidence.json), [teks aturan](party-casual/rule-text.png), dan [label hasil](party-casual/result-labels.png). Skrip membaca byte resource 41 dan tabel sprite BOARD; teks dirender dari indeks glyph asli yang sudah diekstrak. Transkripsi Jepang adalah pembacaan manual gambar glyph, bukan hasil tebakan dari nama fungsi. Gambar diperbesar dan dipenggal untuk riset; bukan tangkapan layar tata letak game.

[PartyCasualAudit.java](../scripts/ghidra/PartyCasualAudit.java) mengekspor fungsi EXE tambahan dengan Ghidra; hasilnya [PARTY_CASUAL_HELPERS.c](../decompiled/PARTY_CASUAL_HELPERS.c). Jalankan sebagai post-script terhadap program `SLPS_035.53` dengan `-readOnly -noanalysis`, disertai path keluaran C sebagai argumen. Tidak perlu mengubah program proyek Ghidra atau menjalankan emulator untuk ekspor ini.

SHA-256 EXE: `a97b3ebea329b267c186ae52fd21edb1891d66377d475cef32db5f133c296569`. Metadata menyertakan hash kedua overlay, sumber glyph, dan resource gambar hasil yang dipakai.

## Nama dan arti empat varian

`MENU 800bcad4` menampilkan pesan `130 + pilihan` dengan pilihan 0–4. Pesan 651/652 menamai parameter numerik sebagai `ターン数` / `ボーナス`. Pemberitahuan pembukaan memakai `2194 + flag`, sehingga flag 98–101 menghasilkan pesan 2292–2295.

| Pilihan | Mask | Flag pembukaan | Nama pada pemberitahuan asli |
| --- | --- | --- | --- |
| 0 | 0 | Tidak diperlukan | Menu: `ついか条件なし` |
| 1 | 1 | 98 | `マイナスチャクラで脱落` |
| 2 | 2 | 99 | `決められたターンで終了` |
| 3 | 4 | 100 | `封印の書をもったままマップを周回で勝ち` |
| 4 | 8 | 101 | `封印の書をもったままクリア` |

Pesan 133 menyebut `決めた数のボーナスをおこなっても勝ち`: sejumlah bonus yang ditetapkan **juga** dapat memberi kemenangan. Karena itu nama pendek yang menyebut mengelilingi peta tidak boleh diterjemahkan menjadi hitungan langkah, kristal, atau sekadar melintasi sumber tanpa memenuhi bonus. Cabang sumber pada `BOARD 800edd68` tetap menjadi penentu mekanik: varian mask 4 mempunyai jalur target chakra **atau** bonus pemegang gulungan; mask 8 memerlukan target chakra **dan** gulungan.

## Syarat pembukaan: predikat dan waktu evaluasi

Data: [progression-data.json](progression-data.json), tabel MENU `0x800c7318`, stride 24 byte. Semua nomor slot/karakter/tahap di bagian teknis berbasis nol.

| Flag | Tipe dan args mentah | Predikat |
| --- | --- | --- |
| 98 | 24: `[-1,-1,-1,-1,-1]` | `80015234(0) != 0`, jumlah perubahan chakra nonnegatif → negatif pemain slot 0 |
| 99 | 12: `[-1,-1,40,-1,-1]` | Map bukan 16/17 dan `80012c54() >= 40` |
| 100 | 9: `[-1,-1,3,-1,-1]` | `8001519c(0,3) != 0`, penggunaan kekuatan gulungan kategori 3 |
| 101 | 8: `[-1,-1,-1,-1,-1]` | `80016bec(0..3)` semuanya bukan nol |

Urutan yang penting pada `MENU 800c1d9c`:

1. `800c2748` menyalin statistik hasil, termasuk kelima penghitung `8001519c(0,i)`.
2. Setter EXE `80016bb8(i,value)` **menulis langsung** ke `0x80070766 + i*2`. Tidak menjumlahkan statistik pertandingan sebelumnya.
3. `800c25ac` mengevaluasi predikat pembukaan; pemindaian diulang sampai tidak ada flag baru.

Dengan demikian flag 101 menguji empat kategori dari pertandingan yang baru diproses, seluruhnya milik pemain pertama. Menggunakan kategori 0/1 di pertandingan pertama dan 2/3 di pertandingan kedua tidak cukup. Setelah diberikan, flag itu tetap bagian dari bitfield progres dan tidak dicabut ketika penghitung hasil berikutnya berubah.

Penghitung pertandingan berada di blok pemain yang dibersihkan `EXE 80013498`: `memset(0x80070ea0, 0, 0x2d4)`. Pemanggilan reset terlihat pada inisialisasi menu pemilihan pertandingan dan pemuat skenario; alamat penghitung `0x80070f1e + slot*0xb4` termasuk di dalam blok itu. Menyimpan lalu melanjutkan pertandingan yang sama tidak berarti memulai pertandingan baru.

Pada `BOARD 800d8930`, kategori 0/1/2/3 sesuai urutan empat kekuatan di GAME_RULE. Kategori 1 dan 2 dinaikkan **sebelum** roulette keberhasilan atau tantangan penghalang selesai. Syaratnya penggunaan yang sudah masuk cabang tersebut, bukan keberhasilan akhirnya. Membuka menu lalu membatalkan sebelum cabang penggunaan tidak membuktikan kenaikan penghitung.

Penghitung utang untuk flag 98 naik sesudah animasi perubahan chakra selesai, bila nilai awal nonnegatif dan nilai akhirnya negatif (`BOARD`, sekitar pemanggilan `800151f0`). Bertahan pada saldo negatif tidak dihitung sebagai transisi baru setiap frame. Predikat tidak menguji apakah saldo akhir pertandingan masih negatif.

Tidak ada pemeriksaan pemenang atau ID karakter pada empat predikat ini. Itu tidak membuktikan semua jalur keluar, reset, atau pengunduran diri memanggil scene progres. Pembukaan di sini berlaku **ketika alur hasil tersebut dijalankan**. Tidak dijalankan hanya karena menu Party dibuka.

### Papan dan ninjutsu yang memengaruhi Party

Record 79–84 menggunakan tipe 10 dengan `(campaign,stage)` berturut-turut `(0,1), (0,2), (0,4), (0,5), (0,7), (0,8)`. Record 86 memakai `(1,2)`. Record 85 bertipe 1 dengan ambang 56; `800c2f44` menghitung flag harta 0–55, sehingga seluruh harta diperlukan.

Record 87–91 memberi pembukaan teknik pada `(0,1), (0,1), (0,2), (0,4), (0,5)`. Pemetaan karakter/tekniknya diverifikasi terpisah melalui tabel EXE pada [party-rules.json](party-rules.json).

`800c33a8` untuk tipe 10 hanya membaca campaign dan stage. Nilai 500 yang terdapat pada beberapa record bukan syarat minimum chakra dalam predikat ini. Kata “menang di bab X” tidak ditambahkan sebagai kesimpulan dari record saja: pemeriksaan langsung pemenang tidak ada di fungsi tersebut, sedangkan pemanggil scene hasil menentukan kapan evaluasinya terjadi.

## Sasaran dan konsumsi kartu

Alur pemilih standar di `BOARD 800d15a8`, konteks `board+0x2eb == 7` (kartu simpanan) atau `0x54` (teleportasi ke pemain):

1. `80103e6c(1)` hanya dipanggil bila ID kartu `board+0x530 == 36`; untuk kartu lain nilainya 0.
2. `80103e8c` menyusun daftar slot yang `actorStatus & 1 == 0`. Diri sendiri hanya dikeluarkan bila parameter langkah pertama bernilai 1. Tidak ada penyaringan berdasarkan tim di pemilih ini.
3. Diri sendiri menjadi pilihan awal bila disertakan. Pembatalan mula-mula diizinkan; konteks `0x54` memanggil `80103e7c(0)` untuk mematikannya.
4. `80104098` mengembalikan slot pilihan. Pada konfirmasi, `800d15a8` menjalankan dispatcher efek.

| Tipe efek / ID nyata | Perubahan state target |
| --- | --- |
| 5 / 13–18 | Menulis nilai kartu ke forced-move byte `+0x21`; mengganti nilai sebelumnya |
| 7 / 19 | Menulis skip-turn `+0x20` hanya bila target berbeda dari pemakai |
| 13 / 27–28 | Menulis status roulette `value | 0x10` ke `+0x26` |
| 14 / 29 | Menulis status roulette `value | 0x20` ke `+0x26` |
| 15 / 30 | Menulis status roulette `0x32` ke `+0x26` |

Sesudah dispatcher, jalur bersama selalu memanggil `80013b10(actor,inventorySlot)`, memuat ulang tiga slot tangan, mematikan menu kartu melalui `80102a74(0,5,2)`, dan menulis `board+0x60f = 1`. Karena itu kartu 19 pada diri sendiri tetap dikonsumsi dan menghabiskan jatah kartu meskipun tidak memasang efek skip baru. Status roulette dan langkah tetap tidak ditambahkan ke status lama.

Pembatalan konteks 7 masuk `LAB_800d2f28`, lalu kembali ke UI kartu `8010cd00/8010cd2c(2)`, tanpa penghapusan inventori atau penulisan flag penggunaan. Ini berbeda dari konfirmasi yang efeknya tidak berguna.

`8010f3e0` memisahkan pilihan berdasarkan konteks: papan memakai useFlag 2; penyerang memakai useFlag 0 dengan tipe 8/9; pembela memakai useFlag 0 dengan tipe 10/11. Tidak ada definisi tipe 11 pada 52 kartu asli. ID 20/21 adalah efek gulungan bersyarat dan bukan aksi kartu papan biasa.

**Pembaruan keterjangkauan:** fungsi besar ini juga menyimpan jalur kursor peta `800bbaf4`, tetapi penelusuran lanjutan membuktikan konteks kartu 7/0x54 selalu masuk/menunggu pemilih daftar lalu langsung menuju konfirmasi atau pembatalan. Jalur kursor tersebut tidak menambah sasaran sah untuk pemakaian kartu biasa. Pilihan CPU mempunyai filter strategis tersendiri; lihat [story1-cpu-preroll.md](story1-cpu-preroll.md).

## Urutan hasil berbeda dari label peringkat

`BOARD 800e1958` menyusun urutan slot. Skor pengurutan = chakra dikurangi 10000 jika tidak aktif; slot pemenang yang sudah ditetapkan diprioritaskan dengan `INT_MAX`. Pertukaran pasangan terjadi bila skor kiri < kanan. Urutan pada saldo seri dapat berubah akibat pertukaran dengan peserta ketiga; algoritme ini bukan pengurutan stabil.

Getters/setters yang diekspor ulang:

| Fungsi EXE | Arti yang dibuktikan |
| --- | --- |
| `8001a19c` / `8001a1bc` | Menulis/membaca empat slot urutan di `0x80089da0..3` |
| `8001a1e4` / `8001a1f0` | Menulis/membaca byte cabang hasil di `0x80089da4` |
| `8001a250` / `8001a274` | Menulis/membaca **ID karakter** pemenang di `0x80089da5`; setter menerima ID <13 |
| `80013610` | Slot pemain yang sedang bertindak, `0x80070ea1` |
| `80013e48` | Status aktor per slot, `0x80070ec7 + slot*0xb4`; bit 0 dipakai untuk tidak aktif |

`BOARD 80110d68` kemudian menghitung badge per posisi urutan. `8011186c/80111aac` menggambarnya dari resource 41 menggunakan UV `0x8013a6b0`, CLUT `0x8013a6c8`, tpage 13. Enam badge yang telah dibaca dari gambar:

| ID | Tulisan asli | Makna |
| --- | --- | --- |
| 0 | 1位 | Peringkat pertama |
| 1 | 2位 | Peringkat kedua |
| 2 | 3位 | Peringkat ketiga |
| 3 | ドベ | Paling akhir; bukan selalu posisi keempat |
| 4 | 勝ち | Menang, cabang tim |
| 5 | まけ | Kalah, cabang tim |

TIM resource ini memakai carrier mode 2, tetapi renderer membaca word sebagai indeks piksel **4-bit** dengan CLUT. Membuka TIM tersebut sebagai RGB langsung tidak menghasilkan label yang benar. Skrip ekstraksi mengikuti UV/CLUT renderer dan memeriksa ukuran bloknya.

### Algoritme label Party individu

Berikut ringkasan cabang non-tim dari `80110d68`; `order` berisi slot, sedangkan `rank` di sini adalah **ID badge berbasis nol**.

```text
rank = 0
if specialResult == 0:
    rank = 1
    if flags & 2:
        rank = int(turnCount < configuredLimit)
badge[0] = 0
previousChakra = chakra[order[rank]]
for position = 1 .. playerCount-1:
    if chakra[order[position]] < previousChakra:
        rank += 1
        previousChakra = chakra[order[position]]
    badge[position] = rank
if specialResult == 0 and rank > 0:
    for position = 1 .. playerCount-1:
        if badge[position] == rank: badge[position] = 3
else if specialResult != 0:
    badge[position of current player] = 3
for position = 1 .. playerCount-1:
    if inactive(order[position]): badge[position] = 3
```

Saat batas putaran tercapai, seluruh peserta aktif, tanpa prioritas pemenang sumber, dan specialResult 0, nilai sama berbagi badge; kelompok paling bawah diganti ドベ kecuali semuanya sama. Contoh chakra slot `[100,100,200]` menghasilkan urutan `[2,1,0]` dengan badge `[0,3,3]`. Empat saldo sama memberi badge `[0,0,0,0]`, bukan kemenangan tunggal karena nomor slot. Ini menjelaskan label tampilan; tidak secara otomatis membuktikan bahwa setiap sistem hadiah memperlakukan mereka sebagai pemenang.

Pada kemenangan sumber dengan cabang biasa, `rank` mulai 1 dan saldo acuan adalah peserta kedua. Pemain pertama yang diprioritaskan tetap 1位, walaupun saldonya sama atau lebih rendah dari peserta lain. Label sisa dihitung terpisah; pada dua peserta hasil biasa adalah 1位 / ドベ.

Ada juga pengecualian **tim** pada fungsi yang sama: tim diurutkan berdampingan dan awalnya menerima badge 4/4/5/5. Jika chakra dua tim sama, specialResult 0, serta batas putaran tercapai, kedua badge 5 diubah menjadi 4. Artinya seluruh anggota ditampilkan `勝ち` dalam cabang itu. Ini temuan label Team Battle, bukan aturan Party individu dan bukan verifikasi lengkap ekonomi/progres tim.

## Pemeriksaan hasil audit

- Dua kali ekstraksi menghasilkan JSON dan kedua PNG yang identik byte demi byte. Ukuran blok TIM, batas UV/CLUT, dan tipe kontrol pesan diperiksa oleh skrip; hash sumber dicocokkan kembali.
- Keenam badge dan sebelas pesan diperiksa secara visual dari glyph/piksel asli. Seluruh tautan berkas lokal pada dokumen yang diperbarui tersedia.
- Batas 39/40/41 putaran, pengecualian map 16/17, statistik pemain pertama, dan penimpaan penghitung lintas pertandingan diperiksa terhadap model progres yang sudah ada, lalu dicocokkan dengan predikat C di atas.
- Lima contoh label batas putaran dan satu contoh saldo seri pada kemenangan sumber dihitung ulang mengikuti percabangan `80110d68`.

Pemeriksaan model dan perhitungan tersebut menguji konsistensi dokumentasi terhadap sumber yang dibaca; keduanya tidak menggantikan jejak eksekusi PS1.

## Yang masih perlu dibuktikan

- Pembandingan state memori pada eliminasi tanpa penyintas bersaldo positif. Algoritme mempertahankan kandidat lama sudah ditetapkan pada audit berikutnya, tetapi byte konkret belum ditangkap dari eksekusi asli.
- Dampak hasil tim/cerita yang tidak boleh disamakan dengan Party individu. Tujuan scene Party dan ketiadaan evaluasi unlock setelah hasilnya sudah ditetapkan pada audit berikutnya.
- Pembandingan input/animasi pada target nol/ekstrem sepanjang sesi. Predikat angka target serta pemilihan sasaran standar sudah ditetapkan.
- Nama setiap kartu/teknik yang belum dibaca, keputusan CPU lengkap, RNG, animasi dan timing input.

Audit ini memperluas aturan yang diketahui. Banyaknya temuan, gambar, atau fungsi yang diekspor tidak menjadi ukuran persentase kelengkapan atau bukti replika 1:1.
