// UI-only fixture: a fresh origin, light difficulty, seed 1, already started.
export async function audioRegression(tab, fs, out) {
  const report=[];
  async function read(){return tab.playwright.evaluate(()=>({
    effects:Array.from(document.querySelectorAll('audio[data-sfx]')).map(a=>({name:a.dataset.sfx,time:a.currentTime,paused:a.paused,duration:Number.isFinite(a.duration)?a.duration:null})),
    music:{paused:document.querySelector('#music').paused,time:document.querySelector('#music').currentTime,source:document.querySelector('#music').getAttribute('src')},
    effectLabel:document.querySelector('#sfx-toggle').getAttribute('aria-label'),score:document.querySelector('#score').textContent,
    victory:!document.querySelector('#victory').hidden
  }));}
  async function check(name,pass,state){report.push({name,pass,state});await fs.writeFile(out+'/browser-audio.json',JSON.stringify({scope:'local-browser-only',report},null,2));if(!pass)throw Error(name);}
  const pairs=[['第9格 相机','第10格 相机'],['第13格 咖啡','第14格 咖啡'],['第3格 樱桃','第7格 樱桃'],['第1格 花束','第4格 花束'],['第6格 花束','第11格 花束'],['第5格 咖啡','第15格 咖啡'],['第2格 布包','第12格 布包'],['第8格 可颂','第16格 可颂']];
  await tab.playwright.getByRole('button',{name:'第1格 花束',exact:true}).click();
  await tab.playwright.getByRole('button',{name:'第2格 布包',exact:true}).click();
  let state=await read();await check('mismatch-is-silent',state.effects.every(a=>a.time===0&&a.paused),state);
  await tab.playwright.getByRole('button',{name:'取消选择',exact:true}).click();
  for(let n=0;n<pairs.length;n++){
    if(n===1)await tab.playwright.getByRole('button',{name:'关闭音效',exact:true}).click();
    if(n===2)await tab.playwright.getByRole('button',{name:'开启音效',exact:true}).click();
    if(n===4)await tab.playwright.getByRole('button',{name:'开启配乐',exact:true}).click();
    for(const name of pairs[n])await tab.playwright.getByRole('button',{name,exact:true}).click();
    await tab.playwright.locator('#progress[aria-valuenow="'+(n+1)+'"]').getAttribute('aria-valuenow');
    state=await read();
    if(n===1)await check('muted-match',state.effects.every(a=>a.paused),state);
    else {
      const expected=n===7?'win':n>=3?'combo-high':n>=1?'combo':'match';
      const effect=state.effects.find(a=>a.name===expected);
      await check('pair-'+(n+1)+'-'+expected,!effect.paused||effect.time>0,state);
    }
    if(n===0)await check('effects-work-with-music-off',state.music.paused,state);
  }
  // Wait through an actual UI transition, not an injected game-state change.
  await tab.playwright.getByRole('button',{name:'领取收藏卡',exact:true}).click();
  state=await read();await check('complete-score',state.score==='750',state);
  await tab.playwright.getByRole('button',{name:'关闭音效',exact:true}).click();
  state=await read();await check('sfx-mute-does-not-stop-music',state.effects.every(a=>a.paused)&&!state.music.paused,state);
  await tab.playwright.getByRole('button',{name:'关闭配乐',exact:true}).click();
  await tab.reload();state=await read();
  check('preference-survives-refresh',state.effectLabel==='开启音效'&&state.music.paused,state);
  await tab.playwright.getByRole('button',{name:'继续上次',exact:true}).click();
  await check('studio-restored',await tab.playwright.locator('#studio').isVisible());
  report.push({name:'console',value:await tab.dev.logs({levels:['error'],limit:20})});
  await fs.writeFile(out+'/browser-audio.json',JSON.stringify({scope:'local-browser-only',report},null,2));
  return {checks:report.length};
}
