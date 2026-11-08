#!/usr/bin/env python3
"""Extract Party presets/loadouts from the local EXE; no inferred scenario defaults.

Evidence: MENU 800b944c/800b99a4 and PARTY_RULE_HELPERS 80012780/80012c70.
Run from the repository root: python3 scripts/extract_party_rules.py
"""
from pathlib import Path
import hashlib
import json
import struct

ROOT = Path(__file__).resolve().parents[1]


def extract():
    exe = (ROOT / 'extracted/disc/SLPS_035.53').read_bytes()

    def read(address, size):
        offset = address - 0x80010000 + 0x800
        assert 0 <= offset <= len(exe) - size
        return exe[offset:offset + size]

    presets = []
    for index in range(18):
        address = 0x80064918 + index * 48
        raw = read(address, 48)
        initial, target, bonus = struct.unpack_from('<III', raw, 4)
        records = [dict(zip(('mask', 'storedValue'), struct.unpack_from('<Hh', raw, 18 + i * 4)))
                   for i in range(4)]
        flags = 0
        for record in records:
            flags |= record['mask']
        presets.append(dict(presetId=index, sourceAddress=hex(address),
            selectableInPartyMenu=index < 9, mapId=raw[0], musicBank=raw[1], deckId=raw[2],
            initialChakra=initial, defaultTargetChakra=target, baseBonus=bonus,
            initialSkillPoints=raw[16], skillAwardPerBonus=raw[17],
            modeFlags=flags, ruleRecords=records, roulette=list(raw[34:46]), rawHex=raw.hex()))

    unlock_chars = read(0x8006d6a0, 5)
    unlock_jutsu = read(0x8006d6a8, 5)
    gates = [dict(characterId=character, jutsuId=jutsu, unlockFlag=87 + index)
             for index, (character, jutsu) in enumerate(zip(unlock_chars, unlock_jutsu))]
    loadouts = []
    for character in range(13):
        raw = list(read(0x800648e4 + character * 4, 4))
        fresh = raw.copy()
        for gate in gates:
            if gate['characterId'] == character and gate['jutsuId'] in fresh:
                fresh[fresh.index(gate['jutsuId'])] = 14
        loadouts.append(dict(characterId=character, rawJutsuIds=raw,
            jutsuIdsWithoutUnlockFlags=fresh))

    result = dict(schemaVersion=1,
        source=dict(file='extracted/disc/SLPS_035.53', sha256=hashlib.sha256(exe).hexdigest()),
        evidence=dict(presetLoader='80012780', playerInitializer='80012c70',
            presetTable='0x80064918', presetStride=48, partyMenu='MENU 800b944c/800b99a4',
            loadoutTable='0x800648e4', unlockCharacters='0x8006d6a0', unlockJutsu='0x8006d6a8'),
        presets=presets, defaultRuleParameters=list(read(0x80064c78, 16)),
        partyRuleParameterRequired=list(struct.unpack('<4I', read(0x80010000, 16))),
        boardJutsuLoadouts=loadouts, jutsuUnlockGates=gates,
        notes=[
            'Only preset slots 0..8 are exposed by the ordinary Party board selector.',
            '80012780 loads rule parameters from 80064c78, not the storedValue fields of presets.',
            '14 is the empty board-jutsu sentinel. ID6 is separately rejected by BOARD eligibility.',
            'Unlock-free loadouts do not mean every character is selectable on a fresh save.',
            'This is static executable evidence, not an original-console input trace.'
        ])
    (ROOT / 'research/party-rules.json').write_text(json.dumps(result, indent=2) + '\n')
    print('Extracted 18 presets (9 Party selections), 13 loadouts and 5 jutsu unlock gates.')


if __name__ == '__main__':
    extract()
