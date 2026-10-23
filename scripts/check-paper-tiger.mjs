import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/paper-tiger';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],shots=[];
const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});}
async function move(x,y){const p=await point(x,y);await page.mouse.move(p.x,p.y);}
async function click(x,y){await move(x,y);await page.mouse.down();await page.mouse.up();}
async function drag(a,b){await move(a.x,a.y);await page.mouse.down();for(let i=1;i<=12;i++)await move(a.x+(b.x-a.x)*i/12,a.y+(b.y-a.y)*i/12);await page.mouse.up();}
async function step(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__,render=(dt=0)=>{a.input.minY=Math.max(175,a.view.ui.hud.y+220);a.input.maxY=Math.min(1180,756+a.view.ui.footer.y);a.game.interactions.bounds={left:0,right:720,top:a.input.minY,bottom:a.input.maxY};for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,dt,60,dt);a.practiceUI.root.y=a.view.ui.footer.y;a.practiceUI.update();const v=a.view.ui.brushViewport;a.relicUI.update(a.view.ui.footer.y,v.top,v.top+v.height);a.app.render();};
 for(let t=0;t<seconds-1e-9;t+=1/60){const dt=Math.min(1/60,seconds-t);a.game.advance(dt);a.input.update(dt);render(dt);}render();const r=a.game.functionalRelics.paperTiger;return {t:r.state?structuredClone(r.state):null,uses:r.uses,kills:a.game.kills,casts:a.game.formalCasts,ink:a.game.ink.currentInk,gl:a.app.renderer.gl.getError()};
 },seconds);}
async function shot(name){const s=await step();assert.equal(s.gl,0);shots.push({name,...s});await page.screenshot({path:`${folder}/${name}.png`});return s;}
try{
 await page.goto('http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 const entry=await page.evaluate(()=>window.__LINGHU__.view.ui.zones.find(z=>z.action==='interactionPractice'));await click(entry.x+entry.w/2,entry.y+entry.h/2);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const [width,height] of [[390,844],[375,667],[430,932]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.evaluate(()=>{const a=window.__LINGHU__;a.game.start(false,true,false,true);a.game.director.disabled=true;a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;a.relicUI.reset();a.practiceUI.reset();for(const p of [{x:480,y:460},{x:550,y:530},{x:220,y:430}]){const e=a.game.spawn('ink',p);e.ai='Approach';e.speed=0;e.age=1;}});await step();
  const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y),icon={x:90,y:815+footer};
  await click(icon.x,icon.y);assert.equal((await step()).uses,2);
  await move(icon.x,icon.y);await page.mouse.down();await move(340,520);await shot(`drag-${width}`);await page.mouse.up();
  assert.equal((await step()).uses,1);assert.equal((await step()).casts,0);assert.equal((await step()).ink,100);
  await step(.2);await shot(`unfold-${width}`);await step(.42);const wind=await shot(`windup-${width}`);assert.equal(wind.t.phase,'windup');
  await step(.32);const leap=await shot(`leap-${width}`);assert.equal(leap.t.phase,'leap');
  await step(.32);const land=await shot(`landing-${width}`);assert.equal(land.t.phase,'land');assert.equal(land.kills,1);
  // Existing UI remains independently usable while the tiger is alive.
  await click(243,919+footer);const frozenBefore=await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>[e.id,e.x,e.y]));await step(1.7);for(const e of await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>[e.id,e.x,e.y])))assert.deepEqual(e,frozenBefore.find(b=>b[0]===e[0]));assert.ok((await step()).t.jumps>=2);
  const before=(await step()).t.remaining;await page.evaluate(()=>window.__LINGHU__.game.pause());await step(1);assert.equal((await step()).t.remaining,before);await page.evaluate(()=>window.__LINGHU__.game.pause());
  await drag(icon,{x:280,y:570});assert.equal((await step()).uses,1);await step(.2);await shot(`command-${width}`);
  // Ordinary rune drawing still works away from the companion and dock.
  await drag({x:130,y:650},{x:290,y:650});assert.ok((await step()).casts>0);
  await step(13);assert.equal((await step()).t,null);assert.equal((await step()).uses,1);await shot(`expired-${width}`);
  await click(625,905+footer);assert.equal((await step()).uses,2);
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({shots,errors},null,2));console.log('PASS paper tiger browser: real scene menu, three screen sizes, drag summon/cancel, unfold/windup/leap/landing, actual kills, command, rune coexistence, stop/pause, expiry/reset; no page or WebGL errors');
}finally{await browser.close();}
