const { chromium } = require('/home/fabianvcha/playwright-login/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = '/tmp/opencode/neutral-template';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const { storefront } = await import('../data/storefront.mjs');
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [], report = [];
  page.on('pageerror', error => errors.push(error.message));
  async function check(route, width, name) {
    const response = await page.goto(`http://localhost:8000${route}`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, route);
    assert.doesNotMatch(await page.locator('body').innerText(), /ferready|bauker|taladro|ferretería|herramientas|homecenter|bosch/i);
    assert.doesNotMatch(await page.title(), /ferready/i);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} overflow ${width}`);
    const images = await page.locator('main img').evaluateAll(async images => {
      await Promise.all(images.map(async image => { image.loading = 'eager'; await image.decode().catch(() => {}); }));
      return images.map(image => ({ src: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0, alt: image.alt }));
    });
    assert(images.every(image => image.loaded && image.src.startsWith('/template/')), JSON.stringify(images));
    assert.equal(await page.locator('.fr-header').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(255, 255, 255)');
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
    report.push({ route, width, images });
  }
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await check('/', width, 'home');
    assert.equal(await page.locator('.hero-object').count(), 3);
    for (const index of [1, 2, 0]) {
      await page.locator('.hero-object').nth(index).click();
      assert.equal(await page.locator('.hero-detail h2').innerText(), storefront.products[index].name);
      assert.equal(await page.locator('.hero-object').nth(index).getAttribute('aria-pressed'), 'true');
    }
    await page.locator('.hero-object').nth(2).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.hero-detail h2').innerText(), storefront.products[2].name);
    await page.locator('.objective-options button').nth(1).click();
    assert.equal(await page.locator('.objective-intro h3').innerText(), storefront.objectives[1].title);
    await page.locator('.objective-summary button').click();
    await check('/carrito', width, 'cart');
    assert.equal(await page.locator('.cart-item').count(), 2);
    await check('/catalogo', width, 'catalog');
    assert.equal(await page.locator('.product-card').count(), 3);
    await check('/c/categoria-1', width, 'category');
    assert.equal(await page.locator('.product-card').count(), 1);
    await check('/catalogo?q=Producto%20de%20ejemplo%202', width, 'search');
    assert.equal(await page.locator('.product-card').count(), 1);
    await check('/p/producto-ejemplo-1', width, 'product');
    await page.locator('.journey-stops a').nth(2).click();
    await page.waitForTimeout(350);
    await page.locator('.kit-select').nth(2).click();
    assert.equal(await page.locator('.kit-select').nth(2).getAttribute('aria-pressed'), 'true');
    await page.screenshot({ path: `${out}/contents-${width}.png` });
    await check('/informacion', width, 'information');
    await check('/guias', width, 'guides');
    await check('/guias/guia-ejemplo', width, 'guide');
    await page.evaluate(() => localStorage.clear());
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.mouse.move(2, 2);
  await page.waitForFunction(() => document.querySelector('.product-hero').dataset.idle === 'running');
  await page.waitForFunction(() => document.querySelector('.hero-object[aria-pressed="true"]').getAttribute('aria-label').includes('ejemplo 2'), { timeout: 13000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.product-hero').getAttribute('data-idle'), 'paused');
  await page.locator('.hero-object').nth(2).click();
  assert.equal(await page.locator('.hero-object').nth(2).evaluate(element => getComputedStyle(element).transitionDuration), '0s');
  const publicUrl = process.env.PUBLIC_DEMO_URL;
  if (publicUrl) {
    await page.setExtraHTTPHeaders({ 'ngrok-skip-browser-warning': 'true' });
    const response = await page.goto(publicUrl, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('.template-wordmark').first().innerText(), storefront.brandName);
    await page.screenshot({ path: `${out}/public-home.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(`${out}/report.json`, JSON.stringify({ report, errors }, null, 2));
  await browser.close();
  console.log('Neutral template routes, selections, keyboard, cart, idle cycle, reduced motion and public page passed');
})().catch(error => { console.error(error); process.exit(1); });
