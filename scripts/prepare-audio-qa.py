"""Create an instrumented copy; never include QA controls in the upload ZIP."""
from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
qa=root/'artifacts/audio-0.7.1/qa'
qa.mkdir(parents=True,exist_ok=True)
shutil.copytree(root/'dist/0.7.1',qa,dirs_exist_ok=True)
html=(qa/'index.html').read_text().replace('<script src="./sound.js">','<script src="./audio-observer.js"></script><script src="./sound.js">')
(qa/'index.html').write_text(html)
(qa/'audio-observer.js').write_text('''
(function(){
var data={created:0,started:0,ended:0,active:0,peak:0,frequencies:[],errors:[]};
var panel=document.createElement('pre');panel.id='audio-observation';document.body.appendChild(panel);
function render(){panel.textContent=JSON.stringify(data);}
window.addEventListener('error',function(e){data.errors.push(e.message);render();});
window.addEventListener('unhandledrejection',function(e){data.errors.push(String(e.reason));render();});
var Native=window.AudioContext||window.webkitAudioContext;
if(location.search==='?unsupported'){window.AudioContext=undefined;window.webkitAudioContext=undefined;render();return;}
window.AudioContext=function(){
 data.created++;var context=new Native(),create=context.createOscillator.bind(context);
 var analyser=context.createAnalyser(),bytes=new Float32Array(2048);analyser.fftSize=2048;
 var connect=AudioNode.prototype.connect;
 AudioNode.prototype.connect=function(target){if(target===context.destination)connect.call(this,analyser);return connect.apply(this,arguments);};
 context.createOscillator=function(){var osc=create(),start=osc.start.bind(osc);osc.start=function(){data.started++;data.active++;data.frequencies.push(osc.frequency.value);if(data.frequencies.length>100)data.frequencies.shift();render();return start.apply(osc,arguments);};osc.addEventListener('ended',function(){data.ended++;data.active--;render();});return osc;};
 setInterval(function(){analyser.getFloatTimeDomainData(bytes);data.peak=Math.max.apply(null,Array.from(bytes).map(Math.abs));render();},50);
 if(location.search==='?rejected')context.resume=function(){return Promise.reject(Error('Injected resume rejection'));};
 if(location.search==='?delayed'){var resume=context.resume.bind(context);context.resume=function(){var result=resume();return new Promise(function(resolve,reject){setTimeout(function(){result.then(resolve,reject);},700);});};}
 render();return context;
};render();
})();
''')
print(qa)
