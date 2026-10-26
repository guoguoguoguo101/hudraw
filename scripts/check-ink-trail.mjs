import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/ink-trail';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
async function frame(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__,render=(dt=0)=>{
  for(const e of a.game.drain())a.view.event(e);
  a.view.update(a.game,a.input,dt,60,dt);a.hualingUI.update(a.view.ui.footer.y);a.brushUpgradeUI.update();
 };
 for(let t=0;t<seconds-1e-8;t+=1/60){const dt=Math.min(1/60,seconds-t);a.game.advance(dt,a.input.drawing);render(dt);}render();a.app.render();
 const u=a.game.hualing.upgrades;return{levels:{...u.levels},panel:u.panel,segments:u.trail.segments.length,waves:u.trail.waves.length,styles:[...new Set(u.trail.segments.map(s=>s.style))],time:u.trail.time,charge:u.charge,gl:a.app.renderer.gl.getError()};
},seconds);}
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});}
async function move(x,y){const p=await point(x,y);await page.mouse.move(p.x,p.y);}
async function click(x,y){const p=await point(x,y);await page.mouse.click(p.x,p.y);await frame();}
async function reset(){await page.evaluate(async()=>{const a=window.__LINGHU__;a.action('restart');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();a.input.cancel();a.game.director.disabled=true;a.game.hualing.frozen=true;a.game.enemies=[];a.view.pen.liveFX.clear();});await frame();return page.evaluate(()=>({...window.__LINGHU__.game.hualing.bounds}));}
async function shot(name){const state=await frame();assert.equal(state.gl,0);await page.screenshot({path:`${folder}/${name}.png`});results.push({name,state});}
async function curve(b){const points=Array.from({length:45},(_,i)=>({x:360+Math.sin(i/44*Math.PI*2)*165,y:b.top+110+i/44*390}));await move(points[0].x,points[0].y);await page.mouse.down();for(const p of points.slice(1)){await move(p.x,p.y);await frame(.012);}await page.mouse.up();await frame(.55);return points;}
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__?.brushUpgradeUI);
 for(const [width,height] of [[390,844],[375,667],[430,932]]){
  await page.setViewportSize({width,height});let b=await reset(),top=b.top+35;
  await click(590,b.top-1);assert.equal((await frame()).panel,'custom');
  for(let level=0;level<=4;level++){await click(268+level*82,top+124+3*82);assert.equal((await frame()).levels.trail,level);}
  await shot(`custom-${width}`);await click(560,top+459);
  for(const style of ['cinnabar','maple','thunder','maple-thunder']){
   b=await reset();top=b.top+35;await click(590,b.top-1);await click(596,top+124+3*82);await click(560,top+459);
   const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);
   if(style==='maple'||style==='maple-thunder')await click(360,footer+1090);
   if(style==='thunder'||style==='maple-thunder')await click(546,footer+1090);
   const points=await curve(b);const state=await frame();assert.deepEqual(state.styles,[style]);assert.ok(state.segments>8);
   // The immediate stroke is gone; remaining ground ink still deals actual damage.
   await page.evaluate(p=>{const g=window.__LINGHU__.game;const e=g.spawn('oni',p);e.hp=1000;e.speed=0;const outside=g.spawn('oni',{x:42,y:g.hualing.bounds.top+80});outside.hp=1000;outside.speed=0;},points[22]);
   await frame(.55);const hp=await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>e.hp));assert.ok(hp[0]<1000);assert.equal(hp[1],1000);
   await shot(`${style}-${width}`);await frame(.25);assert.ok((await frame()).waves>0);await shot(`${style}-flow-${width}`);
   await page.evaluate(()=>{const h=window.__LINGHU__.game.hualing;h.petals.remaining=Math.min(h.petals.remaining,.05);h.thunder.remaining=Math.min(h.thunder.remaining,.05);});await frame(.1);assert.deepEqual((await frame()).styles,[style]);
   const before=await frame();await page.evaluate(()=>{const a=window.__LINGHU__;a.action('pause');a.app.ticker.stop();});await frame(2);assert.equal((await frame()).time,before.time);await page.evaluate(()=>{const a=window.__LINGHU__;a.action('resume');a.app.ticker.stop();});await frame(5.1);assert.equal((await frame()).segments,0);assert.equal((await frame()).waves,0);
  }
  b=await reset();top=b.top+35;await click(420,b.top-1);assert.equal((await frame()).panel,'upgrade');await shot(`growth-four-choices-${width}`);await click(360,top+396);assert.equal((await frame()).levels.trail,1);assert.equal((await frame()).panel,null);
 }
 const b=await reset();for(const level of [1,2,3,4]){await page.evaluate(level=>{const a=window.__LINGHU__;a.game.hualing.upgrades.setLevel('trail',level);a.view.pen.liveFX.clear();},level);await curve(b);await shot(`cinnabar-lv${level}`);await frame(5.2);}
 await page.evaluate(()=>{const a=window.__LINGHU__;a.action('interactionPractice');a.app.ticker.stop();});await frame();assert.equal(await page.evaluate(()=>window.__LINGHU__.view.inkTrail.root.visible),false);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));console.log('PASS real-pointer ink trails: fourth skill 0–4 tuning and growth, four talisman styles, retained post-buff appearance, persistent damage after release, flowing wave, pause/expiry, three phone layouts and old-mode isolation');
}catch(error){console.error(error);throw error;}finally{await browser.close();}
