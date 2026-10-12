import {chromium} from '@playwright/test';
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='screenshots/fox-guardian';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1180,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));await page.routeWebSocket('**',ws=>ws.close());
 const base=process.env.ARROW_CAPTURE_URL??'http://127.0.0.1:5174/?lab=1&qa=1&arrow=1';
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForFunction(()=>window.__ARROW_PREVIEW__&&window.__LINGHU__);await page.evaluate(()=>{window.__LINGHU__.app.ticker.stop();window.__ARROW_PREVIEW__.moving(false);});
 for(let lv=1;lv<=4;lv++){
  await page.evaluate(lv=>{window.__ARROW_PREVIEW__.frame(lv,[.29,.36,.42,2.16][lv-1]);window.__LINGHU__.app.render();},lv);
  assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills[0].arrows.projectiles.length),[1,1,3,0][lv-1]);await page.locator('#app').screenshot({path:`${dir}/lv${lv}.png`});
 }
 const shots=[];for(const [i,t] of [.22,.69,1.14,1.72,2.16,2.76].entries()){
  await page.evaluate(t=>{window.__ARROW_PREVIEW__.frame(4,t);window.__LINGHU__.app.render();},t);const b=await page.locator('#app').screenshot({path:`${dir}/stage-${i}.png`});shots.push(await sharp(b).resize(300,533).png().toBuffer());
  if(t===2.16){assert.equal(await page.evaluate(()=>[...window.__LINGHU__.view.arrows.items.values()][0].hero.clothProgress),1);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills[0].released),false);}
 }
 await sharp({create:{width:1800,height:533,channels:4,background:'#29242a'}}).composite(shots.map((input,i)=>({input,left:i*300,top:0}))).png().toFile(`${dir}/sequence.png`);
 await page.evaluate(()=>{window.__ARROW_PREVIEW__.frame(4,3.1);window.__LINGHU__.app.render();});assert.equal(await page.evaluate(()=>window.__LINGHU__.view.arrows.items.size),0);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.world.scale.x),1);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.world.pivot.x),0);
 await page.getByRole('button',{name:'符箭 Lv4',exact:true}).click();await page.getByRole('button',{name:'冻结 / 播放符箭',exact:true}).click();await page.getByRole('button',{name:'重播符箭',exact:true}).click();
 await page.evaluate(()=>{const el=document.querySelector('#arrow-preview input[type="range"]');el.value='2.16';el.dispatchEvent(new Event('input'));window.__LINGHU__.app.render();});assert.ok(Math.abs(await page.evaluate(()=>window.__LINGHU__.game.skills[0].age)-2.16)<1e-5);
 await page.locator('#app').screenshot({path:`${dir}/hero-hold.png`});
 // The explicit Canvas 2D version must render the same staged, editable geometry.
 await page.goto(new URL('/fox-guardian-preview.html',base).href);await page.waitForFunction(()=>window.__GUARDIAN_CANVAS__);await page.evaluate(()=>window.__GUARDIAN_CANVAS__.frame(2.16));await page.locator('canvas').screenshot({path:`${dir}/canvas-hold.png`});
 assert.deepEqual(errors,[]);console.log('PASS Lv1–3 preserved; Lv4 guardian stages, cloth morph, hero hold, cleanup, camera reset, controls and Canvas 2D');
}finally{await browser.close();}
