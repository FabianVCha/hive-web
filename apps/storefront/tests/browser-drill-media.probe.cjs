const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/home/fabianvcha/playwright-login/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const out = '/tmp/opencode/drill-multi-image';
  fs.mkdirSync(out, { recursive: true });
  const report = [];
  for (const reduced of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    for (const [width, height] of [[1440, 900], [390, 844], [320, 740]]) {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:8000/p/taladro-bauker-12v', { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.querySelectorAll('.journey-media-layer .figure-painted').length === 2 && [...document.querySelectorAll('.kit-piece img')].every(img => img.complete));
      const geometry = await page.evaluate(() => {
        const bottom = s => document.querySelector(s).getBoundingClientRect().bottom;
        return { overflow: document.documentElement.scrollWidth > innerWidth, price: bottom('.detail-price'), add: bottom('.buy-controls'), buy: bottom('.buy-now'), enhanced: document.querySelector('.product-journey').classList.contains('is-enhanced') };
      });
      assert(!geometry.overflow);
      assert(geometry.price <= height && geometry.add <= height && geometry.buy <= height, JSON.stringify(geometry));
      await page.getByRole('button', { name: 'Aumentar cantidad', exact: true }).click();
      const phases = [];
      for (let phase = 0; phase < 4; phase++) {
        if (geometry.enhanced) {
          await page.evaluate(phase => {
            const el = document.querySelector('.product-journey');
            const inset = innerWidth <= 760 ? 124 : 88;
            const top = el.getBoundingClientRect().top + scrollY - inset;
            scrollTo({ top: top + (el.offsetHeight - innerHeight + inset) * [0, .35, .62, .79][phase], behavior: 'instant' });
          }, phase);
        } else {
          await page.locator('.journey-stops a').nth(phase).focus();
          await page.keyboard.press('Enter');
        }
        await page.waitForFunction(phase => document.querySelector('.product-journey').dataset.phase === String(phase), phase);
        await page.waitForTimeout(550);
        const state = await page.evaluate(() => {
          const layer = document.querySelector('.journey-media-layer[data-active="true"]');
          const phase = document.querySelector('.product-journey').dataset.phase;
          return { src: layer?.dataset.mediaSrc ?? (phase === '2' ? 'independent-kit-components' : 'sequential-kit-parcel'), opacity: layer ? getComputedStyle(layer).opacity : '1', transform: getComputedStyle(document.querySelector('.journey-object')).transform, scale: layer ? getComputedStyle(layer.querySelector('canvas, img')).transform : 'none', clip: getComputedStyle(document.querySelector('.journey-visual')).overflowX, overflow: document.documentElement.scrollWidth > innerWidth };
        });
        assert.equal(state.opacity, '1');
        assert.equal(state.clip, 'clip');
        assert(!state.overflow);
        phases.push(state);
        await page.screenshot({ path: `${out}/${width}-${reduced ? 'reduced' : 'motion'}-phase-${phase}.png` });
      }
      assert.equal(new Set(phases.map(state => state.src)).size, 4);
      if (geometry.enhanced) {
        await page.evaluate(() => {
          const el = document.querySelector('.product-journey');
          scrollTo({ top: el.getBoundingClientRect().top + scrollY + el.offsetHeight - innerHeight, behavior: 'instant' });
        });
        await page.waitForFunction(() => document.querySelector('.product-journey').dataset.packed === 'true');
        await page.waitForTimeout(600);
        assert.equal(await page.locator('.journey-object').evaluate(el => getComputedStyle(el).opacity), '0');
        await page.screenshot({ path: `${out}/${width}-packed-end.png` });
      }
      assert.equal(await page.locator('output[aria-label="Cantidad"]').innerText(), '2');
      for (const phase of [0, 2, 1, 3, 0]) {
        await page.locator('.journey-stops a').nth(phase).focus();
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(800);
      assert.equal(await page.locator('.product-journey').getAttribute('data-phase'), '0');
      assert.equal(await page.locator('.journey-media-layer').count(), 2);
      report.push({ width, reduced, geometry, phases });
    }
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:8000/p/taladro-bauker-12v', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Ver sin animación', exact: true }).click();
  const frames = await page.evaluate(async () => {
    const result = [];
    document.querySelectorAll('.journey-stops a')[1].click();
    for (let i = 0; i < 16; i++) {
      await new Promise(requestAnimationFrame);
      result.push({ opacities: [...document.querySelectorAll('.journey-media-layer')].map(el => +getComputedStyle(el).opacity), animations: document.getAnimations().filter(a => a.transitionProperty === 'opacity').map(a => ({ time: a.currentTime, duration: a.effect.getTiming().duration })) });
    }
    return result;
  });
  assert(frames.some(frame => frame.opacities.filter(o => o > 0 && o < 1).length >= 2));
  assert(frames.some(frame => frame.animations.some(a => a.duration === 200)));
  report.push({ frames });
  await page.goto('http://localhost:8000/p/taladro-inalambrico-20v', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.journey-media-layer').count(), 0);
  assert.equal(await page.locator('.journey-object .product-figure').count(), 1);
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
  console.log(`PASS: six viewport/motion combinations, four views, scroll, interrupted navigation, persistent quantity, actual 200ms crossfade frames and unrelated SKU. Evidence: ${out}`);
})().catch(error => { console.error(error); process.exit(1); });
