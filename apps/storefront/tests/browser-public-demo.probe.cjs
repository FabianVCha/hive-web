const { chromium } = require('/home/fabianvcha/playwright-login/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.STOREFRONT_TEST_BASE_URL;
assert(base?.startsWith('https://'), 'Set STOREFRONT_TEST_BASE_URL to the public demo URL');
const out = '/tmp/opencode/mobile-motion-fix/public-access';
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  // No bypass header: exercise exactly the visitor's warning/cookie flow.
  const page = await browser.newPage({viewport:{width:390,height:740},isMobile:true,hasTouch:true});
  const errors = [], consoleErrors = [], failed = [], socketFrames = [];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
  page.on('requestfailed',request=>failed.push(request.url()));
  page.on('websocket',socket=>socket.on('framereceived',()=>socketFrames.push(socket.url())));
  await page.goto(base,{waitUntil:'networkidle'});
  const warning = page.getByRole('button',{name:/Visit Site/i});
  const sawWarning = await warning.count()>0;
  if(sawWarning) {await warning.click();await page.waitForLoadState('networkidle');}
  await page.waitForFunction(()=>!document.querySelector('.hero-actions button')?.disabled);
  await page.locator('.hero-object').nth(1).tap();
  const selectedText = await page.locator('.hero-detail h2').innerText();
  assert(selectedText.includes('44 piezas'));
  await page.locator('.hero-actions button').tap();
  assert.equal(await page.locator('.cart-count').innerText(),'1');
  await page.screenshot({path:`${out}/home-cart.png`});
  await page.locator('.cart-link').click();
  await page.waitForURL('**/carrito');
  assert((await page.locator('.cart-items h2').innerText()).includes('44 piezas'));
  await page.goto(`${base}/p/taladro-bauker-12v`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('.product-journey')?.classList.contains('is-enhanced'));
  await page.locator('.journey-stops a').nth(2).tap();
  await page.waitForTimeout(350);
  await page.locator('.kit-select').nth(1).tap();
  assert.equal(await page.locator('.kit-select').nth(1).getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{
    window.publicPacking=[];
    const root=document.querySelector('.product-journey');
    new MutationObserver(()=>window.publicPacking.push([performance.now(),+root.dataset.kitPacking,scrollY]))
      .observe(root,{attributes:true,attributeFilter:['data-kit-packing']});
  });
  await page.locator('.journey-stops a').nth(3).tap();
  // Resize during packing: it must retarget the parcel, not restart the clock.
  await page.waitForTimeout(150);
  await page.setViewportSize({width:360,height:640});
  await page.waitForTimeout(1100);
  const packing=await page.evaluate(()=>{
    const samples=window.publicPacking.filter(entry=>entry[1]>0),end=samples.find(entry=>entry[1]===1);
    const parcel=document.querySelector('.shipping-parcel').getBoundingClientRect();
    return {duration:end[0]-samples[0][0],packed:document.querySelector('.product-journey').dataset.packed,
      landing:[...document.querySelectorAll('.kit-piece')].every(el=>{const r=el.getBoundingClientRect();return r.x+r.width/2>=parcel.left&&r.x+r.width/2<=parcel.right&&r.y+r.height/2>=parcel.top&&r.y+r.height/2<=parcel.bottom;})};
  });
  assert(packing.duration>=900&&packing.duration<=1100,JSON.stringify(packing));
  assert.equal(packing.packed,'true');assert(packing.landing);
  assert(socketFrames.length>0,'Public dev WebSocket must receive frames');
  assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(failed,[]);
  const cookieNames=(await page.context().cookies()).map(cookie=>cookie.name);
  fs.writeFileSync(`${out}/report.json`,JSON.stringify({base,sawWarning,cookieNames,selectedText,cartCount:1,cartRouteVerified:true,packing,webSocketFrames:socketFrames.length,errors,consoleErrors,failed},null,2));
  await browser.close();
  console.log('Normal public visitor, cart, WebSocket and mid-packing resize passed');
})().catch(error=>{console.error(error);process.exit(1);});
