import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/collected-talismans';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});}
async function click(x,y){const p=await point(x,y);await page.mouse.click(p.x,p.y);}
async function clickKind(kind){const z=await page.evaluate(kind=>window.__LINGHU__.collectedUI.zones.find(z=>z.kind===kind),kind);assert.ok(z,kind+' appears in shared dock');await click(z.x+z.w/2,z.y+z.h/2);}
async function frame(seconds=0){return page.evaluate(seconds=>{const a=window.__LINGHU__,g=a.game;for(let t=0;t<seconds-1e-8;t+=1/60){const dt=Math.min(1/60,seconds-t);g.advance(dt,a.input.drawing);a.input.update(dt);a.view.update(g,a.input,dt,60,dt);}for(const e of g.drain())a.view.event(e);a.view.update(g,a.input,0,60,0);a.view.ui.hud.visible=false;a.view.ui.counter.visible=false;a.hualingUI.root.visible=false;a.view.hualing.compactUI=true;a.playUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.brushUpgradeUI.update(a.view.ui.hud.y);a.mountainUI.update(a.view.ui.hud.y,a.view.ui.footer.y);a.collectedUI.update(a.view.ui.hud.y,a.view.ui.footer.y,a.mountainUI.opened);a.app.render();return{gl:a.app.renderer.gl.getError(),counts:g.collected.counts,total:g.collected.total,casts:g.collected.casts.map(c=>({kind:c.kind,age:c.age,stage:c.stage})),selected:g.collected.selected,drawing:a.input.drawing,ink:g.ink.currentInk};},seconds);}
async function setup(mode){return page.evaluate(mode=>{const a=window.__LINGHU__,g=a.game;a.input.cancel();if(mode==='campaign'){a.beginMountain(0);a.mountainUI.opened=false;}else g.start(false,true,false,false,true);g.director.disabled=true;g.campaign.spawn=999;g.hualing.frozen=true;g.hualing.journey.autoEvents=false;g.enemies=[];g.ink.setAmount(0);a.playUI.formal=true;a.brushUpgradeUI.compactUI=true;a.view.begin();return{footer:a.view.ui.footer.y,header:a.view.ui.hud.y};},mode);}
try{
 await page.goto((process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5280')+'/?mode=hualing&qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.collectedUI);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 async function pickup(kind,x=360){await page.evaluate(({kind,x})=>{const g=window.__LINGHU__.game;g.collected.drop(g,{x,y:g.hualing.bounds.top+140},kind);},{kind,x});await frame();const p=await page.evaluate(()=>window.__LINGHU__.game.collected.pickups.at(-1));await click(p.x,p.y);await frame();}
 async function dock(){return page.evaluate(()=>window.__LINGHU__.collectedUI.zones.filter(z=>z.kind!=='refill'));}
 for(const mode of ['sandbox','campaign']){
  await setup(mode);await frame();assert.equal((await dock()).length,0);assert.equal((await frame()).total,0);await page.screenshot({path:`${folder}/${mode}-empty.png`});
  for(const [i,kind]of ['pulse','dragon','flower','ward','storm'].entries()){await pickup(kind,120+i*120);}
  assert.equal((await frame()).total,5);assert.equal((await dock()).length,5);await page.screenshot({path:`${folder}/${mode}-five-owned.png`});
  await pickup('beast');assert.equal((await frame()).total,5);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.collected.pickups.length),1);
  await clickKind('ward');await click(5,180);assert.equal((await frame()).counts.ward,1);await clickKind('ward');await click(360,610);await frame(.3);assert.equal((await frame()).counts.ward,0);assert.equal((await dock()).length,4);
  const p=await page.evaluate(()=>window.__LINGHU__.game.collected.pickups[0]);await click(p.x,p.y);await frame();assert.equal((await frame()).counts.beast,1);assert.equal((await frame()).total,5);
  results.push({mode,state:await frame()});
 }
 for(const kind of ['pulse','dragon','flower','thunder','beast','crab','heal','ward','storm']){
  await setup('campaign');await frame();await page.evaluate(()=>window.__LINGHU__.game.life=50);await pickup(kind);assert.equal((await dock()).length,1);
  await clickKind(kind);if(!['flower','thunder','heal'].includes(kind))await click(360,610);await frame(.32);const state=await frame();assert.equal(state.counts[kind],0,kind+' consumed');assert.equal(state.total,0);assert.equal((await dock()).length,0);assert.equal(state.ink,0);assert.equal(state.gl,0);await page.screenshot({path:`${folder}/used-${kind}.png`});
  const active=await page.evaluate(kind=>{const g=window.__LINGHU__.game;return kind==='pulse'?!!g.pulse.effect:kind==='dragon'?g.hualing.effects.length>0:kind==='flower'?g.hualing.petals.active:kind==='thunder'?g.hualing.thunder.active:kind==='heal'?g.life===85:kind==='beast'?!!g.hualing.scenes.find(s=>s.mode==='beast')?.beast.state:kind==='crab'?!!g.hualing.scenes.find(s=>s.mode==='crab')?.crab.state:g.collected.casts.some(c=>c.kind===kind);},kind);if(!active)console.log(JSON.stringify(await page.evaluate(()=>{const g=window.__LINGHU__.game;return {bounds:g.hualing.bounds,notice:g.hualing.notice,scenes:g.hualing.scenes.map(s=>({mode:s.mode,phase:s.phase,age:s.age,bursts:s.bursts,beast:s.beast.state,crab:s.crab.state}))};})));assert.ok(active,kind+' actual effect');results.push({kind,state});
 }
 for(const [width,height]of [[375,667],[390,844],[430,932]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await setup('campaign');await frame();
  for(const [i,kind]of ['pulse','dragon','flower','ward','storm'].entries())await pickup(kind,120+i*120);
  const zones=await dock();assert.equal(zones.length,5);assert.ok(zones.every(z=>z.x>=0&&z.x+z.w<=720));await page.screenshot({path:`${folder}/five-phone-${width}.png`});
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));console.log('PASS pickup-only inventory: empty start/dock, five owned cards, full retention, cancelled aim, all nine actual consumable effects with zero ink, mobile 375/390/430 and WebGL');
}finally{await browser.close();}
