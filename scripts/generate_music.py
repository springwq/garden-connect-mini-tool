"""Generate the game's original music with local ACE-Step 1.5 weights only.

Run using the Python environment installed under --model-root. No reference
recordings, artist names, remote inference, or user data are used.
"""
import argparse
import json
import os
import sys
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--model-root', required=True, type=Path)
parser.add_argument('--output', required=True, type=Path)
parser.add_argument('--style', choices=['cafe', 'toy'], default='cafe')
args = parser.parse_args()
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
os.environ['PYTORCH_ENABLE_MPS_FALLBACK'] = '1'
sys.path.insert(0, str(args.model_root))
import torch
from acestep.handler import AceStepHandler
from acestep.inference import GenerationParams, GenerationConfig, generate_music

torch.set_num_threads(4)
caption = (
    'Instrumental acoustic background music for a gentle everyday object matching puzzle. '
    'Warm nylon-string guitar, delicate felt piano, soft marimba accents, quiet brushed '
    'percussion and mellow upright bass. Relaxed playful cafe atmosphere, intimate and '
    'handcrafted, simple memorable original melody, steady understated rhythm, clean '
    'recording, restrained dynamics, no vocals, no singing, no spoken words, no dramatic '
    'build-up, no heavy drums. Consistent arrangement suitable for a short repeating loop.'
)
if args.style == 'toy':
    caption = (
        'Instrumental cheerful toy-town puzzle video game background music. '
        'Bright bouncy wooden marimba carries a simple catchy four-bar melody, '
        'short playful pizzicato strings answer it, occasional soft celesta sparkle, '
        'warm staccato bass, tiny shaker and gentle woodblock percussion. '
        'Clean spacious polished game soundtrack, happy sunny curious mood, nimble '
        'light-footed groove, 108 BPM in C major, moderate dynamics. '
        'No vocals, no singing, no speech, no acoustic guitar, no sentimental piano, '
        'no lo-fi noise, no heavy drums, no epic orchestral swell, no intro or ending. '
        'Start directly with the groove, consistent instrumentation for a seamless loop.'
    )
seed = 20261105 if args.style == 'toy' else 20261104
bpm = 108 if args.style == 'toy' else 84
args.output.mkdir(parents=True, exist_ok=True)
params = GenerationParams(caption=caption, lyrics='[Instrumental]', instrumental=True,
                          bpm=bpm, keyscale='C major', timesignature='4', duration=32,
                          inference_steps=8, seed=seed, guidance_scale=1.0,
                          thinking=False, use_cot_metas=False, use_cot_caption=False,
                          use_cot_lyrics=False, use_cot_language=False)
config = GenerationConfig(batch_size=1, use_random_seed=False, seeds=[seed], audio_format='wav')
handler = AceStepHandler()
status, ok = handler.initialize_service(project_root=str(args.model_root),
    config_path='acestep-v15-turbo', device='mps', use_mlx_dit=False,
    offload_to_cpu=True, offload_dit_to_cpu=True, compile_model=False)
print(status, flush=True)
if not ok:
    raise RuntimeError(status)
result = generate_music(handler, None, params, config, save_dir=str(args.output))
if not result.success:
    raise RuntimeError(result.error)
manifest = {
    'model': 'ACE-Step/Ace-Step1.5',
    'model_revision': '19671f406d603126926c1b7e2adc169acbcade22',
    'license': 'MIT', 'inference': 'local Apple MPS', 'remote_inference': False,
    'caption': caption, 'style': args.style, 'bpm': bpm, 'seed': seed, 'duration_requested': 32,
    'audio_paths': [str(audio['path']) for audio in result.audios],
}
(args.output / 'generation.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(manifest, ensure_ascii=False, indent=2), flush=True)
