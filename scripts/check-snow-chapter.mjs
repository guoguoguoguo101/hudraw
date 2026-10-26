import sharp from 'sharp';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/snow-chapter';await mkdir(folder,{recursive:true});
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
async function draw(points){
 const first=await point(points[0]);await page.mouse.move(first.x,first.y);await page.mouse.down();
 for(const p of points.slice(1)){const q=await point(p);await page.mouse.move(q.x,q.y,{steps:4});}
 await page.mouse.up();await frame();
}
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?qa=1&mode=hualing`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await frame();await chapter(3);
 assert.equal((await frame()).chapter,'snow');await page.evaluate(()=>{const a=window.__LINGHU__;a.game.hualing.frozen=true;a.game.director.disabled=true;for(const e of a.game.enemies)e.speed=0;});
 for(const i of [1,2,3]){
  await stage(i);await shot(`0${i}-scene`);
  const guides=await page.evaluate(()=>{const h=window.__LINGHU__.game.hualing,s=h.sceneSeal,c=s.center(h.bounds);return s.mode==='fire'?s.flames.map(p=>[{x:c.x+p.x-20,y:c.y+p.y},{x:c.x+p.x+20,y:c.y+p.y}]):s.paths.map(path=>path.map(p=>({x:c.x+p.x,y:c.y+p.y})));});
  for(const path of guides)await draw(path);
  assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.sceneSeal.progress),1);await frame(1);await shot(`0${i}-reward`);
  const reward=await page.evaluate(()=>{const a=window.__LINGHU__,h=a.game.hualing,s=h.sceneSeal;a.game.enemies=[];const e=a.game.spawn('oni',{x:360,y:h.bounds.top+240});e.hp=e.maxHp=1000;e.speed=0;return {id:e.id,hp:e.hp,damage:s.damage,slot:s.slot(h.bounds),target:{x:e.x,y:e.y}};});
  await draw([reward.slot,reward.target]);await frame(.25);
  assert.equal(await page.evaluate(id=>window.__LINGHU__.game.enemies.find(e=>e.id===id)?.hp,reward.id),reward.hp-reward.damage);
  if(i===3){await shot('04-awakened');assert.ok(await page.evaluate(()=>window.__LINGHU__.game.hualing.scenes.some(s=>s.mode==='fire'&&s.progress===1)));}
 }
 // Existing buff cards still alter actual persistent ink in the new chapter.
 await page.evaluate(()=>{const h=window.__LINGHU__.game.hualing;h.upgrades.setLevel('trail',4);});
 const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);
 await click({x:492,y:1090+footer});await click({x:624,y:1090+footer});
 await draw([{x:150,y:770},{x:270,y:740},{x:390,y:780},{x:540,y:730}]);
 assert.ok(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.trail.segments.some(s=>s.style==='maple-thunder')));await frame(.3);await shot('05-buff-ink');
 assert.deepEqual(errors,[]);assert.ok(requests.some(u=>u.includes('snow-landscape.json')));assert.ok(!requests.some(u=>u.includes('snow-user-reference')));
 await writeFile(`${folder}/verification.json`,JSON.stringify({shots,errors},null,2));
 console.log('PASS snow browser: fourth chapter entry, three scenes, real pointer interaction and reward damage, awakening, existing buff cards and ink, no page/WebGL errors');
}finally{await browser.close();}
