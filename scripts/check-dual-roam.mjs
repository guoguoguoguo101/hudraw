import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/dual-roam-lively';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.move(p.x,p.y);}
async function frame(seconds){return page.evaluate(seconds=>{const a=window.__LINGHU__;for(let i=0;i<Math.round(seconds*120);i++)a.game.advance(1/120,a.input.drawing);for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,1/60,60,1/60);a.brushUpgradeUI.update(a.view.ui.hud.y);a.app.render();const d=a.game.hualing.upgrades.dual;return{heads:d.sides.map(s=>({...s.head})),targets:d.sides.map(s=>s.roam?.targetId??null),hp:a.game.enemies.map(e=>({x:e.x,y:e.y,hp:e.hp})),drawing:d.drawing,opacity:d.opacity,paths:d.sides.map(s=>s.path.length),gl:a.app.renderer.gl.getError()};},seconds);}
try{
 await page.goto(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5177/?mode=hualing&qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.game);
 for(const [width,height] of [[390,844],[375,667],[430,932]]){
  await page.setViewportSize({width,height});await settle();
  await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.action('restart');a.playUI.formal=true;a.game.director.disabled=true;a.game.hualing.frozen=true;a.game.enemies=[];a.game.hualing.upgrades.setLevel('splash',4);});await settle();await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
  const bounds=await page.evaluate(()=>{const g=window.__LINGHU__.game,b=g.hualing.bounds;g.enemies=[];for(const [u,v] of [[.18,.2],[.8,.32],[.22,.78],[.77,.75]]){const e=g.spawn('ink',{x:b.left+(b.right-b.left)*u,y:b.top+(b.bottom-b.top)*v},'paper-rabbit');e.hp=e.maxHp=1000;e.ai='Hit';e.stateAge=-100;e.speed=0;}return{...b};});
  const origin={x:360,y:bounds.bottom-100};await move(origin.x,origin.y);await page.mouse.down();
  const poses=[];
  for(const [i,seconds] of [.8,1.2,2.4].entries()){const state=await frame(seconds);assert.equal(state.drawing,true);assert.equal(state.gl,0);poses.push(state);await page.screenshot({path:`${folder}/roam-${i}-${width}.png`});}
  assert.ok(poses.some(s=>s.hp.some(e=>e.hp<1000&&Math.hypot(e.x-origin.x,e.y-origin.y)>150)),'a stationary brush lets dragons attack along distant real flight paths');
  assert.ok(poses.some(s=>s.heads.some((p,i)=>Math.hypot(p.x-poses[0].heads[i].x,p.y-poses[0].heads[i].y)>100)),'dragons travel across the field rather than hovering at the pointer');
  const before=await frame(0);await page.evaluate(()=>window.__LINGHU__.game.pause());const paused=await frame(.7);assert.deepEqual(paused.heads,before.heads);await page.evaluate(()=>window.__LINGHU__.game.pause());
  await page.mouse.up();const released=await frame(0),faded=await frame(.7);assert.deepEqual(faded.hp,released.hp,'release immediately ends autonomous damage');assert.equal(faded.opacity,0);assert.ok(faded.paths.every(n=>n===0));results.push({width,poses,release:faded});
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));console.log('PASS real pointer: Lv4 full-field flight from stationary brush, distant path damage, independent movement, pause freeze, release/fade cleanup, three phone sizes and no WebGL/page errors');
}finally{await browser.close();}
