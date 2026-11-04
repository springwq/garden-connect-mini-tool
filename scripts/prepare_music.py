"""Create a quiet loop from a locally generated WAV without external media.

The tail is crossfaded into the head, and the loop starts after the overlapped
head. This makes the final sample meet the next iteration without a hard cut.
"""
import argparse
import json
from pathlib import Path
import numpy as np
import soundfile as sf
p = argparse.ArgumentParser()
p.add_argument('input', type=Path)
p.add_argument('output', type=Path)
a = p.parse_args()
wave, rate = sf.read(a.input, dtype='float32', always_2d=True)
assert np.isfinite(wave).all() and len(wave) > rate * 10
# Remove only the first quarter second; retain the generated composition.
wave = wave[int(rate * .25):]
n = int(rate * 1.5)
t = np.linspace(0, 1, n, dtype=np.float32)[:, None]
bridge = wave[-n:] * np.cos(t * np.pi / 2) + wave[:n] * np.sin(t * np.pi / 2)
loop = np.concatenate([wave[n:-n], bridge])
peak = float(np.max(np.abs(loop)))
loop *= .75 / max(peak, 1e-9)
sf.write(a.output, loop, rate, subtype='PCM_16')
report = {'sample_rate':rate,'channels':loop.shape[1],'duration':len(loop)/rate,
          'peak':float(np.max(np.abs(loop))),'rms':float(np.sqrt(np.mean(loop**2))),
          'seam_jump':float(np.max(np.abs(loop[-1]-loop[0]))),
          'crossfade_seconds':1.5,'original':str(a.input)}
a.output.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
