// Run with the Codex Browser skill's documented tab/browser bindings.
// Starting state: a completed postcard. Uses UI only; no hidden application state.
export async function regression(tab, browser, fs, output) {
  const records = [];
  const viewport = await browser.capabilities.get("viewport");
  const check = async (name, condition) => {
    if (!condition) throw new Error(name);
    records.push({ name, result: "passed" });
  };
  for (let run = 0; run < 2; run++) {
    await tab.playwright
      .getByRole("button", { name: "再做一页", exact: true })
      .click();
    records.push({
      name: "layout",
      value: await tab.playwright.locator("#chapter").innerText(),
    });
    for (const width of [320, 375, 390, 430]) {
      await viewport.set({ width, height: 844 });
      const sizes = await tab.playwright.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        cells: Array.from(document.querySelectorAll("#board button")).map(
          (e) => ({
            w: e.getBoundingClientRect().width,
            h: e.getBoundingClientRect().height,
          }),
        ),
      }));
      await check(
        "board-width-" + width,
        sizes.scroll <= sizes.width &&
          sizes.cells.every((c) => c.w >= 44 && c.h >= 44),
      );
    }
    for (let round = 0; round < 6; round++) {
      for (let step = 0; step < 4; step++) {
        await tab.playwright
          .getByRole("button", { name: "提示一下", exact: true })
          .click();
        const name = await tab.playwright
          .locator("#board button.hinted")
          .getAttribute("aria-label");
        await tab.playwright.getByRole("button", { name, exact: true }).click();
      }
      await check(
        "round-locked",
        !(await tab.playwright.locator("#hint").isEnabled()),
      );
      await tab.playwright
        .getByRole("button", { name: "收好，下一组", exact: true })
        .click();
    }
    const inventory = await tab.playwright
      .locator("#palette button")
      .allTextContents({});
    await check(
      "24-stamps",
      inventory.reduce(
        (n, s) => n + Number((s.match(/× (\d+)/) || [])[1] || 0),
        0,
      ) === 24,
    );
    await check("live-preview", await tab.playwright.locator("#studio-preview").isVisible());
    for (const width of [320, 390]) {
      await viewport.set({width, height:844});
      const sizes = await tab.playwright.evaluate(() => ({
        width:document.documentElement.clientWidth,
        scroll:document.documentElement.scrollWidth,
        cells:Array.from(document.querySelectorAll("#slots button")).map(e => ({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))
      }));
      await check("studio-width-"+width,sizes.scroll<=sizes.width && sizes.cells.every(c=>c.w>=44 && c.h>=44));
    }
    for (let i = 0; i < 5; i++) {
      await tab.playwright
        .getByRole("button", { name: "贴纸位置 " + (i + 1), exact: true })
        .click();
      const choices = await tab.playwright
        .locator("#palette button")
        .allTextContents({});
      const name = choices
        .slice(0, 6)
        .filter((s) => Number(s.split("× ")[1]) > 0)[
        i %
          choices.slice(0, 6).filter((s) => Number(s.split("× ")[1]) > 0).length
      ];
      await tab.playwright.getByRole("button", { name, exact: true }).click();
    }
    await tab.playwright
      .getByRole("button", { name: "做好了", exact: true })
      .click();
    await tab.playwright.locator("#message").fill("我的周末清单");
    for (const width of [320, 375, 390, 430]) {
      await viewport.set({ width, height: 844 });
      const sizes = await tab.playwright.evaluate(() => ({
        w: document.documentElement.clientWidth,
        s: document.documentElement.scrollWidth,
      }));
      await check("postcard-width-" + width, sizes.s <= sizes.w);
    }
    await fs.writeFile(
      output + "/postcard-layout-" + (run + 2) + ".png",
      await tab.screenshot({ fullPage: true }),
    );
  }
  await tab.reload();
  await tab.playwright
    .getByRole("button", { name: "继续上次", exact: true })
    .click();
  await check(
    "postcard-restored",
    (await tab.playwright.locator("#message").getAttribute("id")) ===
      "message" && (await tab.playwright.locator("#result").isVisible()),
  );
  await tab.playwright
    .getByRole("button", { name: "拼个周末", exact: true })
    .click();
  await check(
    "three-recent-recipes",
    (await tab.playwright.locator("#recent button").count()) === 3,
  );
  records.push({
    name: "console-errors",
    value: await tab.dev.logs({ levels: ["error"], limit: 10 }),
  });
  await fs.writeFile(
    output + "/browser-regression.json",
    JSON.stringify(
      { type: "local-browser-only", platformAcceptance: "pending", records },
      null,
      2,
    ),
  );
  await viewport.reset();
  return records;
}
