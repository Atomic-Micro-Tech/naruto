# Naruto - Shinobi no Sato no Jintori Gassen (Japan) — RE Notes

## Update — browser reconstruction (2026-11-08)

Lihat [README.md](README.md) untuk game browser, cara menjalankan, hasil ekstraksi, dan keterbatasan. Temuan terbaru menggantikan pertanyaan terbuka lama di bawah:

- Indeks DATA.BIN di offset 0x44: 1.504 resource; 2.673 paket PK02 tervalidasi.
- 696 TIM dan 18 latar papan berhasil diekstrak. Latar memakai ubin 8×8 **column-major**, bukan TIM biasa.
- Overlay papan/pertarungan telah didekompilasi; graf, koordinat, ekonomi dan tabel teknik dipulihkan.
- 714 bank VAB menghasilkan 1.081 sampel WAV unik; parsing VH/VB telah diperbaiki. XA tetap belum di-decode.
- Bukti rinci: [research/gameplay.md](research/gameplay.md), [research/audio.md](research/audio.md).

## Disc
- Image: `Naruto - Shinobi no Sato no Jintori Gassen (Japan).bin` + `.cue`
- Format: raw MODE2/2352, single track (TRACK 01, INDEX 01 00:00:00)
- Volume ID: `SLPS-03553`
- Filesystem: ISO9660

## Files on disc

| File | LBA | Size (bytes) | Notes |
|---|---|---|---|
| `SYSTEM.CNF` | 23 | 68 | `BOOT = cdrom:\SLPS_035.53;1`, `TCB=4`, `EVENT=16`, `STACK=801fff00` |
| `SLPS_035.53` | 24 | 385024 | Main PS-X EXE |
| `XASECT.BIN` | 32446 | 692 | XA sector data |
| `DATA.BIN` | 212 | 66015232 | Starts with raw MIPS code (`0x4`, then instructions). Format unknown |
| `DATA2.BIN` | 32447 | 166428672 | Game data. Format unknown |
| `DUMMY.BIN` | 113711 | 50667520 | Padding or spare data (unverified) |

## Main executable (`SLPS_035.53`)
- Header: PS-X EXE
- Entry PC: `0x80011448`
- Load address (text): `0x80010000`, size `0x5d800`
- Initial SP: `0x801ffff0`
- Uses Sony SDK library (CD functions such as `CdSearchFile`, `CdlReadS`, `CdlSetloc`; interrupt handler from `intr.c`, 1997)
- Contains debug strings in English (e.g. `VSync: timeout`, `CD_newmedia: ...`)

## Open questions
- [ ] Format of `DATA.BIN` (overlay? how is it loaded into RAM?)
- [ ] Format of `DATA2.BIN` (graphics / text / audio?)
- [ ] Is `DUMMY.BIN` actually unused?

## Tools
- Extraction script: `/tmp/naruto_re/iso_dump.py` (outside project)
- Extracted files: `/tmp/naruto_re/extracted/`
- Installed: DuckStation (`/Applications/DuckStation.app`)
- Ghidra 12.2: `tools/ghidra_12.2_PUBLIC/` (installed)
- Ghidra extension: `lab313ru/ghidra_psx_ldr` (PSX Executables Loader), built from source against 12.2 and installed in `tools/ghidra_12.2_PUBLIC/Ghidra/Extensions/ghidra_psx_ldr/`
  - Build needed 4 small API fixes for Ghidra 12.2 (`clearCanceled()` removed, `@Override` on `getCustomEditorComponent`); patched copy is in `/tmp/naruto_re/ghidra_psx_ldr/`
