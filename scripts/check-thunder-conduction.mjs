import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const folder='screenshots/thunder-conduction';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:430,height:932}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});}
async function move(x,y){const p=await point(x,y);await page.mouse.move(p.x,p.y);}
async function click(x,y){const p=await point(x,y);await page.mouse.click(p.x,p.y);}
async function frame(seconds=0){return page.evaluate(seconds=>{const a=window.__LINGHU__,g=a.game;for(let n=0;n<seconds-1e-8;n+=1/60){const dt=Math.min(1/60,seconds-n);g.advance(dt,a.input.drawing);a.input.update(dt);a.view.update(g,a.input,dt,60,dt);}for(const e of g.drain())a.view.event(e);a.view.update(g,a.input,0,60,0);a.playUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.brushUpgradeUI.update(a.view.ui.hud.y);a.mountainUI.update(a.view.ui.hud.y,a.view.ui.footer.y);a.collectedUI.update(a.view.ui.hud.y,a.view.ui.footer.y,a.mountainUI.opened);a.hualingUI.root.visible=false;a.view.ui.hud.visible=false;a.view.ui.counter.visible=false;a.view.hualing.compactUI=true;a.app.render();return{remaining:g.hualing.thunder.remaining,links:g.hualing.thunder.links.map(l=>({target:l.target,age:l.age,depth:l.depth,fired:l.fired})),hp:g.enemies.map(e=>e.hp),drawing:a.input.drawing,gl:a.app.renderer.gl.getError()};},seconds);}
async function setup(mode){await page.evaluate(mode=>{const a=window.__LINGHU__,g=a.game;a.input.cancel();if(mode==='campaign'){a.beginMountain(0);a.mountainUI.opened=false;g.campaign.lastRoom=g.campaign.room;g.campaign.spawn=999;}else g.start(false,true,false,false,true);g.director.disabled=true;g.enemiesFrozen=true;g.hualing.frozen=true;g.hualing.journey.autoEvents=false;g.enemies=[];g.ink.setAmount(100);a.playUI.formal=true;a.brushUpgradeUI.compactUI=true;a.view.begin();for(const [i,p]of [{x:300,y:550},{x:430,y:600},{x:280,y:425},{x:500,y:470},{x:450,y:335},{x:650,y:850}].entries()){const e=g.spawn('ink',p,['paper-lantern','paper-moth','paper-frog'][i%3]);e.hp=e.maxHp=10000;e.speed=0;e.ai='Approach';}g.collected.drop(g,{x:360,y:750},'thunder');},mode);await frame();await click(360,750);await frame();const zone=await page.evaluate(()=>window.__LINGHU__.collectedUI.zones.find(z=>z.kind==='thunder'));assert.ok(zone);await click(zone.x+zone.w/2,zone.y+zone.h/2);const state=await frame();assert.equal(state.remaining,12);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.collected.counts.thunder),0);}
try{
 await page.goto((process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5280')+'/?mode=hualing&qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.collectedUI);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const [mode,width,height]of [['sandbox',430,932],['campaign',430,932],['campaign',375,667],['campaign',390,844]]){
  await page.setViewportSize({width,height});await setup(mode);
  await frame(.2);assert.ok((await frame()).hp.every(h=>h===10000),'no attacks while not drawing');
  await move(360,620);await page.mouse.down();let state=await frame(.1);
  assert.equal(state.drawing,true);assert.equal(state.links.length,5);assert.equal(state.hp[5],10000);assert.ok(state.hp.slice(0,4).every(h=>h<10000));assert.equal(state.gl,0);
  await page.screenshot({path:`${folder}/${mode}-${width}.png`});
  const hp=state.hp[0];await frame(.8);assert.ok((await frame()).hp[0]<hp,'stationary pointer keeps the timed conduction running');
  await move(340,600);await frame(.04);assert.ok(await page.evaluate(()=>window.__LINGHU__.game.hualing.thunder.arcs.length>0));
  await page.mouse.up();await frame(.4);state=await frame();assert.equal(state.links.length,0);const releasedHp=state.hp;await frame(.5);assert.deepEqual((await frame()).hp,releasedHp);
  await page.evaluate(()=>window.__LINGHU__.game.pause());const paused=(await frame()).remaining;await frame(.5);assert.equal((await frame()).remaining,paused);await page.evaluate(()=>window.__LINGHU__.game.pause());
  await frame(12.1);assert.equal((await frame()).remaining,0);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.thunder.links.length),0);
  results.push({mode,width,targets:5,farTargetUntouched:true,stationary:true,release:true,pause:true,expiry:true});
 }
 await page.setViewportSize({width:430,height:932});await setup('campaign');await move(360,620);await page.mouse.down();
 for(let i=0;i<24;i++){await frame(1/30);await page.screenshot({path:`${folder}/frame-${String(i).padStart(2,'0')}.png`});}
 await page.mouse.up();await frame(.5);await page.evaluate(()=>window.__LINGHU__.game.menu());assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.thunder.links.length),0);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));console.log('PASS thunder conduction: collected rune click, stationary and moving real pointer, five nearby targets, chained damage, remote exclusion, release/pause/expiry/menu, sandbox and campaign, 375/390/430 mobile, no WebGL errors');
}finally{await browser.close();}
