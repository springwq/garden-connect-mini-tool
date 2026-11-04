"""Build a deterministic, offline mini-tool package using standard libraries only."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib, json, re, shutil, subprocess, zipfile
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src'
DIST = ROOT / 'dist' / '0.8.0'
class Resources(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        assert not any(k.startswith('on') for k in attrs), 'Inline event handler'
        if tag == 'script':
            assert attrs.get('src') and attrs.get('type') != 'module', 'Scripts must be external/classic'
        assert tag not in ('iframe', 'object', 'base'), tag
        for key in ('src', 'href'):
            if key in attrs:
                path = attrs[key]
                assert path.startswith('./') and '..' not in Path(path).parts, path
                assert (SOURCE / path).is_file(), path
Resources().feed((SOURCE / 'index.html').read_text())
for script in ('app.js', 'art.js', 'connect.js', 'sound.js', 'ui.js', 'rewards.js'):
    subprocess.run(['node', '--check', str(SOURCE / script)], check=True)
code = '\n'.join((SOURCE / script).read_text() for script in ('app.js', 'art.js', 'connect.js', 'sound.js', 'ui.js', 'rewards.js'))
for pattern in [r'\bfetch\s*\(', r'XMLHttpRequest', r'\beval\s*\(', r'new\s+Function', r'\bWebAssembly\b', r'new\s+(?:Worker|SharedWorker|WebSocket)', r'\bimport\s', r'\bexport\s']:
    assert not re.search(pattern, code), pattern
# Inspect actual runtime: DOM and Canvas 2D only. No game engine, Worker,
# OffscreenCanvas, WASM, or dynamic imports. Manifest does not grant capability.
DIST.mkdir(parents=True, exist_ok=True)
for name in ('index.html', 'style.css', 'art.js', 'app.js', 'connect.js', 'sound.js', 'ui.js', 'rewards.js', 'assets/toys-v6.webp', 'assets/toys-v7-extra.webp', 'assets/world-v6.jpg'):
    (DIST / name).parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SOURCE / name, DIST / name)
(DIST / 'mini_tool.json').write_text('{"is_high_consumption_scene":false}\n')
files = ('index.html', 'style.css', 'art.js', 'app.js', 'connect.js', 'sound.js', 'ui.js', 'rewards.js', 'assets/toys-v6.webp', 'assets/toys-v7-extra.webp', 'assets/world-v6.jpg', 'mini_tool.json')
assert set(str(p.relative_to(DIST)) for p in DIST.rglob('*') if p.is_file()) == set(files), 'Unexpected stale dist files'
out = ROOT / 'artifacts' / 'kaixin-lianliankan-0.8.0.zip'
out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name in files:
        entry = zipfile.ZipInfo(name, (2026, 11, 4, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, (DIST / name).read_bytes())
allowed = {'.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.json'}
assert all(Path(name).suffix.lower() in allowed for name in files), 'Unsupported package file type'
assert out.stat().st_size <= 10 * 1024 * 1024
report = {'zip': str(out), 'bytes': out.stat().st_size, 'sha256': hashlib.sha256(out.read_bytes()).hexdigest(), 'files': list(files), 'staticChecks': 'passed', 'highConsumption': False, 'platformSimulator': 'not tested', 'android': 'not tested', 'ios': 'not tested'}
(ROOT / 'artifacts' / 'build-report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report, indent=2))
