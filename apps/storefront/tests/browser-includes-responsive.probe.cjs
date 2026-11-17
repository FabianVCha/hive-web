const { chromium } = require('/home/fabianvcha/playwright-login/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.STOREFRONT_TEST_BASE_URL || 'http://localhost:8000';
const out = process.env.STOREFRONT_MOTION_EVIDENCE || '/tmp/opencode/mobile-motion-fix/includes-after';
fs.mkdirSync(out, {recursive:true});
(async () => {
  const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const report = [], errors = [];
  const page = await browser.newPage({isMobile:true,hasTouch:true,extraHTTPHeaders:base.startsWith('https://') ? {'ngrok-skip-browser-warning':'true'} : {}});
  page.on('pageerror', error => errors.push(error.message));
  // Reuse the mounted page across resizes to catch stale packing geometry.
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${base}/p/taladro-bauker-12v`,{waitUntil:'networkidle'});
  await page.waitForFunction(() => document.querySelector('.product-journey')?.classList.contains('is-enhanced'));
  for (const [width,height] of [[360,640],[390,740],[390,844],[320,740],[844,390],[640,360],[740,320]]) {
    await page.setViewportSize({width,height});
    await page.waitForTimeout(250);
    await page.locator('.journey-stops a').nth(2).tap();
    await page.waitForTimeout(400);
    for (let index = 0; index < 3; index++) {
      await page.locator('.kit-select').nth(index).tap();
      assert.equal(await page.locator('.kit-select').nth(index).getAttribute('aria-pressed'), 'true');
    }
    await page.waitForTimeout(300);
    const geometry = await page.evaluate(() => {
      const root = document.querySelector('.product-journey');
      const rect = selector => root.querySelector(selector).getBoundingClientRect().toJSON();
      return {scene:rect('.journey-visual'),cta:rect('.buy-now'),price:rect('.detail-price'),purchase:rect('.product-purchase'),details:rect('.journey-chapters .text-link'),overflow:document.documentElement.scrollWidth>innerWidth,innerScroll:getComputedStyle(root.querySelector('.journey-chapters')).overflowY,
        pieces:[...root.querySelectorAll('.kit-select')].map(el=>({button:el.getBoundingClientRect().toJSON(),label:el.querySelector('.kit-label').getBoundingClientRect().toJSON(),labelOverflow:el.querySelector('.kit-label').scrollWidth>el.querySelector('.kit-label').clientWidth,image:el.querySelector('img').getBoundingClientRect().toJSON()})),pause:rect('.kit-table .hero-motion-toggle'),info:rect('.kit-info')};
    });
    assert(!geometry.overflow);
    assert.equal(geometry.innerScroll,'visible');
    assert(geometry.cta.bottom<=height,JSON.stringify({width,height,geometry}));
    assert(geometry.details.bottom<=height,JSON.stringify({width,height,geometry}));
    for(const piece of geometry.pieces) {
      assert(piece.button.width>=44 && piece.button.height>=44,JSON.stringify(piece));
      assert(piece.image.top>=geometry.scene.top && piece.image.bottom<=geometry.scene.bottom);
      assert(piece.label.left>=geometry.scene.left && piece.label.right<=geometry.scene.right);
      assert(piece.label.bottom<=geometry.scene.bottom);
      assert(!piece.labelOverflow);
      assert(piece.image.top>=geometry.pause.bottom-2);
    }
    for(let i=1;i<3;i++) assert(geometry.pieces[i-1].label.right<=geometry.pieces[i].label.left);
    assert(geometry.info.bottom<=geometry.scene.bottom);
    assert(geometry.info.right<=geometry.pause.left || geometry.info.top>=geometry.pieces[0].label.bottom);
    assert(geometry.details.right<=geometry.purchase.left || geometry.details.bottom<=geometry.purchase.top);
    await page.screenshot({path:`${out}/${width}-${height}.png`});
    await page.locator('.journey-stops a').nth(3).tap();
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('.product-journey').getAttribute('data-packed'),'true');
    const landing = await page.evaluate(() => {
      const box = document.querySelector('.shipping-parcel').getBoundingClientRect();
      return [...document.querySelectorAll('.kit-piece')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,box:box.toJSON()};});
    });
    for(const piece of landing) assert(piece.x>=piece.box.left && piece.x<=piece.box.right && piece.y>=piece.box.top && piece.y<=piece.box.bottom,JSON.stringify({width,piece}));
    report.push({width,height,geometry,landing});
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`${out}/report.json`,JSON.stringify({base,report,errors},null,2));
  await browser.close();
  console.log('Responsive includes and resized packing checks passed');
})().catch(error=>{console.error(error);process.exit(1);});
