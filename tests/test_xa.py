import importlib.util, random, sys, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('extract_xa',ROOT/'scripts/extract_xa.py');xa=importlib.util.module_from_spec(spec);spec.loader.exec_module(xa)

def payload(pattern=b'\x21\x43\x65\x87',header=12):
    return (bytes([header])*16+pattern*28)*18

class XA(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.decoder=xa.Decoder()
    def test_mono_unit_order_and_signed_nibbles(self):
        pcm,h=xa.decode_reference(payload())
        self.assertEqual(len(pcm),4032)
        for n,value in enumerate([1,2,3,4,5,6,7,-8]):self.assertEqual(list(pcm[n*28:(n+1)*28]),[value]*28)
    def test_stereo_interleave_and_independent_history(self):
        pcm,h=xa.decode_reference(payload(),channels=2)
        self.assertEqual(list(pcm[:56]),[1,2]*28)
        self.assertEqual(list(pcm[56:112]),[3,4]*28)
    def test_eight_bit_samples(self):
        pcm,h=xa.decode_reference(payload(b'\x01\xff\x7f\x80',8),bits=8,channels=2)
        self.assertEqual(len(pcm),2016);self.assertEqual(list(pcm[:56]),[1,-1]*28)
        self.assertEqual(list(pcm[56:112]),[127,-128]*28)
    def test_reserved_coding_and_predictor_rejected(self):
        for coding in [2,8,32,128,64]:
            with self.assertRaises(ValueError):xa.coding_info(coding)
        with self.assertRaises(ValueError):xa.decode_reference(payload(header=0x40))
        bad=bytearray(payload());bad[0]=1
        with self.assertRaises(ValueError):xa.decode_reference(bytes(bad))
    def test_rate_and_channel_flags(self):
        self.assertEqual(xa.coding_info(0),dict(channels=1,rate=37800,bits=4))
        self.assertEqual(xa.coding_info(0x15),dict(channels=2,rate=18900,bits=8))
    def test_reserved_shift_hardware_behavior(self):
        a,_=xa.decode_reference(payload(header=15));b,_=xa.decode_reference(payload(header=9));self.assertEqual(a,b)
    def test_native_matches_independent_reference_and_continuity(self):
        rng=random.Random(353)
        for bits in [4,8]:
            for channels in [1,2]:
                for arithmetic in ['hardware','ffmpeg']:
                    history=[0]*4;refhistory=[0]*4
                    for _ in range(3):
                        groups=[]
                        for g in range(18):
                            h=[rng.randrange(4)*16+rng.randrange(13) for _ in range(8)]
                            groups.append(bytes(h[:4]+h+h[4:])+rng.randbytes(112))
                        p=b''.join(groups);expected,refhistory=xa.decode_reference(p,channels,bits,refhistory,arithmetic)
                        result=self.decoder.decode(p,dict(channels=channels,bits=bits),history,arithmetic)
                        self.assertEqual(result,expected);self.assertEqual(history,refhistory)
    def test_sector_framing(self):
        raw=xa.SYNC+bytes([0,0,0,2])+bytes([1,3,0x64,0])*2+payload()+bytes(24)
        self.assertEqual(xa.sector_payload(raw),payload())
        with self.assertRaises(ValueError):xa.sector_payload(raw[:-1])

if __name__=='__main__':unittest.main()