- `SLPS_035.53` imports with `PSX Executables Loader` (verified): CODE block `80010000`–`8006d7ff`, entry point `80011448` detected automatically
- Ghidra project: `/tmp/naruto_re/ghidra_proj/` (project `SLPS`)
- Native decompiler for macOS arm64 was missing in the 12.2 distribution; built with `support/gradle` → `gradlew buildNatives` (output in `Ghidra/Features/Decompiler/build/os/mac_arm_64/`). Decompiler now works.
- Fixed `PsxAnalyzer` error by importing with processor `PSX:LE:32:default` directly (no language switch needed).
- PSY-Q signatures: from `lab313ru/psx_psyq_signatures`, copied into extension `data/psyq/`. Version tested by named-function count: 340=228, 350=235, 370=267, 400=269, 420=752, 430=787, 440=852, 450=857, 460=1103, **470=1130 (chosen)**. Set via pre-script `SetPsyq.java`.
- Full export: `decompiled/SLPS_035.53.c` — 1570 functions, 0 decompile failures, 1130 named by PSY-Q, 440 still `FUN_xxxxxxxx` (game-specific code).
- Not yet covered: `DATA.BIN` and `DATA2.BIN` (see sections below).
- Decompiled so far: `start` (0x80011448) zeroes BSS `8006d750`–`800ad450`, calls `InitHeap`, then `main`. `main` (0x80011504) calls `FUN_80011440`, `FUN_80035788`, `FUN_80011560`, `FUN_80011608`, then loops on `FUN_800117a4`.

## DATA2.BIN and XASECT.BIN (analysis)
- Loaded by name in `FUN_800172ec`: `CdSearchFile("\\DATA2.BIN;1")`, base CD position stored in `DAT_80071888`.
- `XASECT.BIN` (692 B) is loaded by `FUN_8002d818` into `0x80089218`. It is an index table:
  - u32 count = 0x56 (86 entries), then 8-byte entries starting at file offset 4.
  - Entry u32 #0 = sector offset inside `DATA2.BIN` (strictly increasing; last = 79184 < 81264 total sectors, so consistent).
  - Entry u32 #1 meaning unknown (values like 0x2fe800; not used by code I have checked).
- Lookup: `FUN_80019468(id)` = DATA2 base + table[id >> 4].sector. `FUN_800194b8` gives `DAT_80064d58[id & 0xf] << 4`. `FUN_800191b0` queues the read through the sector queue at `DAT_800a274c`.
- Not yet decoded: entry #1 field, the per-record format inside each entry, and any compression.

## DATA.BIN (analysis)
- Sectors 0x0–0x40000 look like MIPS code (about 90% opcode-plausible words), then padding and data.
- Later regions with printable runs like `CUvwww` look like packed 4-bit pixel data (textures or tiles). Not verified.
- No `DATA.BIN` filename reference in decompiled code; LBA 212 not found as a literal. Load path still unknown.

## DATA2 resource lookup (decoded from overlay call site)
- `DATA.BIN` has exactly one `jal 0x800193a0` at file offset `0x112648c`. Code there:
  - `g = FUN_80012954()` (returns global `DAT_8007073f`; setter is `FUN_80012964`, probably current stage/area)
  - `FUN_800193a0(g, 2, id & 0xff, 0x80128864)`
- In `FUN_800193a0`: index = `DAT_80064d1c[(g + 2) & 0xff] * 0x10 + (id & 0xff) - 1`
- `FUN_80019468(index)`: XASECT entry = `index >> 4` (sector = DATA2 base + sector field), sub-slot = `index & 0xf`.
- `DATA2` entries are multi-MB blobs (1000–2000 sectors each), start with byte runs like `0c 0c …`, `1a 1a …` (not a readable header, probably compressed or encoded graphics/data). Format is still unknown.
- `DAT_80064d1c` is in the EXE (file offset from `0x80064d1c - 0x80010000 + 0x800`): sorted bytes `00 04 05 06 09 0a 0c 0e …`.

## Assets (preliminary)
- `DATA.BIN` contains many VAB-like headers (`pBAV`, version 7; ~666 pass basic checks). Likely PS1 sound banks (SPU ADPCM / VAG samples).
- Raw disc has ~28k XA audio sectors (submode bit 2). Likely streamed audio/voice.
- `DATA2.BIN`: no valid TIM image headers found, so graphics are probably compressed or stored in an encoded form.
- Hand-written VAB parser attempt failed: the VAG size table location is not yet confirmed. Output was invalid and was deleted.
- Next step: use a proper tool (vgmstream supports PS1 VAB/XA) or finish the VAB layout.
