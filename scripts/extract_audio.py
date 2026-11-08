#!/usr/bin/env python3
"""Extract verified VAB banks and one-shot SPU-ADPCM audition WAVs.

VAB layout: SLPS_035.53.c _SsVabOpenHeadWithMode (0x80054608).
The bank may straddle PK02 entries at a noncanonical VH/VB boundary.
The 44100 Hz export is an audition rate, NOT recovered sequence pitch.
No ADSR, Gaussian interpolation, reverb, sequencing or repeated loops.
Decoder arithmetic checked against SPU::Voice::DecodeBlock in:
https://github.com/stenzek/duckstation/blob/master/src/core/spu.cpp
"""
import argparse
import array
import hashlib
import json
import math
import struct
import sys
import wave
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
COEFFICIENTS=((0,0),(60,0),(115,-52),(98,-55),(122,-60))


def validate_frames(raw):
    if not raw or len(raw)%16:
        raise ValueError('ADPCM length must be a nonzero multiple of 16')
    for off in range(0,len(raw),16):
        predictor,shift,flags=raw[off]>>4,raw[off]&15,raw[off+1]
        if predictor>4 or shift>12 or flags>7:
            raise ValueError(f'Invalid ADPCM frame at {off:#x}: {predictor=}, {shift=}, {flags=}')


def decode_spu(raw):
    """Decode one pass to first end flag; retain sample loop metadata."""
    validate_frames(raw)
    pcm=array.array('h');last=older=0;loop_start=None;loop_end=None;repeat=False;used=0
    for off in range(0,len(raw),16):
        predictor,shift,flags=raw[off]>>4,raw[off]&15,raw[off+1]
        if flags&4:loop_start=len(pcm)
        a,b=COEFFICIENTS[predictor]
        for byte in raw[off+2:off+16]:
            for nibble in (byte&15,byte>>4):
                signed=nibble if nibble<8 else nibble-16
                value=((signed<<12)>>shift)+((last*a)>>6)+((older*b)>>6)
                value=max(-32768,min(32767,value))
                pcm.append(value);older,last=last,value
        used=off+16
        if flags&1:
            loop_end=len(pcm);repeat=bool(flags&2);break
    if loop_end is None:
        raise ValueError('Sample has no end flag within declared size')
    return pcm,dict(loop_start_sample=loop_start,loop_end_sample=loop_end,loop_repeat=repeat,decoded_bytes=used,trailing_bytes=len(raw)-used)


