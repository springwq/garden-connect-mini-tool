// Codex Browser skill UI regression. Start on a new/partly completed game page.
// No storage injection or access to application internals.
export async function regression(tab, browser, fs, output, runs = 3) {
  const records = [];
  const viewport = await browser.capabilities.get('viewport');
  function check(name, value) {
    if (!value) throw Error(name);
    records.push({name, result:'passed'});
  }
  for (let run = 0; run < runs; run++) {
    if (run) await tab.playwright.getByRole('button',{name:'再做一页',exact:true}).click();
    records.push({name:'layout',value:await tab.playwright.locator('#chapter').innerText()});
    for (const width of [320,375,390,430]) {
      await viewport.set({width,height:844});
      const sizes=await tab.playwright.evaluate(()=>({
        width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
        cells:Array.from(document.querySelectorAll('#board button')).map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))
      }));
      check('six-columns-width-'+width,sizes.scroll<=sizes.width&&sizes.cells.length===36&&sizes.cells.every(c=>c.w>=44&&c.h>=44));
    }
    await viewport.set({width:390,height:844});
    await fs.writeFile(output+'/game-'+run+'.png',await tab.screenshot({fullPage:true}));
    const start=Number(await tab.playwright.locator('#progress').getAttribute('aria-valuenow'));
    for(let pair=start;pair<18;pair++){
      await tab.playwright.getByRole('button',{name:'提示一下',exact:true}).click();
      check('pair-count-'+run+'-'+pair,Number(await tab.playwright.locator('#progress').getAttribute('aria-valuenow'))===pair);
      const names=await tab.playwright.evaluate(()=>Array.from(document.querySelectorAll('#board button.hinted')).map(e=>e.getAttribute('aria-label')));
      check('hint-two-equal-'+run+'-'+pair,names.length===2&&names[0].split(' ')[1]===names[1].split(' ')[1]);
      await tab.playwright.getByRole('button',{name:names[0],exact:true}).click();
      await tab.playwright.getByRole('button',{name:names[1],exact:true}).click();
      if(pair===8){
        await tab.reload();
        await tab.playwright.getByRole('button',{name:'继续上次',exact:true}).click();
        check('mid-game-restored-'+run,Number(await tab.playwright.locator('#progress').getAttribute('aria-valuenow'))===9);
      }
    }
    await tab.playwright.getByRole('button',{name:'去拼手账',exact:true}).click();
    const inventory=await tab.playwright.locator('#palette button').allTextContents({});
    check('six-types-three-each-'+run,inventory.slice(0,6).every(s=>s.endsWith('× 3')));
    check('empty-studio-disabled-'+run,!(await tab.playwright.locator('#make').isEnabled()));
    if(!run){
      for(let i=1;i<=3;i++){
        await tab.playwright.getByRole('button',{name:'贴纸位置 '+i,exact:true}).click();
        await tab.playwright.locator('#palette button:nth-child(1)').click();
      }
      await tab.playwright.getByRole('button',{name:'贴纸位置 4',exact:true}).click();
      check('cannot-exceed-inventory',!(await tab.playwright.locator('#palette button:nth-child(1)').isEnabled()));
      await tab.playwright.getByRole('button',{name:'贴纸位置 1',exact:true}).click();
      await tab.playwright.locator('#palette button:nth-child(3)').click();
      await tab.playwright.getByRole('button',{name:'贴纸位置 4',exact:true}).click();
      check('replacement-returns-item',await tab.playwright.locator('#palette button:nth-child(1)').isEnabled());
    }
    const art=[3,1,5,2,6];
    for(let i=0;i<5;i++){
      await tab.playwright.getByRole('button',{name:'贴纸位置 '+(i+1),exact:true}).click();
      await tab.playwright.locator('#palette button:nth-child('+art[i]+')').click();
    }
    await tab.playwright.locator('#papers button:nth-child('+(run+1)+')').click();
    await tab.reload();
    await tab.playwright.getByRole('button',{name:'继续上次',exact:true}).click();
    check('theme-restored-'+run,(await tab.playwright.locator('#papers button:nth-child('+(run+1)+')').getAttribute('aria-pressed'))==='true');
    check('studio-ready-after-reload-'+run,await tab.playwright.locator('#make').isEnabled());
    await tab.playwright.getByRole('button',{name:'做好了',exact:true}).click();
    await tab.playwright.locator('#message').fill('走走停停，也很好');
    await fs.writeFile(output+'/result-'+run+'.png',await tab.screenshot({fullPage:true}));
  }
  await tab.reload();
  await tab.playwright.getByRole('button',{name:'继续上次',exact:true}).click();
  check('result-restored',await tab.playwright.locator('#result').isVisible());
  await tab.playwright.getByRole('button',{name:'小物连连看',exact:true}).click();
  check('three-recent-recipes',(await tab.playwright.locator('#recent button').count())===3);
  records.push({name:'console-errors',value:await tab.dev.logs({levels:['error'],limit:20})});
  await fs.writeFile(output+'/browser-regression.json',JSON.stringify({scope:'local-browser-only',records},null,2));
  await viewport.reset();
  return records;
}
