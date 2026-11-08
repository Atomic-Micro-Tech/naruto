"""Guard against decoding arbitrary bytes and the game's split VH/VB quirk."""
import importlib.util
from pathlib import Path
import json
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('extract_audio',ROOT/'scripts/extract_audio.py')
audio=importlib.util.module_from_spec(spec);spec.loader.exec_module(audio)

class DecoderTest(unittest.TestCase):
    def test_nibble_order_and_signed_values(self):
        raw=bytes([12,1])+bytes([0x87])*14
        pcm,meta=audio.decode_spu(raw)
        self.assertEqual(list(pcm),[7,-8]*14)
        self.assertEqual(meta['decoded_bytes'],16)

    def test_end_flag_does_not_decode_padding(self):
        raw=bytes([12,1])+bytes([0x12])*14+bytes([0,7])+bytes([0x77])*14
        pcm,meta=audio.decode_spu(raw)
        self.assertEqual(list(pcm),[2,1]*14)
        self.assertEqual(meta['trailing_bytes'],16)

    def test_invalid_frames_rejected_even_after_end(self):
        for raw in (b'\0',bytes([0x50,1])+bytes(14),bytes([0x0f,1])+bytes(14),bytes([0,8])+bytes(14),bytes([0,1])+bytes(14)+bytes([0xff,1])+bytes(14)):
            with self.assertRaises(ValueError):audio.decode_spu(raw)

    def test_loop_points_and_missing_end(self):
        raw=bytes([12,6])+bytes(14)+bytes([12,3])+bytes(14)
        pcm,meta=audio.decode_spu(raw)
        self.assertEqual(len(pcm),56);self.assertEqual(meta['loop_start_sample'],0)
        self.assertTrue(meta['loop_repeat']);self.assertEqual(meta['loop_end_sample'],56)
        with self.assertRaises(ValueError):audio.decode_spu(bytes(16))

    @unittest.skipUnless((ROOT/'extracted/disc/DATA.BIN').exists(),'local disc extraction unavailable')
    def test_noncanonical_bank_split(self):
        data=(ROOT/'extracted/disc/DATA.BIN').read_bytes()
        packages=json.loads((ROOT/'extracted/manifest.json').read_text())['packages']
        package=next(p for p in packages if p['offset']==0x823000)
        info,vh,vb,samples=audio.parse_bank(data,package)
        self.assertEqual(info['prefix_body_bytes_in_header_entry'],1024)
        self.assertEqual(len(vh),3104);self.assertEqual(len(vb),98032)
        self.assertEqual(len(samples),3)
        for _,_,raw in samples:audio.decode_spu(raw)

if __name__=='__main__':unittest.main()
