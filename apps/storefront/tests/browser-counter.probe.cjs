const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const out = '/tmp/opencode/counter-hero';
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
          objects: [...scene.querySelectorAll('.hero-object')].map(rect),
          labels: [...scene.querySelectorAll('.hero-object span')].map(rect),
          overflow: document.documentElement.scrollWidth > innerWidth,
          tilt: getComputedStyle(scene.querySelector('.hero-counter-top')).transform,
        };
      });
      assert.equal(geometry.overflow, false);
      const baseline = geometry.objects[0].bottom;
      for (const object of geometry.objects) {
        assert(Math.abs(object.bottom - baseline) < 1, 'all objects share the contact baseline');
        assert(object.bottom > geometry.surface.top && object.bottom < geometry.surface.bottom, 'base touches tabletop');
      }
      for (const label of geometry.labels) assert(label.top > geometry.edge.bottom, 'labels clear the front edge');
      for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) {
        const x = geometry.objects[a], y = geometry.objects[b];
        assert(x.right <= y.left || y.right <= x.left, 'settled products do not overlap');
      }
      results.push({ width, selected, ...geometry });
      await page.screenshot({ path: `${out}/${width}-${selected}.png` });
    }
    await page.locator('.hero-object').nth(0).dispatchEvent('click', { detail: 1 });
    const movingBases = await page.locator('.hero-object').evaluateAll(objects => {
      objects.forEach(object => object.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 100; }));
      return objects.map(object => object.getBoundingClientRect().bottom);
    });
    assert(Math.max(...movingBases) - Math.min(...movingBases) < 1, 'contact baseline remains fixed during transition');
    await page.screenshot({ path: `${out}/${width}-in-motion.png` });
  }
  fs.writeFileSync(`${out}/counter-results.json`, JSON.stringify(results, null, 2));
  console.log('Counter: 12 selection/viewport combinations; aligned contact bases, visible table/edge, labels below edge, no settled overlap or overflow; 4 mid-transition baseline checks passed.');
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
