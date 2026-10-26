import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder=process.env.DUAL_SWIM_SHOTS??'screenshots/dual-swim-v02';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__?.playUI);
 await page.evaluate(async()=>{const a=window.__LINGHU__;a.playUI.formal=true;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();});
 async function frame(seconds=0){return page.evaluate(seconds=>{
  const a=window.__LINGHU__,g=a.game;for(let t=0;t<seconds-1e-8;t+=1/60){const dt=Math.min(1/60,seconds-t);g.advance(dt,a.input.drawing);a.input.update(dt);a.view.update(g,a.input,dt,60,dt);}
  for(const e of g.drain())a.view.event(e);a.view.update(g,a.input,0,60,0);a.view.ui.hud.visible=false;a.view.ui.counter.visible=false;a.hualingUI.root.visible=false;a.view.hualing.compactUI=true;a.playUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.brushUpgradeUI.compactUI=true;a.brushUpgradeUI.update();a.app.render();
  const m=g.hualing.upgrades.dual;return{level:m.level,clock:m.clock,opacity:m.opacity,drawing:a.input.drawing,poses:m.sides.map(s=>m.geometry(s,g.hualing.bounds)),visible:a.view.brushUpgrades.dual.root.visible,gl:a.app.renderer.gl.getError()};
 },seconds);}
 async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.move(p.x,p.y);}
 async function reset(level){await page.evaluate(level=>{const a=window.__LINGHU__,g=a.game;a.input.cancel();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;g.hualing.journey.autoEvents=false;g.enemies=[];g.hualing.upgrades.setLevel('splash',level);a.view.begin();},level);await frame();}
 for(const level of [3,4]){
  await reset(level);await move(350,610);await page.mouse.down();const first=await frame(.2);assert.equal(first.opacity,1);assert.equal(first.poses.length,2);
  await page.screenshot({path:`${folder}/lv${level}-held-020.png`});const later=await frame(.8);assert.equal(later.opacity,1);assert.ok(later.drawing);
  assert.ok(later.poses[0].some((p,i)=>Math.hypot(p.x-first.poses[0][i].x,p.y-first.poses[0][i].y)>3),'body continues swimming with zero pointer moves');await page.screenshot({path:`${folder}/lv${level}-held-100.png`});
  const paused=await frame();await page.evaluate(()=>window.__LINGHU__.game.pause());assert.deepEqual((await frame(1)).poses,paused.poses);await page.evaluate(()=>window.__LINGHU__.game.pause());
  const head=later.poses[0].at(-1);await move(600,610);const immediate=await frame();assert.deepEqual(immediate.poses[0].at(-1),head,'fast pointer move cannot teleport swimming head');const followed=await frame(.1);assert.ok(Math.hypot(followed.poses[0].at(-1).x-head.x,followed.poses[0].at(-1).y-head.y)<50);await page.screenshot({path:`${folder}/lv${level}-fast-drag.png`});
  await page.mouse.up();const released=await frame(.6);assert.equal(released.opacity,0);assert.ok(released.poses.every(p=>p.length===0));assert.equal(released.gl,0);results.push({level,held:first,afterHold:later,afterFastDrag:followed});
 }
 if(process.env.CAPTURE_SWIM==='1')for(const level of [3,4]){
  await reset(level);await move(350,610);await page.mouse.down();await frame(.3);const frames=`${folder}/lv${level}-frames`;await mkdir(frames,{recursive:true});
  for(let i=0;i<64;i++){assert.equal((await frame(.05)).gl,0);await page.screenshot({path:`${frames}/frame-${String(i).padStart(3,'0')}.png`});}
  await page.mouse.up();await frame(.6);
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));console.log('PASS real-pointer Lv3/Lv4: stationary pointer-down summons, full-body traveling bends, constant cadence, pause, release fade and WebGL');
}finally{await browser.close();}
