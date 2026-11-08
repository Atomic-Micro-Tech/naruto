#!/usr/bin/env python3
"""Extract verified board records and scenario configuration from this disc's files.
Run: python3 research/extract_gameplay.py --disc-dir extracted/disc
The input directory must contain DATA.BIN and SLPS_035.53.
"""
from pathlib import Path
import argparse, json, struct


def extract(disc_dir, out_dir):
    data = (disc_dir / 'DATA.BIN').read_bytes()
    exe = (disc_dir / 'SLPS_035.53').read_bytes()
    def ram(address, size):
        offset = address - 0x80010000 + 0x800
        return exe[offset:offset + size]
    def resource(index):
        lba, size = struct.unpack_from('<II', data, 0x44 + index * 8)
        offset = (lba - 212) * 2048
        assert 0 <= offset <= len(data) - size
        return data[offset:offset + size], offset, size
    maps = []
    types = {0: 'source', 1: 'crystal', 2: 'chance', 3: 'junction', 4: 'estate', 5: 'barrier'}
    for map_id in range(18):
        blob, offset, size = resource(0x276 + map_id)
        count = blob[0]
        assert size == 1 + count * 30, (map_id, size, count)
        tiles = []
        for i in range(count):
            b = blob[1 + i * 30:31 + i * 30]
            values = struct.unpack_from('<9H', b, 7)
            x, y = struct.unpack_from('<hh', b, 25)
            links = [n for n in b[1:5] if n != 255]
            assert all(n < count for n in links)
            tiles.append(dict(id=i, type=types.get(b[0], 'unknown'), typeCode=b[0],
                              neighbors=links, neighborSlots=list(b[1:5]), x=x, y=y, buyCost=values[0],
                              rents=list(values[1:6]), upgradeCost=values[6],
                              unknownValues=list(values[7:]), unknownBytes=list(b[5:7]),
                              eventId=b[29]))
        maps.append(dict(id=map_id, resourceId=0x276 + map_id, backgroundResourceId=0x158 + map_id,
                         dataOffset=offset, byteLength=size, tiles=tiles))
    scenarios = []
    # First campaign has ten valid 12-byte entries, then a sentinel.
    for stage in range(11):
        campaign = ram(0x80058758 + stage * 12, 12)
        if campaign[0] == 255:
            break
        scenario_id = campaign[0]
        b = ram(0x80057798 + scenario_id * 84, 84)
        initial, target, bonus = struct.unpack_from('<III', b, 4)
        players = []
        for i in range(4):
            record = list(b[46 + i*5:51 + i*5])
            if record[0] < 13:
                players.append(dict(characterId=record[0], techniqueIds=record[1:]))
        scenarios.append(dict(campaign=0, stage=stage, scenarioId=scenario_id, mapId=b[0],
                              unknownByte1=b[1], deckId=b[2], initialChakra=initial,
                              targetChakra=target, baseBonus=bonus, initialSkillPoints=b[16],
                              roulette=list(b[34:46]), players=players,
                              unknownCampaignBytes=list(campaign[1:])))
    techniques = []
    for character_id in range(13):
        attacks, defenses = [], []
        for slot in range(10):
            b = ram(0x8005693c + character_id * 0x118 + slot * 28, 28)
            technique_id, animation_id = struct.unpack_from('<ii', b)
            if technique_id < 0:
                continue
            cost, alternate_cost, power, alternate_power, flags, unknown = struct.unpack_from('<6h', b, 8)
            entry = dict(id=technique_id, tableSlot=slot, animationId=animation_id,
                         cost=cost, power=power, alternateCost=alternate_cost, alternatePower=alternate_power,
                         flags=flags, specialty=bool(flags & 4),
                         countersSpecialty=bool(flags & 2 and flags & 4 and flags & 8),
                         countersNonSpecialty=bool(flags & 2 and flags & 4 and not flags & 8),
                         unknownHalfword=unknown, unknownTail=list(struct.unpack_from('<4h', b, 20)))
            if flags & 1:
                attacks.append(entry)
            if flags & 2:
                defenses.append(entry)
        techniques.append(dict(characterId=character_id, attacks=attacks, defenses=defenses))
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / 'techniques.json').write_text(json.dumps(techniques, indent=2) + '\n')
    (out_dir / 'maps.json').write_text(json.dumps(maps, indent=2) + '\n')
    (out_dir / 'scenarios.json').write_text(json.dumps(scenarios, indent=2) + '\n')
    print(f'Wrote {len(maps)} maps / {sum(len(m["tiles"]) for m in maps)} tiles, {len(scenarios)} campaign stages')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--disc-dir', type=Path, default=Path('extracted/disc'))
    parser.add_argument('--out-dir', type=Path, default=Path('research'))
    args = parser.parse_args()
    extract(args.disc_dir, args.out_dir)
