#!/usr/bin/env python3
"""Decode verified streamed XA clips from SLPS-03553, without an emulator.

XASECT records = sector offset, byte length in2336-byte units.
EXE DAT_80064d58 bytes = audio-sector counts per game clip ID (not volume).
The thirteen zero-length placeholder slots contain invalid ADPCM and are skipped.
PCM retains native sample rate. Console interpolation, gain and mixing are separate.
"""
import argparse, array, ctypes, hashlib, json, os, struct, subprocess, sys, tempfile, wave
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SYNC=b'\0'+b'\xff'*10+b'\0'
COEFFICIENTS=((0,0),(60,0),(115,-52),(98,-55))


def coding_info(value):
    if value&0xaa:raise ValueError(f'Reserved XA coding bits {value:#x}')
    if value&0x40:raise ValueError('XA emphasis requires a filter; not silently supported')
    return dict(channels=2 if value&1 else 1,rate=18900 if value&4 else 37800,bits=8 if value&16 else 4)


def sector_payload(raw):
    if len(raw)!=2352 or raw[:12]!=SYNC or raw[15]!=2:raise ValueError('Not a raw MODE2 sector')
    if raw[16:20]!=raw[20:24]:raise ValueError('XA subheader copies disagree')
    if raw[18]&0x24!=0x24:raise ValueError('Not XA Form2 audio')
    coding_info(raw[19])
    return raw[24:24+2304]


