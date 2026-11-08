import sys
import tempfile
import unittest
import io
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from gameplay_asset_library import digest, index_records, load, persist, reuse_or_copy


def png_bytes(color):
    buffer = io.BytesIO()
    Image.new('RGBA', (2, 2), color).save(buffer, format='PNG')
    return buffer.getvalue()


class AssetReuseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'library'
        self.root.mkdir()
        self.source = Path(self.temp.name) / 'source.png'
        self.original = png_bytes('red')
        self.source.write_bytes(self.original)
        (self.root / 'shared.png').write_bytes(self.source.read_bytes())
        records = {'shared.png': dict(path='shared.png', source='original.png',
                   bytes=self.source.stat().st_size, sha256=digest(self.source.read_bytes()),
                   resourceIds=[38], arenaIds=[1])}
        persist(self.root, index_records(records, 'test-edition', {}))

    def test_second_arena_reuses_path_without_copy_or_touch(self):
        before = (self.root / 'shared.png').stat().st_mtime_ns
        result = reuse_or_copy(self.root, self.source, 'arena2/copy.png', arena_id=2, resource_ids=[38])
        self.assertEqual(result['path'], 'shared.png')
        self.assertTrue(result['reused'])
        self.assertFalse((self.root / 'arena2').exists())
        self.assertEqual((self.root / 'shared.png').stat().st_mtime_ns, before)
        self.assertEqual(load(self.root / 'resource-library.json')['files']['shared.png']['arenaIds'], [1, 2])

    def test_same_resource_different_palette_is_new_asset(self):
        self.source.write_bytes(png_bytes('blue'))
        result = reuse_or_copy(self.root, self.source, 'arena2/variant.png', arena_id=2, resource_ids=[38])
        self.assertFalse(result['reused'])
        self.assertEqual((self.root / result['path']).read_bytes(), png_bytes('blue'))
        registry = load(self.root / 'resource-library.json')
        self.assertEqual(registry['assetCount'], 2)
        self.assertEqual(len(registry['resources']['38']['paths']), 2)

    def test_corrupt_shared_file_is_rejected(self):
        (self.root / 'shared.png').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'shared asset changed'):
            reuse_or_copy(self.root, self.source, 'arena2/new.png', arena_id=2)
        self.assertFalse((self.root / 'arena2').exists())

    def test_conflicting_destination_is_not_overwritten(self):
        self.source.write_bytes(png_bytes('blue'))
        with self.assertRaisesRegex(ValueError, 'Conflicting destination'):
            reuse_or_copy(self.root, self.source, 'shared.png', arena_id=2)
        self.assertEqual((self.root / 'shared.png').read_bytes(), self.original)

    def test_json_relative_references_are_not_content_deduplicated(self):
        self.source.write_text('{"file":"local.png"}')
        first = reuse_or_copy(self.root, self.source, 'arena1/meta.json', arena_id=1)
        second = reuse_or_copy(self.root, self.source, 'arena2/meta.json', arena_id=2)
        self.assertNotEqual(first['path'], second['path'])
        self.assertFalse(second['reused'])

    def test_destination_cannot_escape_library(self):
        with self.assertRaisesRegex(ValueError, 'outside library'):
            reuse_or_copy(self.root, self.source, '../outside.png', arena_id=2)

    def test_non_wav_audio_requires_conversion(self):
        seq = Path(self.temp.name) / 'music.seq'
        seq.write_bytes(b'pQES')
        with self.assertRaisesRegex(ValueError, 'Convert audio to WAV'):
            reuse_or_copy(self.root, seq, 'audio/music.wav', arena_id=2)
        with self.assertRaisesRegex(ValueError, 'WAV files only'):
            reuse_or_copy(self.root, self.source, 'audio/metadata.json', arena_id=2)

    def test_non_png_image_requires_conversion(self):
        tim = Path(self.temp.name) / 'texture.tim'
        tim.write_bytes(b'not a PNG')
        with self.assertRaisesRegex(ValueError, 'Convert images to PNG'):
            reuse_or_copy(self.root, tim, 'texture/converted.png', arena_id=2)

    def test_renamed_image_is_not_png_conversion(self):
        Image.new('RGB', (2, 2), 'red').save(self.source, format='BMP')
        with self.assertRaisesRegex(ValueError, 'actual PNG content'):
            reuse_or_copy(self.root, self.source, 'image/new.png', arena_id=2)


if __name__ == '__main__':
    unittest.main()
