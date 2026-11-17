const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const catalog = require('../data/prototype-products.json');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const out = '/tmp/opencode/interactive-hero';
  fs.mkdirSync(out, { recursive: true });
  const slugs = ['taladro-bauker-12v', 'herramientas-44-piezas', 'tijera-podar-8'];
  const results = [];
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('http://localhost:8000');
    await page.locator('.hero-actions button:not([disabled])').waitFor();
    await page.locator('.hero-object img').evaluateAll(async images => Promise.all(images.map(image => image.decode())));
    for (let index = 0; index < 3; index++) {
      const button = page.locator('.hero-object').nth(index);
      await button.click();
      await page.waitForTimeout(300);
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      const product = catalog.find(product => product.slug === slugs[index]);
      assert.equal(await page.locator('.hero-detail h2').innerText(), product.name);
      assert.equal(await page.locator('.hero-product-link').getAttribute('href'), `/p/${product.slug}`);
      assert((await page.locator('.hero-detail > strong').innerText()).includes(new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price)));
      assert.equal(await page.locator('.hero-object img').nth(index).evaluate(image => image.naturalWidth > 0), true);
      await page.locator('.hero-actions button').click();
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${out}/${width}.png` });
    results.push({ width, selection: '3 products synchronized', overflow: false });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://localhost:8000');
  await page.locator('.hero-object').nth(1).click({ noWaitAfter: true });
  const frames = await page.locator('.hero-object').evaluateAll(elements => {
    return elements.flatMap(element => element.getAnimations().map(animation => {
      animation.pause(); animation.currentTime = 100;
      return { transform: getComputedStyle(element).transform, duration: animation.effect.getTiming().duration };
    }));
  });
  assert.equal(frames.length, 3);
  await page.screenshot({ path: `${out}/transition-100ms.png` });
  for (const time of [50, 180]) {
    await page.locator('.hero-object').evaluateAll((elements, time) => elements.forEach(element => element.getAnimations().forEach(animation => { animation.currentTime = time; })), time);
    await page.screenshot({ path: `${out}/transition-${time}ms.png` });
  }
  await page.locator('.hero-object').evaluateAll(elements => elements.forEach(element => element.getAnimations().forEach(animation => animation.play())));
  for (const index of [2, 0, 1, 2, 1]) await page.locator('.hero-object').nth(index).dispatchEvent('click', { detail: 1 });
  assert.equal(await page.locator('.hero-object').nth(1).getAttribute('aria-pressed'), 'true');
  await page.locator('.hero-object').nth(0).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.hero-object').nth(0).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.hero-object').nth(0).evaluate(element => element === document.activeElement), true);
  assert.equal(await page.locator('.hero-object').evaluateAll(elements => elements.flatMap(element => element.getAnimations()).length), 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.hero-object').nth(2).click();
  assert.equal(await page.locator('.hero-object').evaluateAll(elements => elements.flatMap(element => element.getAnimations()).length), 0);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.hero-actions button:not([disabled])').waitFor();
  await page.locator('.hero-object').nth(1).click();
  await page.locator('.hero-actions button').click();
  await page.goto('http://localhost:8000/carrito');
  await page.locator('.cart-item').waitFor();
  assert.equal(await page.locator('.cart-item').count(), 1);
  assert.equal(await page.locator('.cart-item h2 a').getAttribute('href'), '/p/herramientas-44-piezas');
  fs.writeFileSync(`${out}/results.json`, JSON.stringify({ results, frames, keyboard: 'instant; focus stable', reducedMotion: 'no transitions', rapidSelection: 'passed', cart: 'correct SKU' }, null, 2));
  console.log(JSON.stringify({ results, frames, checks: 'keyboard/reduced motion/rapid switching/cart passed' }));
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
