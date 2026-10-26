import sharp from 'sharp';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/hualing-chapters';await mkdir(folder,{recursive:true});
const requests=[],timings=[],motion=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],shots=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
async function frame(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__;
 a.input.minY=Math.max(175,a.view.ui.hud.y+220);a.input.maxY=990+a.view.ui.footer.y;
 a.game.hualing.bounds={left:26,right:694,top:Math.max(a.input.minY+74,324+a.view.ui.hud.y),bottom:a.input.maxY-28};
 for(let t=0;t<seconds-1e-9;t+=1/60)a.game.advance(Math.min(1/60,seconds-t),false);
 for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,0,60,0);a.hualingUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.brushUpgradeUI.update(a.view.ui.hud.y);a.app.render();
 const m=a.game.hualing;return {chapter:m.journey.chapter,stage:m.journey.stage,name:m.journey.sceneName,event:m.sceneSeal.mode,time:m.journey.time,enemies:a.game.enemies.map(e=>({look:e.look,hp:e.hp})),gl:a.app.renderer.gl.getError()};
 },seconds);}
async function point(p){return page.evaluate(async p=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+v.x+p.x*v.scale,y:r.top+v.y+p.y*v.scale};},p);}
async function click(p){const q=await point(p);await page.mouse.click(q.x,q.y);await frame();await page.waitForFunction(()=>window.__LINGHU__.view.scrollLandscape.chapterReady);await frame();}
async function chapter(index){const y=await page.evaluate(()=>window.__LINGHU__.hualingUI.chapterBarY+18);await click({x:110+index*168,y});}
async function stage(index){const y=await page.evaluate(()=>window.__LINGHU__.hualingUI.phaseBarY+16);await click({x:316+index*104,y});}
async function shot(name){const state=await frame();assert.equal(state.gl,0);await page.screenshot({path:`${folder}/${name}.png`});shots.push({name,...state});return state;}
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5177'}/?qa=1&mode=hualing`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await frame();
 for(const [ci,id] of [[0,'valley'],[1,'sea'],[2,'palace'],[3,'snow']]){
  await chapter(ci);assert.equal((await frame()).chapter,id);
  await page.evaluate(()=>{const a=window.__LINGHU__;a.game.hualing.frozen=true;a.game.director.disabled=true;});
  if(ci)assert.ok((await frame()).enemies.every(e=>e.look.startsWith(ci===1?'sea-':ci===2?'star-':'snow-')));
  for(const si of [1,2,3]){await stage(si);assert.equal((await frame()).stage,['sunset','wind','night'][si-1]);await shot(`${id}-${si}-390`);}
  if(ci){
   const header=await page.evaluate(()=>window.__LINGHU__.view.ui.hud.y);
   await click({x:650,y:header+51});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.state),'paused');
   await page.evaluate(()=>{window.__LINGHU__.action('resume');window.__LINGHU__.app.ticker.stop();});await frame();
   await click({x:550,y:header+51});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.panel),'custom');
   const closeY=await page.evaluate(()=>window.__LINGHU__.game.hualing.bounds.top+35+459);await click({x:562,y:closeY});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.panel),null);
  }
  if(ci){
   await stage(1);const before=await page.screenshot();await frame(2);const after=await page.screenshot();
   const roi={left:10,top:90,width:370,height:560};
   const b=await sharp(before).extract(roi).removeAlpha().raw().toBuffer(),c=await sharp(after).extract(roi).removeAlpha().raw().toBuffer();let pixels=0;
   for(let i=0;i<b.length;i+=3)if(Math.abs(b[i]-c[i])+Math.abs(b[i+1]-c[i+1])+Math.abs(b[i+2]-c[i+2])>24)pixels++;
   assert.ok(pixels>1000,`${id} scenery must visibly animate`);motion.push({chapter:id,changedPixels:pixels});
   if(ci===1){const {data}=await sharp(after).extract({left:185,top:530,width:20,height:20}).removeAlpha().raw().toBuffer({resolveWithObject:true});let green=0;for(let i=1;i<data.length;i+=3)green+=data[i];assert.ok(green/(data.length/3)>70,'Ocean must remain visible beneath the moving whale');}
   await page.evaluate(()=>{window.__LINGHU__.action('pause');window.__LINGHU__.app.ticker.stop();});await frame();const pausedA=await page.screenshot();await frame(2);const pausedB=await page.screenshot();
   const pa=await sharp(pausedA).raw().toBuffer(),pb=await sharp(pausedB).raw().toBuffer();assert.ok(pa.every((v,i)=>Math.abs(v-pb[i])<=2),'Paused paper layers must stay still (allow GPU rounding)');
   await page.evaluate(()=>{window.__LINGHU__.action('resume');window.__LINGHU__.app.ticker.stop();});await frame();
  }
  // A physical pointer stroke must still damage a themed enemy.
  const target=await page.evaluate(()=>{const a=window.__LINGHU__,e=a.game.enemies[0];e.x=e.prevX=360;e.y=e.prevY=a.game.hualing.bounds.top+320;return {x:e.x,y:e.y,hp:e.hp,id:e.id};});
  const q=await point({x:target.x-60,y:target.y}),r=await point({x:target.x+60,y:target.y});await page.mouse.move(q.x,q.y);await page.mouse.down();await page.mouse.move(r.x,r.y,{steps:12});await page.mouse.up();
  assert.ok(await page.evaluate(({id,hp})=>{const e=window.__LINGHU__.game.enemies.find(e=>e.id===id);return !e||e.hp<hp;},target));
  // Manual scene previews and automatic transitions share the correct chapter.
  await stage(1);await stage(0);await frame(36);assert.equal((await frame()).stage,'wind');await frame(35);assert.equal((await frame()).stage,'night');
  const before=(await frame()).time;await page.evaluate(()=>{window.__LINGHU__.action('pause');window.__LINGHU__.app.ticker.stop();});await frame(2);assert.equal((await frame()).time,before);await page.evaluate(()=>{window.__LINGHU__.action('resume');window.__LINGHU__.app.ticker.stop();});
 }
 for(const [width,height] of [[375,667],[430,932]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await frame();
  for(const [ci,id] of [[1,'sea'],[2,'palace'],[3,'snow']]){await chapter(ci);assert.equal((await frame()).chapter,id);for(const si of [1,2,3]){await stage(si);await shot(`${id}-${si}-${width}`);}}
 }
 for(const [ci,id] of [[1,'sea'],[2,'palace'],[3,'snow']]){
  await chapter(ci);await stage(3);
  const timing=await page.evaluate(async()=>{const a=window.__LINGHU__,samples=[];for(let i=0;i<30;i++){const start=performance.now();a.game.advance(1/60,false);a.view.update(a.game,a.input,1/60,60,1/60);a.hualingUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.app.render();samples.push(performance.now()-start);await new Promise(r=>requestAnimationFrame(r));}samples.sort((a,b)=>a-b);return {median:samples[15],p95:samples[28]};});timings.push({chapter:id,...timing});
 }
 // Repeated rebuilding must release old chapter art and preserve normal-mode isolation.
 for(let i=0;i<8;i++)await chapter(i%4);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.action('restart');a.app.ticker.stop();});assert.equal((await frame()).enemies.length,4);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.action('menu');a.app.ticker.stop();});await frame();assert.equal(await page.evaluate(()=>window.__LINGHU__.view.scrollLandscape.back.visible),false);
 assert.deepEqual(errors,[]);assert.ok(requests.some(u=>u.includes('/art/chapters/sea-landscape.json')));assert.ok(requests.some(u=>u.includes('/art/chapters/palace-landscape.json')));assert.ok(requests.some(u=>u.includes('/art/chapters/snow-landscape.json')));assert.ok(!requests.some(u=>u.includes('user-reference')||u.includes('monsters-reference')));await writeFile(`${folder}/verification.json`,JSON.stringify({shots,errors,timings,motion},null,2));console.log('PASS four chapters, twelve scenes, themed enemies, real pointer damage, automatic journey, pause, repeated switching, 375/390/430 layouts and menu isolation');
}finally{await browser.close();}