def validate_groups(payload,bits):
    if len(payload)!=2304:raise ValueError('Expected18 sound groups')
    for group in range(18):
        h=payload[group*128:group*128+16]
        if h[:4]!=h[4:8] or h[8:12]!=h[12:16]:raise ValueError(f'Header copies disagree at group{group}')
        for unit,value in enumerate(h[4:4+32//bits]):
            if value>>4>3:raise ValueError(f'Reserved predictor{value>>4} at group{group},unit{unit}')


def decode_reference(payload,channels=1,bits=4,history=None,arithmetic='hardware'):
    """Slow independent Python decoder used for regression fixtures."""
    validate_groups(payload,bits)
    history=[0,0,0,0] if history is None else history
    units=32//bits;output=[0]*(18*28*units)
    for group in range(18):
        p=group*128
        for unit in range(units):
            header=payload[p+4+unit];shift=header&15
            if shift>12:shift=9
            a,b=COEFFICIENTS[header>>4];ch=unit%2 if channels==2 else 0;old,older=history[ch*2:ch*2+2]
            for j in range(28):
                if bits==4:
                    value=(payload[p+16+j*4+unit//2]>>((unit%2)*4))&15
                    if value>=8:value-=16
                    value=(value<<12)>>shift
                else:
                    value=payload[p+16+j*4+unit]
                    if value>=128:value-=256
                    value=(value<<8)>>shift
                value+=((old*a+older*b+32)>>6) if arithmetic=='ffmpeg' else ((old*a)>>6)+((older*b)>>6)
                value=max(-32768,min(32767,value));older,old=old,value
                index=group*28*units+(unit//2*56+j*2+ch if channels==2 else unit*28+j)
                output[index]=value
            history[ch*2:ch*2+2]=old,older
    return array.array('h',output),history


class Decoder:
    def __init__(self):
        self.temp=tempfile.TemporaryDirectory(prefix='naruto-xa-')
        library=Path(self.temp.name)/('xa.dylib' if sys.platform=='darwin' else 'xa.so')
        subprocess.run(['cc','-O2','-shared','-fPIC',str(ROOT/'scripts/xa_decode.c'),'-o',str(library)],check=True,capture_output=True)
        self.lib=ctypes.CDLL(str(library));self.fn=self.lib.decode_xa
        self.fn.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_int,ctypes.c_int,ctypes.c_void_p,ctypes.c_void_p,ctypes.c_int];self.fn.restype=ctypes.c_int
    def decode(self,payload,info,history,arithmetic='hardware'):
        validate_groups(payload,info['bits'])
        hist=(ctypes.c_int32*4)(*history);out=(ctypes.c_int16*4032)()
        count=self.fn(payload,len(payload),info['channels']==2,info['bits'],hist,out,arithmetic=='ffmpeg')
        if count<0:raise ValueError(f'Native decoder rejected sector ({count})')
        pcm=array.array('h');pcm.frombytes(bytes(out)[:count*2])
        if sys.byteorder!='little':pcm.byteswap()
        history[:]=list(hist)
        return pcm


def extract(disc,disc_dir,out):
    out.mkdir(parents=True,exist_ok=True);(out/'wav').mkdir(exist_ok=True)
    manifest=json.loads((ROOT/'extracted/manifest.json').read_text())
    data2=next(x for x in manifest['files'] if x['name']=='DATA2.BIN');base=data2['lba']
    index=(disc_dir/'XASECT.BIN').read_bytes();count=struct.unpack_from('<I',index)[0]
    if len(index)!=4+count*8:raise ValueError('Unexpected XASECT extent')
    entries=[struct.unpack_from('<II',index,4+i*8) for i in range(count)]
    if any(size%2336 for _,size in entries):raise ValueError('Invalid Form2 size')
    if any(entries[i][0]+entries[i][1]//2336!=entries[i+1][0] for i in range(count-1)):raise ValueError('Group extents not contiguous')
    if entries[-1][0]+entries[-1][1]//2336!=data2['size']//2048:raise ValueError('XA index does not cover DATA2')
    exe=(disc_dir/'SLPS_035.53').read_bytes();start=0x80064d58-0x80010000+0x800;end=0x800652b0-0x80010000+0x800
    lengths=exe[start:end];group_table=exe[0x80064d1c-0x80010000+0x800:start]
    decoder=Decoder();clips=[];skipped=[];total_audio=0
    with disc.open('rb') as f:
        for group,(relative,size) in enumerate(entries):
            tracks={};f.seek((base+relative)*2352)
            for n in range(size//2336):
                raw=f.read(2352);lba=base+relative+n
                if raw[15]!=2:raise ValueError(f'MODE2 missing at LBA{lba}')
                if not raw[18]&4:continue
                total_audio+=1
                if raw[16:20]!=raw[20:24]:raise ValueError(f'Subheader mismatch at LBA{lba}')
                channel=raw[17];clip_id=group*16+channel
                if channel>15 or clip_id>=len(lengths):raise ValueError(f'Unexpected channel at{lba}')
                key=(raw[16],channel)
                if key not in tracks:
                    info=coding_info(raw[19]);declared=lengths[clip_id]
                    name=f'xa_{clip_id:04d}_g{group:02d}_c{channel:02d}'
                    t=dict(id=clip_id,group=group,file=raw[16],channel=channel,coding=raw[19],**info,declared_audio_sectors=declared,sector_lbas=[],history=[0,0,0,0],eof=False,samples=0,hash=hashlib.sha256(),sum_sq=0,peak=0,name=name)
                    if declared:
                        t['writer']=wave.open(str(out/'wav'/f'{name}.wav'),'wb');t['writer'].setnchannels(info['channels']);t['writer'].setsampwidth(2);t['writer'].setframerate(info['rate'])
                    tracks[key]=t
                t=tracks[key]
                if t['eof']:raise ValueError(f'Audio after EOF for{clip_id}')
                if raw[19]!=t['coding']:raise ValueError(f'Coding changed inside clip{clip_id}')
                t['sector_lbas'].append(lba);t['hash'].update(raw)
                if t['declared_audio_sectors']:
                    payload=sector_payload(raw);pcm=decoder.decode(payload,t,t['history'])
                    t['writer'].writeframesraw(pcm.tobytes());t['samples']+=len(pcm)//t['channels'];t['peak']=max(t['peak'],max(map(abs,pcm)))
                t['eof']=bool(raw[18]&128)
            for t in tracks.values():
                if not t['eof']:raise ValueError(f'Missing EOF for clip{t["id"]}')
                t['raw_sector_sha256']=t.pop('hash').hexdigest();t.pop('history');t.pop('sum_sq');name=t.pop('name')
                if t['declared_audio_sectors']==0:
                    t['reason']='Declared length0 in EXE; dummy channel placeholder, not playable audio';skipped.append(t);continue
                t.pop('writer').close()
                if len(t['sector_lbas'])!=t['declared_audio_sectors']:raise ValueError(f'Length table mismatch for{t["id"]}')
                t['duration_seconds']=t['samples']/t['rate'];t['wav']=f'wav/{name}.wav';t['wav_sha256']=hashlib.sha256((out/t['wav']).read_bytes()).hexdigest();clips.append(t)
            print(f'XA group{group:02}: {sum(bool(t["declared_audio_sectors"]) for t in tracks.values())} clips',flush=True)
    expected_ids={i for i,n in enumerate(lengths) if n}
    if {t['id'] for t in clips}!=expected_ids:raise ValueError('Nonzero EXE clip table does not match all exported IDs')
    result=dict(disc=disc.name,data2_lba=base,index_groups=count,total_audio_sectors=total_audio,clip_count=len(clips),skipped_count=len(skipped),native_sample_rates=sorted(set(c['rate'] for c in clips)),arithmetic='separately truncated predictor products; console resampling/mix not applied',lookup=dict(group_table_address='0x80064d1c',group_table=list(group_table),length_table_address='0x80064d58',clip_id_formula='group*16+channel',game_lookup_formula='group_table[(g&255)+(kind&255)]*16+(slot&255)-1'),clips=sorted(clips,key=lambda t:t['id']),skipped=skipped)
    (out/'manifest.json').write_text(json.dumps(result,indent=2)+'\n');return result


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--disc',type=Path,default=next(ROOT.glob('*.bin'),None));p.add_argument('--disc-dir',type=Path,default=ROOT/'extracted/disc');p.add_argument('--output',type=Path,default=ROOT/'extracted/xa');a=p.parse_args()
    if a.disc is None:p.error('Supply --disc image.bin')
    r=extract(a.disc,a.disc_dir,a.output);print(f"Exported{r['clip_count']} clips; skipped{r['skipped_count']} zero-length placeholders")
if __name__=='__main__':main()
