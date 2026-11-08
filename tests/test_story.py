import sys,json,struct,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from extract_story import parse_scene,parse_vram
class Story(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  m=json.loads((ROOT/'extracted/manifest.json').read_text());data=(ROOT/'extracted/disc/DATA.BIN').read_bytes()
  cls.blobs={rid:data[m['resources'][rid]['offset']:m['resources'][rid]['offset']+m['resources'][rid]['size']] for rid in (175,300,308)}
 def test_first_original_scene_structure(self):
  s=parse_scene(self.blobs[175]);t=s['tables'];self.assertEqual(t['sequence'],[0,1,2,3]);self.assertEqual([t['clips'][i][0] for i in t['sequence']],[126,386,343,1854]);self.assertEqual(len(t['sprites']),69)
 def test_reject_bad_magic_and_offset(self):
  with self.assertRaises(ValueError):parse_scene(b'X'+self.blobs[175][1:])
  b=bytearray(self.blobs[175]);struct.pack_into('<I',b,16,len(b)+1)
  with self.assertRaises(ValueError):parse_scene(b)
 def test_reject_layer_reference_corruption(self):
  b=bytearray(self.blobs[175]);o=struct.unpack_from('<I',b,16+7*4)[0];struct.pack_into('<h',b,o+4,32767)
  with self.assertRaises(ValueError):parse_scene(b)
 def test_vram_signed_upload_coordinates(self):
  _,p,u=parse_vram(self.blobs[308]);self.assertEqual(u[4]['xWords'],320);self.assertEqual(u[4]['widthWords'],128)
 def test_palette_short_but_valid_eight_bit_samples(self):
  _,p,u=parse_vram(self.blobs[300]);self.assertEqual(len(p),59);self.assertEqual(len(p[27]),16);self.assertEqual(len(u),69)
if __name__=='__main__':unittest.main()
