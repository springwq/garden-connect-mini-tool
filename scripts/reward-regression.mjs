// Real game UI; solver only consumes the visible board, never mutates app state.
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
export async function rewardRound(tab,browser,fs,out,level){
 const box={window:{}};vm.runInNewContext(await readFile(new URL('../src/connect.js',import.meta.url),'utf8'),box);
 const records=[];const click=async name=>tab.playwright.getByRole('button',{name,exact:true}).click();
 async function check(name,pass){records.push({name,pass});await fs.writeFile(out+'/round-'+level+'.json',JSON.stringify(records,null,2));if(!pass)throw Error(name);}
 if(level)await click('开心连连看');
 await click(['轻松，8对','标准，18对','挑战，24对'][level]);await click('开始连连看');
 for(let n=0;n<[8,18,24][level];n++){
  const cells=await tab.playwright.evaluate(()=>Array.from(document.querySelectorAll('#board button')).map(b=>({kind:b.getAttribute('data-kind'),label:b.getAttribute('aria-label')})));
  const pair=box.window.WeekendConnect.findPair(cells.map(c=>c.kind===null?null:Number(c.kind)),[4,6,6][level]);
  await click(cells[pair.a].label);await click(cells[pair.b].label);
  if(n<[8,18,24][level]-1)await tab.playwright.locator('#progress[aria-valuenow="'+(n+1)+'"]').getAttribute('aria-valuenow');
 }
 // Reading a visible locator retries until the completion transition has finished.
 const summary=await tab.playwright.locator('#result:not([hidden]) #round-summary').innerText();
 await check('score',summary.includes([750,2750,4950][level]+'分'));
 await check('grade',(await tab.playwright.locator('#reward-grade').innerText()).includes(['闪亮','珍藏','典藏'][level]));
 await check('direct-result',await tab.playwright.locator('#result').isVisible());
 await check('no-editor',await tab.playwright.evaluate(()=>!document.querySelector('#studio')&&!document.querySelector('#make')&&!document.querySelector('#message')));
 const label=await tab.playwright.locator('#card').getAttribute('aria-label');
 const viewport=await browser.capabilities.get('viewport');
 for(const width of [320,390,430]){
  await viewport.set({width,height:844});
  const g=await tab.playwright.evaluate(()=>({w:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,buttons:Array.from(document.querySelectorAll('#result button')).filter(b=>!b.hidden).map(b=>b.getBoundingClientRect().height)}));
  await check('layout-'+width,g.scroll<=g.w&&g.buttons.every(h=>h>=44));
 }
 await fs.writeFile(out+'/reward-'+level+'.png',await tab.screenshot({fullPage:true}));
 await tab.reload();await click('继续上次');
 await check('stable-card',await tab.playwright.locator('#card').getAttribute('aria-label')===label);
 await click('开心连连看');
 await check('saved-once',await tab.playwright.locator('#recent button').count()===level+1);
 await tab.playwright.locator('#recent button:first-of-type').click();
 await check('collection-opens',await tab.playwright.locator('#card').getAttribute('aria-label')===label);
 return records;
}
