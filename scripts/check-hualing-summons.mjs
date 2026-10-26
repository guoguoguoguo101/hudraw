import sharp from 'sharp';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/hualing-summons';await mkdir(folder,{recursive:true});
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
async function summonCard(kind,target){
 const s=await page.evaluate(kind=>{const h=window.__LINGHU__.game.hualing,s=h.scenes.find(s=>s.mode===kind);return {phase:s.phase,slot:s.slot(h.bounds)};},kind);assert.equal(s.phase,'stored');await draw([s.slot,target]);await frame(.2);
 assert.equal(await page.evaluate(kind=>window.__LINGHU__.game.hualing.scenes.find(s=>s.mode===kind).phase,kind),'spent');
}
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?qa=1&mode=hualing`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await frame();await chapter(1);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.hualing.frozen=true;a.game.director.disabled=true;a.game.enemies=[];});await frame();
 const data=await page.evaluate(()=>{const a=window.__LINGHU__,h=a.game.hualing,y=h.bounds.top+260;for(const x of [270,400,520]){const e=a.game.spawn('ink',{x,y},'sea-fish');e.hp=e.maxHp=1000;e.speed=0;e.ai='Approach';}const e=a.game.spawn('ink',{x:390,y:y+120},'sea-crab');e.hp=e.maxHp=1000;e.speed=0;e.ai='Approach';return {y,footer:a.view.ui.footer.y};});
 await click({x:399,y:1017+data.footer});await click({x:515,y:1017+data.footer});await shot('01-cards-ready');
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.sceneSeal.progress),0);
 const slots=await page.evaluate(()=>window.__LINGHU__.game.hualing.scenes.filter(s=>s.phase==='stored').map(s=>s.slotIndex));assert.equal(new Set(slots).size,2);
 // Cancel an invalid drop: the card stays in the inventory.
 const cs=await page.evaluate(()=>{const h=window.__LINGHU__.game.hualing;return h.scenes.find(s=>s.mode==='crab').slot(h.bounds);});await draw([cs,{x:30,y:130}]);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.scenes.find(s=>s.mode==='crab').phase),'stored');
 await summonCard('crab',{x:130,y:data.y});await shot('02-crab-unfold');await frame(.5);await shot('03-crab-windup');
 const lane=await page.evaluate(()=>window.__LINGHU__.game.hualing.scenes.find(s=>s.mode==='crab').crab.state.to);assert.ok(Math.abs(lane.y-data.y)<1);
 await frame(.55);await shot('04-crab-charge');await frame(.5);
 assert.deepEqual(await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>e.hp)),[944,944,944,1000]);
 await summonCard('beast',{x:550,y:data.y+130});await frame(.4);await shot('05-both-summons');assert.ok(await page.evaluate(()=>{const h=window.__LINGHU__.game.hualing;return h.scenes.some(s=>s.beast.alive)&&h.scenes.some(s=>s.crab.alive);}));
 await click({x:96,y:1090+data.footer});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.selected),'dragon');
 assert.ok(await page.evaluate(()=>{const v=window.__LINGHU__.view.hualing.scene;return !v.root.visible&&v.companions.children.every(c=>c.visible);}));await shot('06-card-coexist');
 await page.evaluate(()=>{window.__LINGHU__.game.hualing.cancel();window.__LINGHU__.action('pause');window.__LINGHU__.app.ticker.stop();});await frame();const before=await page.evaluate(()=>JSON.stringify(window.__LINGHU__.game.hualing.scenes.map(s=>[s.beast.state,s.crab.state])));await frame(2);assert.equal(await page.evaluate(()=>JSON.stringify(window.__LINGHU__.game.hualing.scenes.map(s=>[s.beast.state,s.crab.state]))),before);
 await page.evaluate(()=>{window.__LINGHU__.action('resume');window.__LINGHU__.app.ticker.stop();});
 for(const [width,height] of [[375,667],[430,932]]){await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await frame();await chapter(3);const f=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);await click({x:515,y:1017+f});await shot(`07-layout-${width}`);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.scenes.find(s=>s.mode==='crab').phase),'stored');}
 await chapter(0);assert.ok(await page.evaluate(()=>window.__LINGHU__.game.hualing.scenes.every(s=>!s.crab.alive&&!s.beast.alive&&s.phase==='repairing')));
 assert.deepEqual(errors,[]);assert.ok(!requests.some(u=>u.includes('crab-general-v01.png')));await writeFile(`${folder}/verification.json`,JSON.stringify({shots,errors,damage:[944,944,944,1000]},null,2));console.log('PASS real click claim, no tracing, two stored cards, cancelled drop, crab lane and three-target damage, tiger coexist, selected spell visibility, pause, chapter cleanup and 375/390/430 layouts');
}finally{await browser.close();}
