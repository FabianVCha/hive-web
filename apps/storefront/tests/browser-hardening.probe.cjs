// Optional host browser regression: PLAYWRIGHT_MODULE points to a local install.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const origin = process.env.PROBE_ORIGIN || 'http://localhost:8000';
  await page.goto(origin);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const font of ['100%', '200%']) {
      await page.evaluate(font => document.documentElement.style.fontSize = font, font);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow: ${width}/${font}`);
      assert(parseFloat(await page.getByRole('searchbox').evaluate(el => getComputedStyle(el).fontSize)) >= 16);
    }
  }
  await page.evaluate(() => document.documentElement.style.fontSize = '100%');
  const trigger = page.getByRole('button', { name: 'Abrir menú' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.mobile-menu').getAttribute('aria-expanded'), 'false');
  assert(await page.locator('.mobile-menu').evaluate(el => el === document.activeElement));
  await trigger.click();
  await page.getByRole('searchbox').click();
  assert.equal(await page.locator('.mobile-menu').getAttribute('aria-expanded'), 'false');
  assert(await page.getByRole('searchbox').evaluate(el => el === document.activeElement));
  await trigger.click();
  await page.locator('.category-nav .all-categories').click();
  await page.waitForURL('**/catalogo');
  assert.equal(await page.locator('.mobile-menu').getAttribute('aria-expanded'), 'false');
  await page.goto(origin);
  const add = page.getByRole('button', { name: 'Agregar seleccionados', exact: true });
  await add.click();
  assert.match(await page.locator('.toast').innerText(), /Se añadieron 3 unidades/);
  await page.locator('.objective-product input').first().fill('20');
  await page.locator('.objective-product input').first().blur();
  await add.click();
  assert.match(await page.locator('.toast').innerText(), /21 de 22 unidades.*Límite/s);
  for (const input of await page.locator('.objective-product input').all()) { await input.fill('20'); await input.blur(); }
  await add.click();
  await add.click();
  assert.match(await page.locator('.toast').innerText(), /No se añadió ninguna unidad.*Límite/s);
  await page.locator('.hero-actions button').click();
  assert.match(await page.locator('.toast').innerText(), /No se añadió ninguna unidad/);
  await page.reload();
  await page.locator('.objective-workspace[aria-busy="false"]').waitFor();
  assert.equal(await page.locator('.objective-product input').first().inputValue(), '20');
  assert.equal(await page.locator('.cart-count').innerText(), '60');
  await page.route('**/ferready/products/**', route => route.abort());
  await page.route('**/ferready/hero/*.webp', route => route.abort());
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('[data-image-fallback]').length > 0);
  assert(await page.locator('.hero-object img').first().evaluate(el => el.naturalWidth > 0 && !!el.dataset.imageFallback));
  const productUrl = await page.locator('.hero-product-link').getAttribute('href');
  await page.goto(origin + productUrl);
  await page.waitForFunction(() => !!document.querySelector('.gallery-main [data-image-fallback]'));
  await page.goto(origin + '/carrito');
  await page.waitForFunction(() => !!document.querySelector('.cart-item [data-image-fallback]'));
  console.log('PASS: 1440/390/320 at 100%/200%, search, menu keyboard/outside/link/focus, full/partial/blocked + individual feedback, persistence and home/detail/cart image fallback.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
