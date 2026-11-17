const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/home/fabianvcha/playwright-login/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const out = '/tmp/opencode/product-first';
  fs.mkdirSync(out, { recursive: true });
  const report = [];
  for (const reduced of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    for (const [width, height] of [[1440, 900], [390, 844], [320, 740]]) {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:8000/p/taladro-bauker-12v', { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.removeItem('ferready-demo-cart-v1'));
      await page.reload({ waitUntil: 'networkidle' });
      await page.screenshot({ path: `${out}/${width}-${reduced ? 'reduced' : 'initial'}.png` });
      const geometry = await page.evaluate(() => {
        const bounds = s => { const b = document.querySelector(s).getBoundingClientRect(); return { top: b.top, bottom: b.bottom }; };
        return { width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth, h1: bounds('h1'), price: bounds('.detail-price'), add: bounds('.buy-controls'), buy: bounds('.buy-now'), description: bounds('.detail-description'), enhanced: document.querySelector('.product-journey').classList.contains('is-enhanced') };
      });
      report.push({ reduced, ...geometry });
      assert(!geometry.overflow, JSON.stringify(geometry));
      assert(geometry.h1.top >= 0 && geometry.price.bottom <= height && geometry.add.bottom <= height, JSON.stringify(geometry));
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.getByRole('button', { name: 'Aumentar cantidad', exact: true }).count(), 1);
      await page.getByRole('button', { name: 'Aumentar cantidad', exact: true }).click();
      await page.getByRole('button', { name: 'Añadir al carrito', exact: true }).click();
      assert.equal(await page.locator('output[aria-label="Cantidad"]').innerText(), '2');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('ferready-demo-cart-v1'))[0]?.quantity === 2);
      await page.locator('.journey-stops a').nth(3).focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(900);
      assert.equal(await page.locator('.product-journey').getAttribute('data-phase'), '3');
      assert(await page.locator('.detail-description').isVisible());
      assert(await page.getByRole('button', { name: 'Añadir al carrito', exact: true }).isVisible());
      await page.screenshot({ path: `${out}/${width}-${reduced ? 'reduced' : 'packed'}-final.png` });
      await page.getByRole('button', { name: 'Añadir al carrito', exact: true }).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('ferready-demo-cart-v1'))[0]?.quantity === 4);
      for (const i of [0, 2, 1, 3, 0]) {
        await page.locator('.journey-stops a').nth(i).focus();
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(900);
      assert.equal(await page.locator('.product-journey').getAttribute('data-phase'), '0');
      assert.equal(await page.locator('[data-journey-chapter]:not([aria-hidden="true"])').count(), 1);
      await page.getByRole('button', { name: 'Ver sin animación', exact: true }).click();
      assert.equal(await page.locator('output[aria-label="Cantidad"]').innerText(), '2');
      assert.equal(await page.locator('[data-journey-chapter][inert]').count(), 3);
      assert.match(await page.locator('#especificaciones h2').innerText(), /Que sea justo\s+lo que necesitas\./);
      await page.getByRole('button', { name: 'Comprar ahora', exact: true }).click();
      await page.waitForURL('**/checkout');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('ferready-demo-cart-v1'))[0]?.quantity === 6);
    }
  }
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
