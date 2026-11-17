const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const out = '/tmp/opencode/tablecloth-motion';
  fs.mkdirSync(out, { recursive: true });
  const results = [];
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('http://localhost:8000');
    await page.locator('.hero-actions button:not([disabled])').waitFor();
    await page.locator('.hero-object img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    for (let selected = 0; selected < 3; selected++) {
      await page.locator('.hero-object').nth(selected).click();
      await page.waitForTimeout(300);
      const geometry = await page.locator('.hero-objects').evaluate(scene => {
        const rect = element => {
          const { top, bottom, left, right } = element.getBoundingClientRect();
          return { top, bottom, left, right };
        };
        return {
          surface: rect(scene.querySelector('.hero-counter-top')),
          edge: rect(scene.querySelector('.hero-counter-edge')),
          toggle: rect(scene.querySelector('.hero-motion-toggle')),
          objects: [...scene.querySelectorAll('.hero-object')].map(rect),
          renders: [...scene.querySelectorAll('.hero-object-sway')].map(rect),
          labels: [...scene.querySelectorAll('.hero-object span')].map(rect),
          cloth: getComputedStyle(scene.querySelector('.hero-counter-top')).backgroundColor,
          hero: getComputedStyle(scene.closest('.product-hero')).backgroundColor,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.equal(geometry.cloth, geometry.hero, 'cloth uses exact configured hero background');
      assert.equal(geometry.overflow, false);
      for (const object of geometry.objects) {
        assert(Math.abs(object.bottom - geometry.objects[0].bottom) < 1);
        assert(object.bottom > geometry.surface.top && object.bottom < geometry.surface.bottom);
      }
      for (const label of geometry.labels) assert(label.top > geometry.edge.bottom);
      if (width < 600) for (const render of geometry.renders) assert(geometry.toggle.bottom <= render.top, 'control clears products');
      await page.screenshot({ path: `${out}/${width}-${selected}.png` });
      results.push({ width, selected, ...geometry });
    }
    const frames = await page.locator('.hero-object-sway').evaluateAll(elements => elements.map(element => {
      const animation = element.getAnimations()[0];
      const duration = animation.effect.getTiming().duration;
      animation.pause();
      const samples = [0, 2250, 4500, 6750, 9000].map(time => {
        animation.currentTime = time;
        const style = getComputedStyle(element);
        const matrix = new DOMMatrixReadOnly(style.transform);
        return { time, transform: style.transform, bottom: element.getBoundingClientRect().bottom,
          origin: style.transformOrigin, translation: [matrix.m41, matrix.m42, matrix.m43] };
      });
      animation.play();
      return { duration, samples };
    }));
    for (const frame of frames) {
      assert.equal(frame.duration, 9000);
      assert.notEqual(frame.samples[0].transform, frame.samples[2].transform);
      assert(Math.max(...frame.samples.map(s => s.bottom)) - Math.min(...frame.samples.map(s => s.bottom)) < 2.5, 'small billboard corner drift, no lifted support');
      for (const sample of frame.samples) assert.deepEqual(sample.translation, [0, 0, 0], 'no travel of bottom-center anchor');
    }
    results.push({ width, frames });
  }
  // Fresh CSS-owned timelines after the explicit WAAPI frame inspection above.
  await page.reload();
  await page.locator('.hero-actions button:not([disabled])').waitFor();
  await page.getByRole('button', { name: 'Pausar movimiento', exact: true }).click();
  const states = () => page.locator('.hero-object-sway').evaluateAll(elements => elements.map(element => getComputedStyle(element).animationPlayState));
  assert.deepEqual(await states(), ['paused', 'paused', 'paused']);
  await page.waitForTimeout(50);
  const before = await page.locator('.hero-object-sway').first().evaluate(element => getComputedStyle(element).transform);
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.hero-object-sway').first().evaluate(element => getComputedStyle(element).transform), before);
  await page.screenshot({ path: `${out}/paused-320.png` });
  await page.getByRole('button', { name: 'Activar movimiento', exact: true }).click();
  assert.deepEqual(await states(), ['running', 'running', 'running']);
  await page.keyboard.press('Tab');
  assert.deepEqual(await states(), ['paused', 'paused', 'paused']);
  await page.keyboard.press('Enter');
  assert(await page.locator('.hero-object').first().evaluate(element => element === document.activeElement));
  await page.locator('.hero-intro h1').click();
  assert.deepEqual(await states(), ['running', 'running', 'running']);
  await page.locator('.fr-footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  assert.deepEqual(await states(), ['paused', 'paused', 'paused']);
  await page.locator('.hero-intro').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  assert.deepEqual(await states(), ['running', 'running', 'running']);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.hero-motion-toggle').isVisible(), false);
  assert.deepEqual(await page.locator('.hero-object-sway').evaluateAll(elements => elements.map(element => ({ transform: getComputedStyle(element).transform, animations: element.getAnimations().length }))), Array.from({ length: 3 }, () => ({ transform: 'none', animations: 0 })));
  await page.screenshot({ path: `${out}/reduced-320.png` });
  fs.writeFileSync(`${out}/results.json`, JSON.stringify({ results, pauseResume: true, keyboard: true, offscreen: true, reducedMotion: true }, null, 2));
  await browser.close();
  console.log('Tablecloth: 12 viewport/selection screenshots; exact navy; contact; 60 motion samples; pause/resume, keyboard, offscreen and reduced motion passed.');
})().catch(error => { console.error(error); process.exit(1); });
