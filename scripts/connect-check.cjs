// Written before connect.js. Pure-rule checks complement the full browser flow.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../src/connect.js'), 'utf8'), sandbox);
const rules = sandbox.window.WeekendConnect;
const records = [];
function check(name, run) { run(); records.push(name); }
function grid(rows) { return rows.join('').split('').map(c => c === '.' ? null : Number(c)); }
function boardWith(a,b) { const v=Array(36).fill(1); v[a]=v[b]=0; return v; }
check('invalid endpoints and different objects',()=>{
 const b=Array(36).fill(null);b[0]=0;b[1]=1;
 for(const pair of [[0,1],[0,0],[0,2],[-1,1],[0,36],[.5,1]])assert.equal(rules.connect(b,...pair),null);
});
check('straight adjacency and empty gap',()=>{
 const b=Array(36).fill(null);b[7]=b[10]=0;
 assert.equal(rules.connect(b,7,10).length,2);
 assert.equal(rules.connect(boardWith(7,8),7,8).length,2);
});
check('blocked internal pair cannot tunnel through tiles',()=>assert.equal(rules.connect(boardWith(7,10),7,10),null));
check('one corner',()=>{
 const b=Array(36).fill(null);b[7]=b[14]=0;
 assert.equal(rules.connect(b,7,14).length,3);
});
check('exactly two corners',()=>{
 const b=Array(36).fill(1);[7,8,9,15,21,20,19].forEach(i=>b[i]=null);b[7]=b[19]=0;
 assert.equal(rules.connect(b,7,19).length,4);
});
check('outer border routing',()=>{
 const b=boardWith(0,5);const p=rules.connect(b,0,5);
 assert.equal(p.length,4); assert.ok(p.some(v=>v.x===-1||v.x===6||v.y===-1||v.y===6));
});
check('three required corners rejected',()=>{
 const b=grid(['111111','10..11','111.11','11..11','110111','111111']);
 assert.equal(rules.connect(b,7,26),null);
});
check('three balanced initial layouts clear fully',()=>{
 const layouts=[];
 for(let seed=1;seed<=3;seed++){
  const b=Array.from(rules.createBoard(seed));layouts.push(JSON.stringify(b));
  for(let k=0;k<12;k++)assert.equal(b.filter(v=>v===k).length,rules.difficulty(1).counts[k]);
  for(let i=0;i<18;i++){const pair=rules.findPair(b);assert.ok(pair);b[pair.a]=b[pair.b]=null;}
  assert.ok(b.every(v=>v===null));
 }
 assert.equal(new Set(layouts).size,3);
});
check('no-move rearrangement is bounded and preserves every tile',()=>{
 const b=grid(['012345','123450','234501','345012','450123','501234']);
 assert.equal(rules.findPair(b),null);
 const before=JSON.stringify(b);
 for(const limit of [0,12]){
  const fixed=Array.from(rules.reshuffle(b,3,limit));
  assert.ok(rules.findPair(fixed));
  assert.deepEqual(fixed.slice().sort(),b.slice().sort());
 }
 assert.equal(JSON.stringify(b),before);
});
check('fallback handles partially removed board and empty board',()=>{
 const b=Array(36).fill(null);b[7]=b[10]=0;b[13]=b[16]=1;
 const fixed=Array.from(rules.reshuffle(b,2,0));
 assert.deepEqual(fixed.slice().sort(),b.slice().sort());
 assert.ok(rules.findPair(fixed));
 assert.equal(rules.findPair(Array(36).fill(null)),null);
});
check('difficulty dimensions, inventories, paths and full clearance',()=>{
 for(const [level,cols,rows,total] of [[0,4,4,8],[1,6,6,18],[2,6,8,24]]){
  const spec=rules.difficulty(level);
  assert.equal(spec.cols,cols);assert.equal(spec.rows,rows);assert.equal(spec.pairs,total);
  for(let seed=1;seed<=3;seed++){
   const board=Array.from(rules.createBoard(seed,level));assert.equal(board.length,cols*rows);
   for(let k=0;k<12;k++)assert.equal(board.filter(v=>v===k).length,spec.counts[k]);
   for(let i=0;i<total;i++){const pair=rules.findPair(board,cols);assert.ok(pair);board[pair.a]=board[pair.b]=null;}
   assert.ok(board.every(v=>v===null));
   const mixed=Array.from(rules.reshuffle(rules.createBoard(seed,level),seed,0,cols));
   assert.ok(rules.findPair(mixed,cols));
  }
 }
});
check('score streak cap, no negative values and one-time finish reward',()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(rules.award(1,0,0,false))),{score:100,streak:1});
 assert.deepEqual(JSON.parse(JSON.stringify(rules.award(1,100,1,false))),{score:210,streak:2});
 assert.equal(rules.award(2,0,10,false).score,200);
 assert.equal(rules.award(0,0,0,true).score,150);
 assert.equal(rules.award(1,0,0,true).score,300);
});
check('expanded catalogs contain 8, 10, 12 kinds with paired counts',()=>{
 for(let level=0;level<3;level++){
  const spec=rules.difficulty(level);
  assert.equal(spec.counts.length,12);
  assert.equal(spec.counts.filter(n=>n>0).length,[8,10,12][level]);
  assert.ok(spec.counts.every(n=>n%2===0));
  assert.equal(spec.counts.reduce((a,b)=>a+b,0),spec.cols*spec.rows);
 }
});
check('classic counts remain available for old save migration',()=>{
 for(let level=0;level<3;level++){
  const spec=rules.difficulty(level,0), expected=[[4,2,4,2,2,2],[6,6,6,6,6,6],[8,8,8,8,8,8]][level];
  assert.deepEqual(Array.from(spec.counts),expected.concat([0,0,0,0,0,0]));
  const b=Array.from(rules.createBoard(1,level,0));assert.ok(b.every(n=>n<6));
 }
});
console.log(JSON.stringify({status:'passed',checks:records},null,2));
