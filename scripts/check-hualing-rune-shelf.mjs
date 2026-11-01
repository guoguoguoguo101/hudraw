import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const folder='screenshots/hualing-rune-shelf';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:430,height:932}}),errors=[],results=[];
const kinds=['pulse','dragon','flower','thunder','beast','crab','heal','ward','storm','crescent'];
page.on('pageerror',e=>errors.push(e.message));
async function coords(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});}
async function click(x,y){const p=await coords(x,y);await page.mouse.click(p.x,p.y);}
async function layout(){await page.evaluate(async()=>{const a=window.__LINGHU__;a.app.ticker.start();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();});}
async function frame(seconds=0){return page.evaluate(seconds=>{const a=window.__LINGHU__,g=a.game;for(let n=0;n<seconds-1e-8;n+=1/60){const dt=Math.min(1/60,seconds-n);g.advance(dt,a.input.drawing);a.input.update(dt);a.view.update(g,a.input,dt,60,dt);}for(const e of g.drain())a.view.event(e);a.view.update(g,a.input,0,60,0);a.hualingUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.playUI.update(a.view.ui.footer.y,a.view.ui.hud.y);const formal=a.playUI.formal||g.campaign.levelId!==null;a.view.hualing.compactUI=formal;a.brushUpgradeUI.compactUI=formal;if(formal){a.hualingUI.root.visible=false;a.view.ui.hud.visible=false;a.view.ui.counter.visible=false;}a.brushUpgradeUI.update(a.view.ui.hud.y);a.mountainUI.update(a.view.ui.hud.y,a.view.ui.footer.y);a.collectedUI.formal=formal;a.collectedUI.update(a.view.ui.hud.y,a.view.ui.footer.y,a.mountainUI.opened);a.app.render();return{zones:a.collectedUI.zones,total:g.collected.total,selected:g.collected.selected,gl:a.app.renderer.gl.getError(),oldScene:a.view.hualing.scene.root.visible};},seconds);}
async function setup(formal=false){await page.evaluate(formal=>{const a=window.__LINGHU__;a.action('hualingPractice');a.app.ticker.stop();a.playUI.formal=formal;a.game.director.disabled=true;a.game.enemiesFrozen=true;a.game.hualing.frozen=true;a.game.enemies=[];a.game.life=50;},formal);await layout();return frame();}
async function card(kind){const z=(await frame()).zones.find(z=>z.kind===kind);assert.ok(z);await click(z.x+z.w/2,z.y+z.h/2);}
try{
 await page.goto((process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5280')+'/?mode=hualing&qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.collectedUI);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const [width,height]of [[375,667],[390,844],[430,932]]){
  await page.setViewportSize({width,height});for(const formal of [false,true]){
   const state=await setup(formal);assert.equal(state.zones.length,kinds.length);assert.deepEqual(state.zones.map(z=>z.kind),kinds);assert.equal(state.total,0);assert.equal(state.oldScene,false);assert.equal(state.gl,0);
   const rects=await Promise.all(state.zones.map(z=>coords(z.x+z.w,z.y+z.h)));assert.ok(rects.every(p=>p.x<=width+.5&&p.y<=height+.5));assert.equal(new Set(state.zones.map(z=>z.y)).size,2);
   const labels=await page.evaluate(()=>window.__LINGHU__.hualingUI.root.children.filter(c=>typeof c.text==='string').map(c=>c.text).join('|'));assert.ok(!/领虎|领蟹|封印|断链|收火|掉符试放|示范/.test(labels));
   await page.screenshot({path:`${folder}/${formal?'formal':'test'}-${width}.png`});
  }
 }
 await page.setViewportSize({width:430,height:932});
 for(const kind of kinds){
  await setup();await card(kind);if(!['flower','thunder','heal','crescent'].includes(kind))await click(360,600);const state=await frame(.2);assert.equal(state.total,0);assert.equal(state.zones.length,kinds.length);
  const effect=await page.evaluate(kind=>{const g=window.__LINGHU__.game;return kind==='crescent'?g.collected.crescent.active:kind==='pulse'?!!g.pulse.effect:kind==='dragon'?g.hualing.effects.length>0:kind==='flower'?g.hualing.petals.active:kind==='thunder'?g.hualing.thunder.active:kind==='heal'?g.life===85:kind==='beast'?!!g.hualing.scenes.find(s=>s.mode==='beast')?.beast.state:kind==='crab'?!!g.hualing.scenes.find(s=>s.mode==='crab')?.crab.state:g.collected.casts.some(c=>c.kind===kind);},kind);assert.ok(effect,kind+' real effect without claiming');results.push(kind);
 }
 await setup();await card('ward');await click(5,180);assert.equal((await frame()).selected,null);assert.equal((await frame()).zones.length,kinds.length);
 await card('dragon');await page.evaluate(()=>window.__LINGHU__.action('restart'));await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await layout();await frame();await card('thunder');assert.ok(await page.evaluate(()=>window.__LINGHU__.game.hualing.thunder.active),'restart while aiming does not trap the next pointer');
 for(const chapter of ['sea','palace','snow','valley']){await page.evaluate(chapter=>window.__LINGHU__.game.changeHualingChapter(chapter),chapter);assert.equal((await frame()).zones.length,kinds.length);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.runeShelf),true);assert.equal((await frame()).oldScene,false);}
 await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.beginMountain(0);a.mountainUI.opened=false;a.app.ticker.stop();});await layout();assert.equal((await frame()).zones.length,0);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.collected.preview(window.__LINGHU__.game,'thunder',{x:360,y:600})),false);
 await page.evaluate(()=>{const g=window.__LINGHU__.game;for(const k of ['pulse','dragon','flower','ward','storm'])g.collected.grant(k);});assert.equal((await frame()).zones.length,5);await page.screenshot({path:`${folder}/campaign-unchanged.png`});
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({sizes:[375,390,430],styles:['test','formal'],realEffects:results,campaignPickupOnly:true,errors},null,2));console.log('PASS practice shelf: ten permanent cards in two rows, zero inventory/claiming, all ten real effects, no legacy task art/controls, cancel/restart/chapter switches, 375/390/430 and both styles, campaign five-card pickup-only isolation');
}finally{await browser.close();}
