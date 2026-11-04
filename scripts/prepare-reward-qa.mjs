// Isolated fixture only: seed completed legacy rounds to exercise upgrade boundaries.
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),box={window:{}};
vm.runInNewContext(await readFile(new URL('src/connect.js',root),'utf8'),box);
const target=new URL('artifacts/rewards-0.8.0/qa/',root);
await mkdir(target,{recursive:true});await cp(new URL('dist/0.8.0/',root),target,{recursive:true});
const scenarios=[
 ['690',0,690,'元气'],['700',0,700,'闪亮'],['2390',1,2390,'闪亮'],['2400',1,2400,'珍藏'],
 ['4290',2,4290,'珍藏'],['4300',2,4300,'梦幻'],['4790',2,4790,'梦幻'],['4800',2,4800,'典藏'],
 ['completed-game',0,500,'元气'],['legacy-result',1,2000,'往日收藏']
];
const fixtures={};
for(const [id,level,score,expected] of scenarios){
 const spec=box.window.WeekendConnect.difficulty(level);
 const legacy=id==='legacy-result';
 const state={v:4,catalog:1,id:'upgrade-'+id,seed:1,level,score,streak:0,board:Array(spec.pairs*2).fill(null),selected:null,reorders:0,inventory:spec.counts.map(n=>n/2),slots:legacy?[0,1,2,3,6]:[null,null,null,null,null],paper:0,ink:0,message:'今天也收获了开心',date:'2026.11.04',screen:legacy?'result':id==='completed-game'?'game':'studio'};
 const old={id:'old-card',slots:[0,1,2,3,6],paper:1,ink:0,message:'以前的小开心',date:'2026.11.03'};
 fixtures[id]={state,recent:[old],lastSeed:1,difficulty:level,records:[0,0,0],musicEnabled:false,effectsEnabled:false};
}
await writeFile(new URL('fixture.js',target),'var fixtures='+JSON.stringify(fixtures)+';var testCase=location.search.slice(1);if(fixtures[testCase])localStorage.setItem("fengwu.v1",JSON.stringify(fixtures[testCase]));');
let html=await readFile(new URL('index.html',target),'utf8');html=html.replace('<script src="./ui.js">','<script src="./fixture.js"></script><script src="./ui.js">');await writeFile(new URL('index.html',target),html);
await writeFile(new URL('artifacts/rewards-0.8.0/scenarios.json',root),JSON.stringify(scenarios,null,2));
console.log(target.pathname);