def parse_bank(data,package):
    entries=package['entries']
    if len(entries)<2:raise ValueError('VAB package lacks body entry')
    start=entries[0]['offset'];size=struct.unpack_from('<I',data,start+12)[0]
    version=struct.unpack_from('<I',data,start+4)[0]
    programs,tones,count=struct.unpack_from('<3H',data,start+18)
    if data[start:start+4]!=b'pBAV' or version!=7 or not 0<programs<=128 or not 0<count<256:
        raise ValueError('Unsupported VAB header')
    header_size=0x20+0x800+programs*0x200+0x200
    if header_size>size or start+size>len(data):raise ValueError('VAB exceeds input')
    if entries[1]['offset']!=start+entries[0]['size'] or sum(e['size'] for e in entries[:2])!=size:
        raise ValueError('PK entries disagree with VAB extent')
    lengths=struct.unpack_from('<256H',data,start+header_size-512)
    if lengths[0]!=0 or any(lengths[count+1:]):raise ValueError('Unexpected VAG size-table sentinel/tail')
    lengths=[n*8 for n in lengths[1:count+1]]
    if sum(lengths)+header_size!=size:raise ValueError('VAG lengths do not cover bank')
    vh=data[start:start+header_size];vb=data[start+header_size:start+size]
    samples=[];cursor=0
    for index,length in enumerate(lengths,1):
        raw=vb[cursor:cursor+length];validate_frames(raw)
        samples.append((index,start+header_size+cursor,raw));cursor+=length
    return dict(offset=start,package_offset=package['offset'],version=version,programs=programs,tones=tones,sample_count=count,header_size=header_size,body_size=len(vb),pk_header_size=entries[0]['size'],prefix_body_bytes_in_header_entry=entries[0]['size']-header_size),vh,vb,samples


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--data',type=Path,default=ROOT/'extracted/disc/DATA.BIN')
    ap.add_argument('--manifest',type=Path,default=ROOT/'extracted/manifest.json')
    ap.add_argument('--output',type=Path,default=ROOT/'extracted/audio')
    ap.add_argument('--rate',type=int,default=44100,help='Audition rate; does not recover original note pitch')
    args=ap.parse_args()
    if not 1000<=args.rate<=192000:ap.error('--rate outside 1000..192000')
    data=args.data.read_bytes();manifest=json.loads(args.manifest.read_text());out=args.output
    for folder in ('banks','wav','adpcm'):(out/folder).mkdir(parents=True,exist_ok=True)
    banks=[];unique={};references=0
    for package in manifest['packages']:
        if data[package['entries'][0]['offset']:package['entries'][0]['offset']+4]!=b'pBAV':continue
        bank,vh,vb,samples=parse_bank(data,package);name=f"vab_{bank['package_offset']:08x}"
        bank['vh']=f'banks/{name}.vh';bank['vb']=f'banks/{name}.vb'
        (out/bank['vh']).write_bytes(vh);(out/bank['vb']).write_bytes(vb)
        bank['vh_sha256']=hashlib.sha256(vh).hexdigest();bank['vb_sha256']=hashlib.sha256(vb).hexdigest();bank['samples']=[]
        for index,offset,raw in samples:
            digest=hashlib.sha256(raw).hexdigest();key='spu_'+digest[:16]
            reference=dict(bank=name,package_offset=bank['package_offset'],vag_index=index,data_offset=offset,byte_length=len(raw))
            if digest not in unique:
                pcm,meta=decode_spu(raw)
                path=f'wav/{key}.wav';adpcm=f'adpcm/{key}.adpcm';(out/adpcm).write_bytes(raw)
                if sys.byteorder!='little':pcm.byteswap()
                with wave.open(str(out/path),'wb') as w:
                    w.setnchannels(1);w.setsampwidth(2);w.setframerate(args.rate);w.writeframes(pcm.tobytes())
                if sys.byteorder!='little':pcm.byteswap()
                peak=max(abs(v) for v in pcm);rms=math.sqrt(sum(v*v for v in pcm)/len(pcm))
                unique[digest]=dict(id=key,sha256=digest,wav=path,adpcm=adpcm,sample_rate=args.rate,sample_count=len(pcm),duration_seconds=round(len(pcm)/args.rate,6),peak=peak,rms=round(rms,3),**meta,sources=[])
            unique[digest]['sources'].append(reference);bank['samples'].append(dict(vag_index=index,id=key));references+=1
        banks.append(bank)
    output=dict(source=str(args.data.relative_to(ROOT)) if args.data.is_relative_to(ROOT) else str(args.data),source_sha256=hashlib.sha256(data).hexdigest(),audition_sample_rate=args.rate,
        limitations=['Original playback pitch depends on notes, tone attributes and SPU registers; 44100 Hz is an audition convention.', 'One pass only; loop points retained as metadata, no sequencer/ADSR/reverb or Gaussian resampling.', 'XA audio in DATA2.BIN is not included.'],
        validation=dict(bank_count=len(banks),sample_references=references,unique_samples=len(unique),invalid_banks=0,invalid_frames=0,canonical_boundary_corrections=sum(b['prefix_body_bytes_in_header_entry']!=0 for b in banks)),
        banks=banks,samples=list(unique.values()))
    (out/'manifest.json').write_text(json.dumps(output,indent=2))
    print(json.dumps(output['validation'],indent=2))

if __name__=='__main__':main()
