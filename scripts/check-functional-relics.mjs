import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/functional-relics';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:430,height:932}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+v.x+x*v.width/720,y:r.top+v.y+y*v.height/1280};},{x,y});}
async function move(x,y){const p=await point(x,y);await page.mouse.move(p.x,p.y);}
async function click(x,y){await move(x,y);await page.mouse.down();await page.mouse.up();}
async function draw(a,b){await move(a.x,a.y);await page.mouse.down();for(let i=1;i<=12;i++)await move(a.x+(b.x-a.x)*i/12,a.y+(b.y-a.y)*i/12);await page.mouse.up();}
async function step(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__,render=(dt,world)=>{a.input.minY=Math.max(175,a.view.ui.hud.y+220);a.input.maxY=a.game.functionalRelics.enabled?Math.min(1180,756+a.view.ui.footer.y):1180;a.game.interactions.bounds={left:0,right:720,top:a.input.minY,bottom:a.input.maxY};for(const e of a.game.drain()){a.view.event(e);if(e.type==='functionalRelic'&&e.kind==='reviveStart')a.input.cancel();}a.view.update(a.game,a.input,a.game.active||['paused','upgrade','reviving'].includes(a.game.state)?world:dt,60,dt);a.practiceUI.root.y=a.view.ui.footer.y;a.practiceUI.update();const v=a.view.ui.brushViewport;a.relicUI.update(a.view.ui.footer.y,v.top,v.top+v.height);a.app.render();};
 for(let t=0;t<seconds-1e-9;t+=1/60){const dt=Math.min(1/60,seconds-t),before=a.game.clock.world;a.game.advance(dt);a.game.ink.update(a.game.lastResourceDt,a.game.active);a.input.update(dt);render(dt,a.game.clock.world-before);}render(0,0);
 const r=a.game.functionalRelics;return {state:a.game.state,uses:{...r.uses},lamp:r.lantern?{...r.lantern}:null,stop:r.stopRemaining,life:a.game.life,stroke:r.reviveStroke,ready:r.reviveReady,remaining:r.reviveRemaining,fire:a.game.burningSea.remaining,time:a.game.time,ink:a.game.ink.currentInk,enemies:a.game.enemies.map(e=>({id:e.id,x:e.x,y:e.y,age:e.age,lure:e.lureId})),gl:a.app.renderer.gl?.getError()??0};
 },seconds);}
async function capture(name){const state=await step();assert.equal(state.gl,0);results.push({name,...state});await page.screenshot({path:`${folder}/${name}.png`});return state;}
try{
 await page.goto('http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 const entry=await page.evaluate(()=>window.__LINGHU__.view.ui.zones.find(z=>z.action==='interactionPractice'));await click(entry.x+entry.w/2,entry.y+entry.h/2);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await step();
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.functionalRelics.enabled),true);
 for(const [width,height] of [[430,932],[375,667],[390,844]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.game.start(false,true,false,true);a.game.functionalRelics.levels={lantern:1,hourglass:1,soul:1};a.game.director.disabled=true;a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;a.view.ui.show(a.game.state,a.game);a.practiceUI.reset();a.relicUI.reset();for(const at of [{x:555,y:500},{x:505,y:435}]){const e=a.game.spawn('ink',at);e.ai='Approach';e.age=1;}});await step();
  const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);await capture(`dock-${width}`);
  await click(100,919+footer);assert.equal((await step()).uses.lantern,3);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.functionalRelics.placing),false);await draw({x:100,y:919+footer},{x:360,y:665});assert.equal((await step()).uses.lantern,3);await draw({x:100,y:919+footer},{x:520,y:500});const placed=await step();assert.equal(placed.uses.lantern,2);assert.ok(placed.lamp);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.formalCasts),0);
  await step(.35);const attracted=await capture(`lantern-${width}`);assert.ok(attracted.enemies.some(e=>e.lure===attracted.lamp.id));
  await click(625,905+footer);await click(510,905+footer);await step();await capture(`equipment-${width}`);
  await click(360,981);await step();
  await click(243,919+footer);const frozen=await step();assert.equal(frozen.stop,3);const before=frozen.enemies.map(e=>[e.x,e.y]);
  await draw({x:200,y:600},{x:500,y:600});const stopped=await step(.1);assert.deepEqual(stopped.enemies.map(e=>[e.x,e.y]),before);assert.equal(stopped.time,frozen.time);assert.ok(await page.evaluate(()=>window.__LINGHU__.game.skills.some(s=>s.age>0)||window.__LINGHU__.game.freeSlashes.totalCasts>0));await capture(`stop-${width}`);
  await page.evaluate(()=>{const a=window.__LINGHU__;a.action('pause');a.app.ticker.stop();});const paused=await step();await step(1);assert.equal((await step()).stop,paused.stop);await page.evaluate(()=>{const a=window.__LINGHU__;a.action('resume');a.app.ticker.stop();});await step(3);
  await click(625,905+footer);await step();
  await page.evaluate(()=>{const a=window.__LINGHU__;a.game.enemies=[];a.game.activateBurningSea();});await step(1);const fire=(await step()).fire;
  await click(565,959+footer);await step(.31);const rescue=await capture(`rescue-${width}`);assert.equal(rescue.state,'reviving');assert.equal(rescue.uses.soul,0);assert.equal(rescue.fire,fire);
  await draw({x:255,y:505},{x:465,y:505});assert.equal((await step()).stroke,1);await capture(`rescue-first-${width}`);
  await draw({x:360,y:445},{x:360,y:655});const saved=await capture(`revived-${width}`);assert.equal(saved.state,'playing');assert.equal(saved.life,30);assert.equal(saved.fire,fire);assert.equal(saved.uses.soul,0);
  await click(625,905+footer);await click(565,959+footer);await step(3.4);assert.equal((await step()).state,'lose');
  // Use the existing restart button after a failed rescue, rather than a hidden reset hook.
  await step(1.4);const restart=await page.evaluate(()=>window.__LINGHU__.view.ui.zones.find(z=>z.action==='restart'));assert.ok(restart);await click(restart.x+restart.w/2,restart.y+restart.h/2);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await step();assert.equal((await step()).uses.soul,1);
  if(width===375){await click(565,959+footer);await step(3.4);await step(1.4);const menu=await page.evaluate(()=>window.__LINGHU__.view.ui.zones.find(z=>z.action==='menu'));await click(menu.x+menu.w/2,menu.y+menu.h/2);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());assert.equal((await step()).state,'menu');}

 }
 // The other test scene and normal combat do not acquire these trial controls.
 await page.evaluate(()=>{const a=window.__LINGHU__;a.action('practice');a.app.ticker.stop();});await step();assert.equal(await page.evaluate(()=>window.__LINGHU__.game.functionalRelics.enabled),false);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));console.log('PASS functional relic browser: actual interaction-practice menu, all relics available, drag placement/cancel, enemy lure, enemy-only stop with own cast, rescue drawing/success/timeout/restart, burning-sea freeze, pause and three viewports; no page/WebGL errors');
}finally{await browser.close();}
