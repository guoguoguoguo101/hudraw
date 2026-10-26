import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const folder='screenshots/ink-carp';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:430,height:932}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function frame(t=0){await page.evaluate(t=>{const a=window.__LINGHU__;for(let elapsed=0;elapsed<t-1e-8;elapsed+=1/60)a.game.advance(Math.min(1/60,t-elapsed),a.input.drawing);for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,t,60,t);a.hualingUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.brushUpgradeUI.update(a.view.ui.hud.y);a.app.render();},t);}
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});}
async function move(x,y){const p=await point(x,y);await page.mouse.move(p.x,p.y);}
async function click(x,y){const p=await point(x,y);await page.mouse.click(p.x,p.y);await frame();}
const results=[];
try{
 await page.goto('http://127.0.0.1:5173/?mode=hualing&qa=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.director.disabled=true;a.game.hualing.frozen=true;a.playUI.formal=false;a.brushUpgradeUI.compactUI=false;a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;});await frame();
 for(let level=1;level<=4;level++){
  await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.game.enemies=[];a.game.hualing.upgrades.reset();});await frame();
  const b=await page.evaluate(()=>window.__LINGHU__.game.hualing.bounds);await click(590,b.top-1);await click(268+level*82,b.top+35+124);await click(560,b.top+35+459);
  await page.evaluate(()=>{const a=window.__LINGHU__;for(const x of [340,480]){const e=a.game.spawn('ink',{x,y:550});e.hp=e.maxHp=10000;e.speed=0;e.ai='Approach';}});await frame();
  await move(150,550);await page.mouse.down();await move(154,550);await frame();
  assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.carp.casts),1);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.carp.fishes.length),[0,1,2,3,1][level]);await frame(.18);await page.screenshot({path:`${folder}/tier-${level}-430.png`});
  const remaining=await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.carp.remaining);await page.evaluate(()=>window.__LINGHU__.game.pause());await frame(1);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.carp.remaining),remaining);await page.evaluate(()=>window.__LINGHU__.game.pause());
  for(let i=0;i<120;i++){await move(156+i,550);await frame(1/60);}
  const state=await page.evaluate(()=>{const a=window.__LINGHU__;return{level:a.game.hualing.upgrades.levels.spray,casts:a.game.hualing.upgrades.carp.casts,damaged:a.game.enemies.some(e=>e.hp<e.maxHp),gl:a.app.renderer.gl.getError()};});assert.ok(state.casts>=2);assert.equal(state.damaged,true);assert.equal(state.gl,0);results.push(state);
  await frame(.2);const stopped=await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.carp.casts);await frame(2);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.carp.casts),stopped);await page.mouse.up();await frame();
 }
 // Actual max-tier demo button and leftward giant / wave on a small phone.
 const b=await page.evaluate(()=>window.__LINGHU__.game.hualing.bounds);await click(590,b.top-1);await click(150,b.top+35+511);await move(540,550);await page.mouse.down();await move(536,550);await page.mouse.up();await frame(.24);await page.setViewportSize({width:375,height:667});await frame();await page.screenshot({path:`${folder}/cooldown-giant-375.png`});await frame(.42);assert.ok(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.carp.fish.burst));await page.screenshot({path:`${folder}/cooldown-wave-375.png`});await frame(.5);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.brushUpgrades.carp.root.visible),false);
 assert.deepEqual(errors,[]);console.log('PASS ink carp browser: four real level buttons, immediate 4px cast, tier silhouettes, held-stroke auto-repeat without hits/release, stationary stop, frozen cooldown, actual damage, demo button, leftward giant/wave, 375/430 layouts',JSON.stringify(results));
}catch(error){console.error(error);throw error;}finally{await browser.close();}
