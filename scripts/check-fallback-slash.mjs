import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/fallback-slash';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:430,height:932}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
async function draw(points){
 const mapped=await page.evaluate(async points=>{const {gameViewport}=await import('/src/platform/viewport.ts'),r=window.__LINGHU__.app.canvas.getBoundingClientRect(),v=gameViewport(r.width,r.height);return points.map(p=>({x:r.left+v.x+p.x*v.width/720,y:r.top+v.y+p.y*v.height/1280}));},points);
 await page.mouse.move(mapped[0].x,mapped[0].y);await page.mouse.down();for(const p of mapped.slice(1))await page.mouse.move(p.x,p.y);await page.mouse.up();
}
async function step(seconds){return page.evaluate(seconds=>{const a=window.__LINGHU__;for(let time=0;time<seconds-1e-8;time+=1/60){const dt=Math.min(1/60,seconds-time);a.game.advance(dt);a.input.update(dt);for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,dt,60,dt);}a.view.update(a.game,a.input,0,60,0);a.practiceUI.root.y=a.view.ui.footer.y;a.practiceUI.update();a.app.render();return {casts:a.game.freeSlashes.totalCasts,live:a.game.freeSlashes.items.length,formal:a.game.formalCasts,skills:a.game.skills.map(s=>s.rune),traces:a.game.interactions.traces.length,ink:a.game.ink.currentInk,cost:a.game.ink.last.cost,refund:a.game.ink.last.refund,fallback:a.input.last?.fallback??false,reason:a.input.last?.reason,hp:a.game.enemies.map(e=>e.hp),glError:a.app.renderer.gl?.getError()??0};},seconds);}
async function reset(experimental=true){await page.evaluate(experimental=>{const a=window.__LINGHU__;a.input.cancel();a.game.start(false,true,false,experimental);a.game.director.disabled=true;a.game.ink.setUnlimited(false);a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;a.view.ui.show(a.game.state,a.game);a.practiceUI.reset();for(const p of [{x:480,y:600},{x:360,y:600}]){const e=a.game.spawn('oni',p);e.speed=0;e.ai='Recovery';e.stateAge=-100;}},experimental);await step(0);}
async function capture(name){const state=await step(0);assert.equal(state.glError,0);results.push({name,...state});await page.locator('#app').screenshot({path:`${folder}/${name}.png`});return state;}
const arc=Array.from({length:45},(_,i)=>{const t=-Math.PI/2+i/44*Math.PI;return {x:360+Math.cos(t)*120,y:600+Math.sin(t)*120};});
try{
 await page.goto('http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const viewport of [{width:430,height:932},{width:375,height:667},{width:390,height:844}]){
  await page.setViewportSize(viewport);await reset();await draw(arc);
  const initial=await capture(`release-${viewport.width}`);assert.equal(initial.fallback,true);assert.equal(initial.casts,1);assert.equal(initial.formal,0);assert.equal(initial.refund,0);assert.deepEqual(initial.skills,[]);assert.deepEqual(initial.hp,[240,240]);
  await step(.045);await capture(`sweep-${viewport.width}`);await step(.08);const hit=await capture(`hit-${viewport.width}`);assert.deepEqual(hit.hp,[210,240]);assert.equal(hit.traces,0);
  await step(.14);await capture(`tail-${viewport.width}`);await step(.1);assert.equal((await step(0)).live,0);
 }
 await reset();await draw([{x:200,y:590},{x:500,y:596},{x:220,y:590},{x:510,y:598},{x:200,y:592}]);assert.equal((await step(0)).casts,1);await step(.12);await capture('retrace');
 await reset();await draw([{x:300,y:500},{x:302,y:501}]);assert.equal((await step(0)).casts,0);assert.equal((await step(0)).cost,0);
 await reset();await draw(Array.from({length:24},(_,i)=>({x:180+i*14,y:650})));const formal=await step(0);assert.equal(formal.casts,0);assert.equal(formal.formal,1);assert.deepEqual(formal.skills,['line']);
 await reset(false);await draw([{x:200,y:590},{x:500,y:596},{x:220,y:590},{x:510,y:598},{x:200,y:592}]);assert.equal((await step(0)).casts,0);assert.deepEqual((await step(0)).skills,[]);await capture('old-practice-failure');
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));console.log(`PASS fallback browser: actual pointer curve, spatial hit/miss, finite ink/no refund, retrace, formal priority, short touch, old practice, 3 viewports, ${results.length} captures, no page/WebGL errors`);
}finally{await browser.close();}
