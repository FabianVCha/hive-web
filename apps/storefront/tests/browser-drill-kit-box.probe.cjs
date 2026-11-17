const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/home/fabianvcha/playwright-login/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const out = '/tmp/opencode/drill-kit-box';
  fs.mkdirSync(out, { recursive: true });
  const report = [];
  for (const reduced of [false, true]) for (const [width, height] of [[1440, 900], [390, 844], [320, 740]]) {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.setViewportSize({ width, height });
    await page.goto('http://localhost:8000/p/taladro-bauker-12v', { waitUntil: 'networkidle' });
    const geometry = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, cta: document.querySelector('.buy-now').getBoundingClientRect().bottom, enhanced: document.querySelector('.product-journey').classList.contains('is-enhanced') }));
    assert(!geometry.overflow); assert(geometry.cta <= height);
    await page.locator('.journey-stops a').nth(2).focus(); await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    assert.equal(await page.locator('.product-journey').getAttribute('data-phase'), '2');
    assert.equal(await page.locator('.journey-contents li').count(), 3);
    assert.equal(await page.locator('.kit-piece img').count(), 3);
    assert(await page.locator('.kit-piece img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)));
    assert(await page.locator('.journey-content-note').isVisible());
    await page.screenshot({ path: `${out}/${width}-${reduced}-includes.png` });
    for (const progress of [.7, .8, .9, 1]) {
      if (geometry.enhanced) await page.evaluate(p => {
        const el = document.querySelector('.product-journey'); const inset = innerWidth <= 760 ? 124 : 88;
        scrollTo({ top: el.getBoundingClientRect().top + scrollY - inset + (el.offsetHeight - innerHeight + inset) * p, behavior: 'instant' });
      }, progress);
      else { await page.locator('.journey-stops a').nth(3).focus(); await page.keyboard.press('Enter'); }
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${out}/${width}-${reduced}-${progress}.png` });
    }
    for (const phase of [0, 2, 1, 3, 0]) { await page.locator('.journey-stops a').nth(phase).focus(); await page.keyboard.press('Enter'); }
    await page.waitForTimeout(900);
    assert.equal(await page.locator('.product-journey').getAttribute('data-phase'), '0');
    assert.equal(await page.locator('.journey-media-layer[data-active="true"]').count(), 1);
    report.push({ width, reduced, geometry });
  }
  await page.goto('http://localhost:8000/p/taladro-inalambrico-20v', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.journey-media-layer').count(), 0);
  assert.equal(await page.locator('.journey-object .product-figure').count(), 1);
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
