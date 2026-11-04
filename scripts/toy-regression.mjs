// UI-only regression on the isolated preview origin (not the user's playing tab).
// New isolated origin; defaults to a fresh, zero-score game.
export async function toyRegression(tab, browser, fs, output) {
  const records=[];
  const vp=await browser.capabilities.get('viewport');
  function check(name,pass){if(!pass)throw Error(name);records.push({name,result:'passed'});}
  for(let level=0;level<3;level++){
    if(level || !(await tab.playwright.locator("#game").isVisible())){
      await tab.playwright.getByRole('button',{name:'开心连连看',exact:true}).click();
      await tab.playwright.locator('#difficulties button:nth-child('+(level+1)+')').click();
      check('highest-separated-'+level,(await tab.playwright.locator('#difficulty-note').innerText()).includes('不限时'));
      await tab.playwright.getByRole('button',{name:'开始连连看',exact:true}).click();
    }
    const total=[8,18,24][level], base=[50,100,150][level], extra=0;
    const start=Number(await tab.playwright.locator('#progress').getAttribute('aria-valuenow'));
    for(const width of [320,375,390,430]){
      await vp.set({width,height:844});
      const geometry=await tab.playwright.evaluate(()=>({
        w:document.documentElement.clientWidth,s:document.documentElement.scrollWidth,
        cells:Array.from(document.querySelectorAll('#board button')).map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}))
      }));
      check('layout-'+level+'-'+width,geometry.s<=geometry.w&&geometry.cells.length===total*2&&geometry.cells.every(c=>c.w>=44&&c.h>=44));
    }
    await vp.set({width:390,height:844});
    await fs.writeFile(output+'/game-'+level+'.png',await tab.screenshot({fullPage:true}));
    for(let n=start;n<total;n++){
      await tab.playwright.getByRole('button',{name:'提示一下',exact:true}).click();
      check('score-'+level+'-'+n,Number(await tab.playwright.locator('#score').innerText())===n*base+extra);
      const names=await tab.playwright.evaluate(()=>Array.from(document.querySelectorAll('#board button.hinted')).map(b=>b.getAttribute('aria-label')));
      check('hint-'+level+'-'+n,names.length===2);
      for(const name of names)await tab.playwright.getByRole('button',{name,exact:true}).click();
      if(n===3){
        await tab.reload(); await tab.playwright.getByRole('button',{name:'继续上次',exact:true}).click();
        check('restored-'+level,Number(await tab.playwright.locator('#score').innerText())===4*base+extra);
      }
    }
    await tab.playwright.getByRole('button',{name:'领取收藏卡',exact:true}).click();
    const expected=(total+2)*base+extra;
    check('completion-score-'+level,(await tab.playwright.locator('#round-summary').innerText()).includes(expected+'分'));
    const inventory=await tab.playwright.locator('#palette button').allTextContents({});
    check('inventory-'+level,inventory.slice(0,6).reduce((n,s)=>n+Number(s.split('× ')[1]),0)===total);
    for(let i=0;i<5;i++){
      await tab.playwright.getByRole('button',{name:'贴纸位置 '+(i+1),exact:true}).click();
      await tab.playwright.locator('#palette button:nth-child('+[3,1,5,2,6][i]+')').click();
    }
    await tab.playwright.locator('#papers button:nth-child('+(level+1)+')').click();
    await tab.playwright.getByRole('button',{name:'做好了',exact:true}).click();
    await fs.writeFile(output+'/result-'+level+'.png',await tab.screenshot({fullPage:true}));
    await fs.writeFile(output+'/progress.json',JSON.stringify(records,null,2));
  }
  await tab.reload(); await tab.playwright.getByRole('button',{name:'继续上次',exact:true}).click();
  check('result-restored',await tab.playwright.locator('#result').isVisible());
  await tab.playwright.getByRole('button',{name:'开心连连看',exact:true}).click();
  for(let level=0;level<3;level++){
    await tab.playwright.locator('#difficulties button:nth-child('+(level+1)+')').click();
    check('best-restored-'+level,(await tab.playwright.locator('#difficulty-note').innerText()).includes(String([500,2000,3900][level])));
  }
  records.push({name:'console',value:await tab.dev.logs({levels:['error'],limit:20})});
  await fs.writeFile(output+'/browser-regression.json',JSON.stringify({scope:'local-browser-only',records},null,2));
  await vp.reset(); return {checks:records.length};
}
