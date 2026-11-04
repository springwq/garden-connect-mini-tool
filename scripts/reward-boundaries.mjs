export async function rewardBoundaries(tab,fs,out){
 const cases=JSON.parse(await fs.readFile(out+'/scenarios.json','utf8')),results=[];
 for(const [id,level,score,expected] of cases){
  await tab.goto('http://127.0.0.1:4187/?'+id);
  await tab.playwright.getByRole('button',{name:'继续上次',exact:true}).click();
  const grade=await tab.playwright.locator('#result:not([hidden]) #reward-grade').innerText();
  const pass=grade.includes(expected);results.push({id,score,expected,grade,pass});
  await fs.writeFile(out+'/boundaries.json',JSON.stringify(results,null,2));if(!pass)throw Error(id);
  if(id==='690'||id==='4300')await fs.writeFile(out+'/reward-'+expected+'.png',await tab.screenshot({fullPage:true}));
  await tab.playwright.getByRole('button',{name:'开心连连看',exact:true}).click();
  await tab.playwright.getByRole('button',{name:'往日收藏 · 2026.11.03',exact:true}).click();
  if((await tab.playwright.locator('#card').getAttribute('aria-label'))!=='往日收藏卡')throw Error('legacy card lost');
 }
 return results;
}
