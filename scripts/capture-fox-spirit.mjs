import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('screenshots/circle-upgrade',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/?lab=1&qa=1');await page.waitForFunction(()=>window.__LINGHU__);
await page.evaluate(async()=>{
 const {FoxSpirit}=await import('/src/rendering/fox-spirit.ts');const {app,view}=window.__LINGHU__;
 app.ticker.stop();view.root.visible=false;app.renderer.resize(1440,1000);
 app.canvas.style.width='1440px';app.canvas.style.height='1000px';
 document.querySelector('.lab-panel').style.display='none';document.querySelector('#app').style.cssText='width:1440px;height:1000px;max-width:none;max-height:none;';
 for(const [i,form] of ['coiled','guardian'].entries()){
  const fox=new FoxSpirit(410,form);fox.update(1.2);fox.root.position.set(360+i*720,540);app.stage.addChild(fox.root);
 }
 app.render();
});
await page.locator('canvas').screenshot({path:'screenshots/circle-upgrade/fox-spirit-design.png'});
assert.deepEqual(errors,[]);await browser.close();console.log('PASS isolated vector phantom preview');
