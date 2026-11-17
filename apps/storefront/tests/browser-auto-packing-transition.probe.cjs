const { chromium } = require('/home/fabianvcha/playwright-login/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = '/tmp/opencode/neutral-template/auto-packing-transition';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [], report = [];
  page.on('pageerror', error => errors.push(error.message));
  const sample = () => page.evaluate(() => {
    const root = document.querySelector('.product-journey');
    return { phase: root.dataset.phase, y: scrollY, packing: +root.dataset.kitPacking, close: +root.style.getPropertyValue('--parcel-close'), project: +getComputedStyle(root.querySelector('.journey-object')).opacity, table: +getComputedStyle(root.querySelector('.kit-table')).opacity, pieces: [...root.querySelectorAll('.kit-piece')].map(el => el.style.transform), packed: root.dataset.packed };
  });
  for (const reduced of [false, true]) for (const [width, height] of [[1440,900],[390,844],[320,740]]) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.goto('http://localhost:8000/p/producto-ejemplo-1', { waitUntil: 'networkidle' });
    const tabs = page.locator('.journey-stops a');
    const price = await page.locator('.detail-price').innerText();
    await tabs.nth(1).click(); await page.waitForTimeout(450);
    await tabs.nth(2).click(); await page.waitForTimeout(80);
    const blend = await sample();
    if (!reduced) { assert(blend.project > 0 && blend.project < 1, JSON.stringify(blend)); assert(blend.table > 0 && blend.table < 1, JSON.stringify(blend)); }
    await page.screenshot({ path: `${out}/${width}-${reduced}-blend.png` });
    await page.waitForTimeout(350);
    assert.equal((await sample()).phase, '2');
    await page.locator('.kit-select').nth(1).click();
    assert.equal(await page.locator('.kit-select').nth(1).getAttribute('aria-pressed'), 'true');
    const enhanced = await page.locator('.product-journey').evaluate(el => el.classList.contains('is-enhanced'));
    await page.evaluate(() => {
      window.packingTiming = {};
      const root = document.querySelector('.product-journey');
      const observer = new MutationObserver(() => {
        const p = +root.dataset.kitPacking;
        if (p > 0 && window.packingTiming.start === undefined) window.packingTiming.start = performance.now();
        if (p === 1) { window.packingTiming.duration = performance.now() - window.packingTiming.start; observer.disconnect(); }
      });
      observer.observe(root, { attributes: true, attributeFilter: ['data-kit-packing'] });
    });
    if (enhanced && !reduced) {
      // A single ordinary wheel advance crosses the next chapter, not a packing scrub.
      await page.mouse.move(3, 400); await page.mouse.wheel(0, 320);
      await page.waitForFunction(() => document.querySelector('.product-journey').dataset.phase === '3');
      await page.waitForTimeout(80);
    } else { await tabs.nth(3).click(); await page.waitForTimeout(80); }
    const early = await sample();
    await page.waitForTimeout(200); const middle = await sample();
    if (!reduced) { assert(middle.packing > early.packing); assert.notDeepEqual(early.pieces, middle.pieces); assert.equal(middle.y, early.y); }
    await page.screenshot({ path: `${out}/${width}-${reduced}-packing.png` });
    await page.waitForTimeout(850); const final = await sample();
    const timing = await page.evaluate(() => window.packingTiming);
    if (!reduced) assert(timing.duration >= 900 && timing.duration <= 1100, JSON.stringify(timing));
    assert(final.close > .999); assert.equal(final.packed, 'true'); assert.equal(final.y, early.y);
    await page.screenshot({ path: `${out}/${width}-${reduced}-closed.png` });
    if (enhanced) { await page.mouse.wheel(0, 25); await page.waitForTimeout(150); assert.equal((await sample()).packing, 1); }
    for (const phase of [2,3,1,3,2]) { await tabs.nth(phase).click(); }
    await page.waitForTimeout(450); assert.equal((await sample()).phase, '2'); assert.equal((await sample()).packing, 0);
    await tabs.nth(3).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
    assert((await sample()).close > .999);
    assert.equal(await page.locator('.detail-price').innerText(), price);
    assert(await page.locator('.buy-now').isEnabled());
    const geometry = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, cta: document.querySelector('.buy-now').getBoundingClientRect().bottom }));
    assert(!geometry.overflow); assert(geometry.cta <= height, JSON.stringify(geometry));
    report.push({ width, reduced, enhanced, blend, early, middle, final, geometry, timing });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // Repeated mounts each get one fresh entry, and hidden/offscreen work pauses.
  for (let mount = 0; mount < 2; mount++) {
    await page.goto('http://localhost:8000/p/producto-ejemplo-1', { waitUntil: 'networkidle' });
    await page.locator('.journey-stops a').nth(3).click(); await page.waitForTimeout(150);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    const hidden = await sample(); await page.waitForTimeout(300);
    assert.equal((await sample()).packing, hidden.packing);
    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
    await page.waitForTimeout(100); assert((await sample()).packing > hidden.packing);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(500);
    const offscreen = await sample(); await page.waitForTimeout(300);
    assert.equal((await sample()).packing, offscreen.packing);
    await page.locator('.journey-stops a').nth(2).click(); await page.waitForTimeout(100);
    assert.equal((await sample()).packing, 0);
    await page.locator('.journey-stops a').nth(3).click(); await page.waitForTimeout(150);
    assert((await sample()).packing > 0 && (await sample()).packing < .5);
    await page.waitForTimeout(1000); assert((await sample()).close > .999);
  }
  await page.goto('http://localhost:8000/p/producto-ejemplo-2', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.kit-table').count(), 0);
  assert.deepEqual(errors, []);
  fs.writeFileSync(`${out}/report.json`, JSON.stringify({ report, errors }, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
