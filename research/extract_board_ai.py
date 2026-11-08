#!/usr/bin/env python3
import hashlib,json,struct
from pathlib import Path
root=Path(__file__).resolve().parents[1]
e=(root/'extracted/disc/SLPS_035.53').read_bytes();d=(root/'extracted/disc/DATA.BIN').read_bytes()
lba,size=struct.unpack_from('<II',d,0x44+8);b=d[(lba-212)*2048:(lba-212)*2048+size]
def main(a,n):return e[a-0x80010000+0x800:a-0x80010000+0x800+n]
def board(a,n):return b[a-0x800ad450:a-0x800ad450+n]
def rows(a,w,n):return[list(board(a+i*w,w)) for i in range(n)]
j={'schemaVersion':1,'exeSha256':hashlib.sha256(e).hexdigest(),'boardSha256':hashlib.sha256(b).hexdigest(),
'cardPriorities':rows(0x80139c0c,60,5),'discardPriorities':rows(0x800ad878,16,4),'jutsuPriorities':rows(0x80139e78,14,4),
'combatSelectionRanks':list(struct.unpack('<12i',board(0x800af8f4,48))),
'combatReactiveDivisors':[list(struct.unpack('<2i',board(0x800af924+i*8,8)))for i in range(13)],
'characterBoardBytes':[list(main(0x80064c88+i*9,9))for i in range(13)],
'characterCombatBytes':[list(main(0x80064d00+i*2,2))for i in range(13)]}
(root/'research/board-ai.json').write_text(json.dumps(j,indent=2)+'\n');print(json.dumps({k:j[k] for k in ['combatSelectionRanks','characterCombatBytes','characterBoardBytes']}))
