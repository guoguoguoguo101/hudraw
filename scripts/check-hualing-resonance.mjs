import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5175';
const folder='screenshots/hualing-resonance';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],shots=[];
page.on('pageerror',e=>errors.push(e.message));
async function frame(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__,render=(dt=0)=>{
  a.input.minY=Math.max(175,a.view.ui.hud.y+220);a.input.maxY=990+a.view.ui.footer.y;
  a.game.interactions.bounds={left:0,right:720,top:a.input.minY,bottom:a.input.maxY};
  a.game.hualing.bounds={left:26,right:694,top:Math.max(a.input.minY+30,280+a.view.ui.hud.y),bottom:a.input.maxY-28};
  for(const e of a.game.drain())a.view.event(e);
  a.view.update(a.game,a.input,dt,60,dt);a.hualingUI.update(a.view.ui.footer.y);a.practiceUI.update();a.app.render();
 };
 for(let t=0;t<seconds-1e-9;t+=1/60){const dt=Math.min(1/60,seconds-t);a.game.advance(dt,a.input.drawing);render(dt);}render();
 const m=a.game.hualing,s=m.sceneSeal;return {phase:s.phase,progress:s.progress,pointer:s.dragPointer,casts:a.game.casts,fallbacks:a.game.freeSlashes.totalCasts,gl:a.app.renderer.gl.getError()};
 },seconds);}
async function position(p){return page.evaluate(async p=>{
 const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);
 return {x:r.left+v.x+p.x*v.scale,y:r.top+v.y+p.y*v.scale};
 },p);}
async function move(p){const c=await position(p);await page.mouse.move(c.x,c.y);}
async function click(p){await move(p);await page.mouse.down();await page.mouse.up();await frame();}
async function draw(points){await move(points[0]);await page.mouse.down();for(const p of points.slice(1))await move(p);await page.mouse.up();return frame();}
async function shot(name){const state=await frame();assert.equal(state.gl,0);await page.screenshot({path:`${folder}/${name}.png`});shots.push({name,...state});return state;}
async function paths(){return page.evaluate(()=>{
 const m=window.__LINGHU__.game.hualing,c=m.sceneSeal.center(m.bounds);
 return m.sceneSeal.paths.map(path=>path.map(p=>({x:p.x+c.x,y:p.y+c.y})));
 });}
function sampled(path){const points=[];for(let i=1;i<path.length;i++)for(let j=0;j<8;j++)points.push({x:path[i-1].x+(path[i].x-path[i-1].x)*j/8,y:path[i-1].y+(path[i].y-path[i-1].y)*j/8});points.push(path.at(-1));return points;}
async function reset(){await page.evaluate(()=>{
 const a=window.__LINGHU__;a.input.cancel();a.game.hualing.reset();a.game.hualing.frozen=true;a.game.skills=[];a.game.freeSlashes.clear();a.game.enemies=[];a.game.director.disabled=true;a.game.seedHualingEnemies();for(const e of a.game.enemies)e.speed=0;
 a.view.entrance.y=665;a.view.entrance.scale=.32;a.view.animator.clear();a.hualingUI.reset();
 });await frame();}
