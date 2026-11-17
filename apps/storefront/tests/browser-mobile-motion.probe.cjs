const { chromium } = require('/home/fabianvcha/playwright-login/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.env.STOREFRONT_MOTION_EVIDENCE || '/tmp/opencode/mobile-motion-fix';
const base = process.env.STOREFRONT_TEST_BASE_URL || 'http://localhost:8000';
const headers = base.startsWith('https://') ? { 'ngrok-skip-browser-warning': 'true' } : {};
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const report = [], errors = [];
  for (const [width, height] of [[360,640],[390,740],[390,844],[412,915],[844,390],[1440,900]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 900, hasTouch: true, extraHTTPHeaders: headers });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/p/taladro-bauker-12v`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('.product-journey')?.classList.contains('is-enhanced'));
    assert(await page.locator('.product-journey').evaluate(el => el.classList.contains('is-enhanced')));
    await page.evaluate(() => {
      window.__mobilePackingSamples = [];
      const root = document.querySelector('.product-journey');
      new MutationObserver(() => window.__mobilePackingSamples.push([performance.now(), +root.dataset.kitPacking, scrollY]))
        .observe(root, { attributes: true, attributeFilter: ['data-kit-packing'] });
    });
    const cdp = await page.context().newCDPSession(page);
    const phases = [];
    // Browser-native touch scrolling, not wheel events or synthetic DOM scroll events.
    for (let step = 0; step < 12; step++) {
      const x = width - 8, y = Math.round(height * .7);
      await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x,y}]});
      for (let move = 1; move <= 8; move++) {
        await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x,y:y-move*15}]});
        await page.waitForTimeout(20);
      }
      await page.waitForTimeout(100);
      await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
      await page.waitForTimeout(400);
      const state = await page.locator('.product-journey').evaluate(el => ({ phase: +el.dataset.phase, y: scrollY, transform: el.querySelector('.journey-object').style.transform, cta: el.querySelector('.buy-now').getBoundingClientRect().bottom, stage: el.querySelector('.journey-stage').getBoundingClientRect().top }));
      phases.push(state);
      if (state.phase === 3) break;
    }
    assert(phases.some(s => s.phase === 1), JSON.stringify({width, phases}));
    assert(phases.some(s => s.phase === 2), JSON.stringify({width, phases}));
    assert.equal(phases.at(-1).phase, 3, JSON.stringify({width, phases}));
    assert(new Set(phases.map(s => s.transform)).size > 1);
    const y = await page.evaluate(() => scrollY);
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => scrollY), y);
    assert.equal(await page.locator('.product-journey').getAttribute('data-packed'), 'true');
    const packing = await page.evaluate(() => {
      const samples = window.__mobilePackingSamples.filter(entry => entry[1] > 0);
      const end = samples.find(entry => entry[1] === 1);
      return { duration: end[0] - samples[0][0], minY: Math.min(...samples.map(entry => entry[2])), maxY: Math.max(...samples.map(entry => entry[2])) };
    });
    assert(packing.duration >= 900 && packing.duration <= 1100, JSON.stringify(packing));
    // A native drag may enter phase 3 before the same gesture finishes. Once
    // it settles, packing completes without any additional scroll input.
    packing.settledY = y;
    const geometry = await page.evaluate(() => ({ cta: document.querySelector('.buy-now').getBoundingClientRect().bottom, overflow: document.documentElement.scrollWidth > innerWidth, innerScroll: getComputedStyle(document.querySelector('.journey-chapters')).overflowY }));
    assert(geometry.cta <= height, JSON.stringify({width,height,geometry}));
    assert(!geometry.overflow);
    if (width < 900) assert.equal(geometry.innerScroll, 'visible');
    await page.screenshot({ path: `${out}/${width}-${height}.png` });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(100);
    assert(!(await page.locator('.product-journey').evaluate(el => el.classList.contains('is-enhanced'))));
    report.push({width,height,phases,geometry,packing});
    await page.close();
  }
  const page = await browser.newPage({ viewport: {width:390,height:740}, isMobile:true, hasTouch:true, extraHTTPHeaders: headers });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, {waitUntil:'networkidle'});
  await page.locator('.hero-actions button').waitFor({state:'visible'});
  await page.waitForFunction(() => !document.querySelector('.hero-actions button').disabled);
  await page.locator('.hero-object').nth(1).tap();
  assert.equal(await page.locator('.product-hero').getAttribute('data-idle'), 'running');
  const selected = await page.locator('.hero-object[aria-pressed="true"]').getAttribute('aria-label');
  const selectedText = await page.locator('.hero-detail h2').innerText();
  assert(selectedText.includes('44 piezas'));
  await page.locator('.hero-actions button').tap();
  assert.equal(await page.locator('.cart-count').innerText(), '1');
  await page.screenshot({path:`${out}/home-cart.png`});
  await page.waitForTimeout(10400);
  assert.notEqual(await page.locator('.hero-object[aria-pressed="true"]').getAttribute('aria-label'), selected);
  await page.locator('.hero-motion-toggle').tap();
  assert.equal(await page.locator('.product-hero').getAttribute('data-idle'), 'paused');
  await page.locator('.hero-motion-toggle').tap();
  assert.equal(await page.locator('.product-hero').getAttribute('data-idle'), 'running');
  await page.locator('.hero-object').first().focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.product-hero').getAttribute('data-idle'), 'paused');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.hero-object-sway').first().evaluate(el => getComputedStyle(el).animationName), 'none');
  assert.deepEqual(errors, []);
  fs.writeFileSync(`${out}/report.json`, JSON.stringify({base,report, errors, hero:{selectedText,cartCount:1,checks:'touch autoplay, pause/resume, keyboard and reduced motion passed'}},null,2));
  await browser.close();
  console.log('Mobile motion checks passed');
})().catch(error => { console.error(error); process.exit(1); });
