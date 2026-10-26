import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder=process.env.INK_COMPANION_SHOTS??'screenshots/ink-companions';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__?.playUI);
 await page.evaluate(async()=>{const a=window.__LINGHU__;a.playUI.formal=true;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();});
 async function frame(seconds=0){return page.evaluate(seconds=>{
  const a=window.__LINGHU__,g=a.game;for(let t=0;t<seconds-1e-8;t+=1/60){const dt=Math.min(1/60,seconds-t);g.advance(dt,a.input.drawing);a.input.update(dt);a.view.update(g,a.input,dt,60,dt);}
  for(const e of g.drain())a.view.event(e);a.view.update(g,a.input,0,60,0);a.view.ui.hud.visible=false;a.view.ui.counter.visible=false;a.hualingUI.root.visible=false;a.view.hualing.compactUI=true;a.playUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.brushUpgradeUI.compactUI=true;a.brushUpgradeUI.update();a.app.render();
  const m=g.hualing.upgrades,c=m.trail.companions;return{level:m.levels.trail,panel:m.panel,time:c.time,units:c.units.map(u=>({x:u.x,y:u.y,id:u.id,large:u.large,phase:u.phase,age:u.age})),hp:g.enemies.map(e=>e.hp),gl:a.app.renderer.gl.getError(),ground:m.trail.segments.length};
 },seconds);}
 async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});}
 async function move(x,y){const p=await point(x,y);await page.mouse.move(p.x,p.y);}
 async function click(x,y){const p=await point(x,y);await page.mouse.click(p.x,p.y);await frame();}
 async function shot(name){const state=await frame();assert.equal(state.gl,0);await page.screenshot({path:`${folder}/${name}.png`});results.push({name,...state});}
 async function reset(){await page.evaluate(()=>{const a=window.__LINGHU__,g=a.game;a.input.cancel();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;g.hualing.journey.autoEvents=false;g.enemies=[];a.view.begin();});await frame();return page.evaluate(()=>({...window.__LINGHU__.game.hualing.bounds}));}
 async function stroke(i=0){const y=720+i*25;await move(100,y);await page.mouse.down();for(let x=120;x<=340;x+=20){await move(x,y);await frame(.008);}await page.mouse.up();await frame(.46);}
 for(let level=1;level<=4;level++){
  const b=await reset(),header=await page.evaluate(()=>window.__LINGHU__.view.ui.hud.y);await click(110,header+28);assert.equal((await frame()).panel,'custom');
  const top=b.top+35;await click(268+level*82,top+124+3*82);assert.equal((await frame()).level,level);await shot(`lv${level}-upgrade`);await click(560,top+459);
  for(let i=0;i<5;i++)await stroke(i);const family=await frame();assert.equal(family.units.length,level+1);assert.equal(family.units.filter(u=>u.large>0).length,level>=3?1:0);await shot(`lv${level}-family`);
  await page.evaluate(()=>{const g=window.__LINGHU__.game;for(const p of [{x:480,y:540},{x:560,y:660},{x:230,y:440}]){const e=g.spawn('oni',p);e.hp=e.maxHp=10000;e.speed=0;}});
  const before=await frame();await frame(2.5);assert.ok((await frame()).hp.some(h=>h<10000),'companions must really chase and damage enemies after release');await shot(`lv${level}-battle`);
  await page.evaluate(()=>window.__LINGHU__.game.pause());const paused=await frame();await frame(1);assert.deepEqual((await frame()).units,paused.units);await page.evaluate(()=>window.__LINGHU__.game.pause());
  if(level===4){await page.evaluate(()=>{const a=window.__LINGHU__;a.view.inkTrail.update(a.game.hualing.upgrades.trail,true,a.game.hualing.bounds,true);a.app.render();});assert.equal((await frame()).gl,0);await shot('lv4-low-quality');}
  await frame(14);assert.equal((await frame()).units.length,0);assert.equal((await frame()).ground,0);assert.ok(before.time>0);
 }
 await page.setViewportSize({width:375,height:667});await reset();await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.setLevel('trail',4));for(let i=0;i<5;i++)await stroke(i);await shot('small-screen-family');
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.hualing.upgrades.reset();a.action('interactionPractice');a.app.ticker.stop();});await frame();assert.equal(await page.evaluate(()=>window.__LINGHU__.view.inkTrail.root.visible),false);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));console.log('PASS real-pointer ink companions: custom UI 1–4, open strokes summon, bounded families, large guardians, autonomous post-release damage, pause, expiry, low quality, small screen, old modes and WebGL');
}finally{await browser.close();}
