"""Deterministic original mallet effects. No samples or borrowed melodies."""
from pathlib import Path
import array, json, math, subprocess, wave
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'/'sound-effects';OUT.mkdir(parents=True,exist_ok=True)
RATE=44100
# Short non-song feedback intervals; deliberately dry and lower than full scale.
recipes={
 'match':[(0,523.25,.16,.7),(.085,783.99,.23,.6)],
 'combo':[(0,659.25,.17,.65),(.075,880,.19,.55),(.15,1046.5,.25,.5)],
 'combo-high':[(0,783.99,.15,.6),(.06,1046.5,.19,.55),(.13,1318.51,.24,.45)],
 'win':[(0,523.25,.22,.55),(.12,659.25,.22,.5),(.24,783.99,.22,.5),(.40,1046.5,.65,.5),(.40,659.25,.65,.22),(.40,783.99,.65,.24)]
}
report={}
for name,notes in recipes.items():
 duration=max(t+d for t,f,d,a in notes)+.06
 values=[0.0]*int(duration*RATE)
 for start,freq,length,amplitude in notes:
  for i in range(int(length*RATE)):
   t=i/RATE;u=t/length
   envelope=min(1,t/.004)*math.exp(-5*u)*(1-u)**.6
   tone=math.sin(2*math.pi*freq*t)+.19*math.sin(2*math.pi*freq*2.01*t)*math.exp(-12*u)
   values[int(start*RATE)+i]+=tone*envelope*amplitude
 peak=max(abs(v) for v in values)
 gain=.56/max(1,peak)
 pcm=array.array('h',(round(math.tanh(v*gain)*32767) for v in values))
 path=OUT/(name+'.wav')
 with wave.open(str(path),'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
 target=ROOT/'src'/'assets'/('sfx-'+name+'.mp3')
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(path),'-codec:a','libmp3lame','-b:a','96k',str(target)],check=True)
 report[name]={'duration':duration,'source':'original deterministic additive synthesis','sample_rate':RATE,'notes':notes,'bytes':target.stat().st_size}
(OUT/'generation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
