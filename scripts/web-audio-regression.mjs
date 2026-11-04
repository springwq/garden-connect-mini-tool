// Run with the Browser skill against the isolated fixture from prepare-audio-qa.py.
// Real Web Audio nodes are observed by fixture DOM; no app state is injected.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
export async function audioRegression(tab, fs, out) {
  const report=[];const sandbox={window:{}};
  vm.runInNewContext(await readFile(new URL('../src/connect.js',import.meta.url),'utf8'),sandbox);
  const rules=sandbox.window.WeekendConnect;
  const read=async()=>JSON.parse(await tab.playwright.locator('#audio-observation').innerText());
  const click=async name=>tab.playwright.getByRole('button',{name,exact:true}).click();
  async function check(name,pass,data){report.push({name,pass,data});await fs.writeFile(out+'/browser-audio.json',JSON.stringify({scope:'instrumented-local-browser-not-phone',report},null,2));if(!pass)throw Error(name);}
  let a=await read();await check('no-autoplay',a.started===0,a);
  await click('开启配乐');
  await tab.playwright.getByRole('button',{name:'关闭配乐',exact:true}).getAttribute('aria-label');
  a=await read();await check('music-started',a.started>0&&a.created===1,a);
  await click('关闭配乐');await click('轻松，8对');await click('开始连连看');
  let previous=(await read()).started;
  for(let n=0;n<8;n++){
    const cells=await tab.playwright.evaluate(()=>Array.from(document.querySelectorAll('#board button')).map(b=>({kind:b.getAttribute('data-kind'),label:b.getAttribute('aria-label')})));
    const board=cells.map(c=>c.kind===null?null:Number(c.kind));
    const pair=rules.findPair(board,4);
    if(n===1)await click('关闭音效');
    if(n===2)await click('开启音效');
    await click(cells[pair.a].label);await click(cells[pair.b].label);
    await tab.playwright.locator('#progress[aria-valuenow="'+(n+1)+'"]').getAttribute('aria-valuenow');
    a=await read();
    await check('pair-'+(n+1)+(n===7?'-victory':''),n===1?a.started===previous:a.started>previous,a);
    if(n!==1)await check('effect-notes-'+(n+1),a.started-previous===(n===7?14:n>=3?8:6),a.started-previous);
    previous=a.started;
  }
  await click('领取收藏卡');
  await check('completion-score',(await tab.playwright.locator('#round-summary').innerText()).includes('750分'));
  await click('开启配乐');await click('关闭音效');
  await check('independent-controls',await tab.playwright.getByRole('button',{name:'关闭配乐',exact:true}).getAttribute('aria-pressed')==='true');
  await click('关闭配乐');await tab.reload();
  await tab.playwright.getByRole('button',{name:'开启音效',exact:true}).getAttribute('aria-label');
  a=await read();await check('reload-muted-no-autoplay',a.started===0,a);
  await click('继续上次');await check('progress-preserved',await tab.playwright.locator('#studio').isVisible());
  await check('no-errors',a.errors.length===0,a.errors);
  await fs.writeFile(out+'/game-complete.png',await tab.screenshot({fullPage:true}));
  return report;
}
