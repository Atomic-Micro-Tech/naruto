#!/usr/bin/env python3
"""Extract binary-backed card/deck/scenario rules, without interpreting unknown fields.
Run from repository root: python3 research/extract_full_rules.py
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path


def extract(exe_path, output, data_path=None):
    exe = exe_path.read_bytes()
    def ram(address, length):
        offset = address - 0x80010000 + 0x800
        assert 0 <= offset <= len(exe) - length
        return exe[offset:offset + length]

    cards = []
    for card_id in range(53):
        kind, flag, value, message = struct.unpack('<IIiI', ram(0x80055cec + card_id * 16, 16))
        if kind == 0xffffffff:
            break
        cards.append(dict(id=card_id, type=kind, useFlag=flag, value=value,
                          messageId=message, immediate=flag == 1))
    assert len(cards) == 52
    decks = []
    for deck_id in range(18):
        pools = []
        for pool_id in range(2):
            raw = list(ram(0x8005603c + deck_id * 64 + pool_id * 0x480, 64))
            ids = raw[:raw.index(255)] if 255 in raw else raw
            assert all(i < len(cards) for i in ids)
            pools.append(ids)
        decks.append(dict(id=deck_id, pools=pools,
                          zeroFilledReserved=all(i == 0 for pool in pools for i in pool)))

    scenarios = []
    for scenario_id in range(48):
        b = ram(0x80057798 + scenario_id * 84, 84)
        if not any(b):
            continue
        initial, target, bonus = struct.unpack_from('<III', b, 4)
        flags, parameters, records = 0, [0] * 16, []
        for slot in range(4):
            mask, value = struct.unpack_from('<Hh', b, 18 + slot * 4)
            records.append(dict(mask=mask, value=value))
            flags |= mask
            for bit in range(16):
                if mask & (1 << bit):
                    parameters[bit] = value
        players = []
        for player_id in range(4):
            rec = b[46 + player_id * 5:51 + player_id * 5]
            if rec[0] >= 13:
                break
            players.append(dict(characterId=rec[0], techniqueIds=list(rec[1:]),
                                unknownControlBytes=list(b[66 + player_id * 4:70 + player_id * 4])))
        scenarios.append(dict(id=scenario_id, mapId=b[0], stageSetting=b[1], deckId=b[2],
                              initialChakra=initial, targetChakra=target, baseBonus=bonus,
                              initialSkillPoints=b[16], unknownSetting17=b[17],
                              modeFlags=flags, ruleRecords=records, ruleParameters=parameters,
                              roulette=list(b[34:46]), players=players,
                              reservedNoRoster=not players, rawHex=b.hex()))
    # Three contiguous 0x84-byte campaign records are directly indexed by12eac.
    campaigns = []
    for campaign_id in range(3):
        entries = []
        for slot in range(11):
            b = ram(0x80058758 + campaign_id * 0x84 + slot * 12, 12)
            if b[0] == 255:
                break
            entries.append(dict(stage=slot, scenarioId=b[0], unknownBytes=list(b[1:])))
        campaigns.append(dict(id=campaign_id, entries=entries))
    result = dict(schemaVersion=1, source=dict(file=str(exe_path), sha256=hashlib.sha256(exe).hexdigest()),
                  addresses=dict(cards='0x80055cec', decks='0x8005603c',
                                 boardNinjutsuCosts='0x80057774', scenarios='0x80057798'),
                  cards=cards, decks=decks, boardNinjutsuCosts=list(ram(0x80057774,14)),
                  scenarios=scenarios, campaigns=campaigns)
    data_path = data_path or exe_path.with_name('DATA.BIN')
    data = data_path.read_bytes()
    board_lba, board_size = struct.unpack_from('<II', data, 0x44 + 8)
    board_offset = (board_lba - 212) * 2048
    board = data[board_offset:board_offset + board_size]
    result['combat'] = dict(
        sourceResourceId=1, sourceOffset=board_offset,
        rouletteMaskAddress='0x800af98c', rouletteRangeAddress='0x800afbfc',
        rouletteMasks=[list(struct.unpack_from('<12i', board, 0x800af98c - 0x800ad450 + i * 48)) for i in range(13)],
        rouletteRanges=list(struct.unpack_from('<2i', board, 0x800afbfc - 0x800ad450)),
        aiSkillAddress='0x80064d01',
        aiSkillByCharacter=[ram(0x80064d01 + i * 2, 1)[0] for i in range(13)])
    assert result['combat']['rouletteRanges'] == [3,4]
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + '\n')
    print(f'Extracted {len(cards)} cards, {len(decks)} deck slots, '
          f'{sum(not s["reservedNoRoster"] for s in scenarios)} populated scenarios / {len(scenarios)} slots')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exe', type=Path, default=Path('extracted/disc/SLPS_035.53'))
    parser.add_argument('--out', type=Path, default=Path('research/full-rules.json'))
    parser.add_argument('--data', type=Path, help='DATA.BIN (defaults to EXE sibling)')
    args = parser.parse_args()
    extract(args.exe, args.out, args.data)
