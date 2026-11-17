const { chromium } = require('/home/fabianvcha/playwright-login/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = '/tmp/opencode/kit-table-packing';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const report = [];
  async function sample() {
    return page.evaluate(() => {
      const root = document.querySelector('.product-journey');
      return { phase: root.dataset.phase, packing: Number(root.dataset.kitPacking), close: Number(root.style.getPropertyValue('--parcel-close')), pieces: [...root.querySelectorAll('.kit-piece')].map(el => ({ packed: el.dataset.packed, transform: el.style.transform, opacity: getComputedStyle(el).opacity })), idle: root.querySelector('.kit-table').dataset.idle };
    });
  }
  for (const reduced of [false, true]) for (const [width, height] of [[1440, 900], [390, 844], [320, 740]]) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.goto('http://localhost:8000/p/taladro-bauker-12v', { waitUntil: 'networkidle' });
    const geometry = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, cta: document.querySelector('.buy-now').getBoundingClientRect().bottom, enhanced: document.querySelector('.product-journey').classList.contains('is-enhanced') }));
    assert(!geometry.overflow); assert(geometry.cta <= height);
    const price = await page.locator('.detail-price').innerText();
    await page.screenshot({ path: `${out}/${width}-${reduced}-initial.png` });
    await page.locator('.journey-stops a').nth(2).focus(); await page.keyboard.press('Enter');
    await page.waitForTimeout(650);
    assert.equal((await sample()).phase, '2');
    assert.equal(await page.locator('.kit-piece img').count(), 3);
    assert(await page.locator('.kit-piece img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)));
    await page.screenshot({ path: `${out}/${width}-${reduced}-includes.png` });
    if (!reduced) {
      await page.mouse.click(1, 1); await page.mouse.move(1, 1);
      await page.locator('.kit-select').nth(1).click();
      assert.equal(await page.locator('.kit-select').nth(1).getAttribute('aria-pressed'), 'true');
      await page.locator('.kit-table .hero-motion-toggle').click();
      assert.equal((await sample()).idle, 'paused');
      await page.locator('.kit-table .hero-motion-toggle').click();
      await page.locator('.kit-select').nth(2).focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('.kit-table').getAttribute('data-motion'), 'keyboard');
      assert.equal((await sample()).idle, 'paused');
    }
    const samples = [];
    if (geometry.enhanced) {
      await page.locator('.journey-stops a').nth(3).click();
      await page.waitForTimeout(200);
      const early = await sample(); samples.push(early); assert(early.close < .001);
      const scroll = await page.evaluate(() => scrollY);
      await page.waitForTimeout(950);
      const final = await sample(); samples.push(final);
      assert(final.close > .99); assert(final.pieces.every(piece => piece.packed === 'true'));
      assert.equal(await page.evaluate(() => scrollY), scroll);
      await page.screenshot({ path: `${out}/${width}-${reduced}-auto-packed.png` });
    } else {
      await page.locator('.journey-stops a').nth(3).focus(); await page.keyboard.press('Enter');
      await page.waitForTimeout(50);
      assert((await sample()).pieces.every(piece => piece.packed === 'true'));
      await page.screenshot({ path: `${out}/${width}-${reduced}-final.png` });
      if (!reduced) {
        await page.locator('.kit-replay').click();
        await page.waitForTimeout(200); const early = await sample(); samples.push(early); assert(early.close === 0); assert(!early.pieces.every(piece => piece.packed === 'true'));
        await page.waitForTimeout(950); assert((await sample()).close > .99);
      }
    }
    for (const phase of [2, 3, 0, 2, 1, 3, 0]) { await page.locator('.journey-stops a').nth(phase).focus(); await page.keyboard.press('Enter'); }
    await page.waitForTimeout(650);
    assert.equal((await sample()).phase, '0');
    assert.equal(await page.locator('.detail-price').innerText(), price);
    assert.equal(await page.locator('#especificaciones').count(), 1);
    report.push({ width, height, reduced, geometry, samples });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://localhost:8000/p/taladro-bauker-12v', { waitUntil: 'networkidle' });
  await page.locator('.journey-stops a').nth(2).click(); await page.waitForTimeout(700);
  await page.mouse.click(2, 400); await page.mouse.move(2, 400);
  assert.equal((await sample()).idle, 'running');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal((await sample()).idle, 'paused');
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(650);
  assert.equal((await sample()).idle, 'paused');
  await page.goto('http://localhost:8000/p/taladro-inalambrico-20v', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.kit-table').count(), 0);
  assert.equal(await page.locator('.journey-object .product-figure').count(), 1);
  assert.deepEqual(errors, []);
  fs.writeFileSync(`${out}/report.json`, JSON.stringify({ report, errors }, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