async function selectScene(index){const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);await click({x:91+index*122,y:1017+footer});}
const circle=(p,r)=>Array.from({length:81},(_,i)=>({x:p.x+Math.cos(i/80*Math.PI*2)*r,y:p.y+Math.sin(i/80*Math.PI*2)*r}));
async function rewardRelease(name){
 const data=await page.evaluate(()=>{const a=window.__LINGHU__,s=a.game.hualing.sceneSeal;a.game.skills=[];a.game.freeSlashes.clear();a.game.enemies=[];const target=s.center(a.game.hualing.bounds),slot=s.slot(a.game.hualing.bounds);const e=a.game.spawn('oni',{x:target.x+40,y:target.y});e.speed=0;e.ai='Approach';return {target,slot,damage:s.damage};});
 await move(data.slot);await page.mouse.down();await move(data.target);await shot(name+'-target');await page.mouse.up();await frame(.25);await shot(name+'-release');return data;
}
try{
 await page.goto(`${base}/?qa=1&mode=hualing`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await reset();
 await shot('01-scene-390');let guides=await paths();
 // Start from a far endpoint, reverse direction; the same real stroke still casts a line.
 const partial=await draw(sampled([guides[0].at(-1),guides[0].at(-2)]));assert.ok(partial.progress>.05&&partial.progress<.4);assert.equal(partial.casts,1);
 await shot('02-partial-reverse');const repeated=await draw(sampled([guides[0].at(-2),guides[0].at(-1)]));assert.equal(repeated.progress,partial.progress);
 const off=await draw([{x:65,y:760},{x:100,y:720},{x:145,y:780},{x:195,y:730}]);assert.equal(off.progress,partial.progress);assert.ok(off.fallbacks>0);
 await page.evaluate(()=>window.__LINGHU__.action('pause'));await frame(.5);assert.equal((await frame()).progress,partial.progress);await page.evaluate(()=>{window.__LINGHU__.action('resume');window.__LINGHU__.app.ticker.stop();});await frame();
 // Continue at a different, disconnected section; no required start point or order.
 await draw(sampled([...guides[1]].reverse()));await shot('03-disconnected-progress');
 await draw(sampled(guides[2]));await draw(sampled(guides[0]));assert.equal((await frame()).phase,'collecting');await frame(.4);await shot('04-card-collecting');
 await frame(.6);assert.equal((await frame()).phase,'stored');await shot('05-card-stored');
 let slot=await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing;return m.sceneSeal.slot(m.bounds);});
 await click(slot);assert.equal((await frame()).phase,'stored');
 await move(slot);await page.mouse.down();await move({x:360,y:700});await page.evaluate(()=>window.__LINGHU__.action('pause'));await page.mouse.up();assert.equal((await frame()).phase,'stored');await page.evaluate(()=>{window.__LINGHU__.action('resume');window.__LINGHU__.app.ticker.stop();});await frame();
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.skills=[];a.game.freeSlashes.clear();a.game.enemies=[];const c=a.game.hualing.sceneSeal.center(a.game.hualing.bounds);for(const x of [c.x,650]){const e=a.game.spawn('oni',{x,y:c.y});e.speed=0;e.ai='Approach';}});
 const target=await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing;return m.sceneSeal.center(m.bounds);});
 await move(slot);await page.mouse.down();await move(target);await shot('06-drag-preview');await page.mouse.up();assert.equal((await frame()).phase,'spent');await frame(.25);await shot('07-release');
 const hp=await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>({hp:e.hp,maxHp:e.maxHp})));assert.equal(hp[0].hp,hp[0].maxHp-120);assert.equal(hp[1].hp,hp[1].maxHp);
 await frame(.4);assert.deepEqual(await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>e.hp)),hp.map(e=>e.hp));
 const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);await click({x:608,y:1017+footer});assert.equal((await frame()).phase,'repairing');assert.equal((await frame()).progress,0);
 for(const [width,height] of [[375,667],[430,932]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await reset();guides=await paths();
  await shot(`08-scene-${width}`);await draw(sampled(guides[2]));assert.ok((await frame()).progress>0);await shot(`09-partial-${width}`);
 }
 // Selected old cards still work and never erase passive scene coverage.
 const before=(await frame()).progress;const footer2=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);await click({x:96,y:1090+footer2});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.selected),'dragon');
 await click({x:270,y:1228+footer2});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.selected),null);assert.equal((await frame()).progress,before);
 await page.evaluate(()=>{window.__LINGHU__.action('restart');window.__LINGHU__.app.ticker.stop();});assert.equal((await frame()).progress,0);
 // Three large-gesture prototypes use the actual dock tabs and ordinary game input.
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await reset();
 await selectScene(1);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.sceneSeal.mode),'chain');guides=await paths();await shot('10-chain-ready');
 await draw(sampled(guides[0]));assert.ok((await frame()).progress>.3);await frame(.12);await shot('11-chain-cut');
 for(const path of guides.slice(1))await draw(sampled(path));assert.equal((await frame()).phase,'collecting');await frame(1);await shot('12-chain-card');
 await rewardRelease('13-chain');assert.equal((await frame()).phase,'spent');assert.equal(await page.evaluate(()=>window.__LINGHU__.game.enemies[0].hp),80);
 await selectScene(2);await shot('14-fire-ready');
 const small=await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing,s=m.sceneSeal,c=s.center(m.bounds),p=s.flames[0];return {x:c.x+p.x,y:c.y+p.y};});
 await draw(circle(small,45));assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.sceneSeal.power),1);await frame(1);await shot('15-fire-small-card');
 await selectScene(2);const fireCenter=await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing;return m.sceneSeal.center(m.bounds);});await draw(circle(fireCenter,230));assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.sceneSeal.power),5);
 await frame(.3);await shot('16-fire-gather');await frame(.7);await shot('17-fire-strong-card');await rewardRelease('18-fire');assert.equal(await page.evaluate(()=>window.__LINGHU__.game.enemies[0].hp),30);
 await selectScene(3);await shot('19-beast-ready');guides=await paths();await draw(sampled([...guides[1]].reverse()));assert.ok((await frame()).progress>.4);await shot('20-beast-partial');
 await page.evaluate(()=>window.__LINGHU__.action('pause'));await frame(.2);const beastPartial=(await frame()).progress;await page.evaluate(()=>{window.__LINGHU__.action('resume');window.__LINGHU__.app.ticker.stop();});await frame();assert.equal((await frame()).progress,beastPartial);
 await draw(sampled(guides[0]));assert.equal((await frame()).phase,'collecting');await frame(.25);await shot('21-beast-awake');await frame(.75);await shot('22-beast-card');
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.sceneSeal.beast.alive),false);await rewardRelease('23-beast');assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.sceneSeal.beast.alive),true);await frame(2);await shot('24-beast-hunting');assert.ok(await page.evaluate(()=>window.__LINGHU__.game.enemies[0].hp<240));
 await selectScene(1);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.sceneSeal.beast.alive),false);
 for(const [width,height] of [[375,667],[430,932]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await reset();
  for(const [index,name] of [[1,'chain'],[2,'fire'],[3,'beast']]){await selectScene(index);await shot(`25-${name}-${width}`);}
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({shots,errors},null,2));
 console.log('PASS scene resonance browser: seal, chain cuts, small/big fire circles and power, giant beast repair/collect/summon/hunt, real card drops and damage, pause, mode switching, reset, 375/390/430 layouts, legacy selector isolation, no page/WebGL errors');
}finally{await browser.close();}
