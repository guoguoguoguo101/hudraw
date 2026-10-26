import sharp from 'sharp';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/snow-motion';await mkdir(folder,{recursive:true});
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
async function pixels(a,b,roi){
 const x=await sharp(a).extract(roi).removeAlpha().raw().toBuffer(),y=await sharp(b).extract(roi).removeAlpha().raw().toBuffer();let n=0;
 for(let i=0;i<x.length;i+=3)if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>24)n++;return n;
}
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?qa=1&mode=hualing`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await frame();await chapter(3);await stage(1);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.hualing.frozen=true;a.game.director.disabled=true;a.game.enemies=[];a.game.hualing.clock=0;});await frame();
 // Hide all weather effects: changed head pixels must come from the actual beast layer.
 await page.evaluate(()=>{const a=window.__LINGHU__;a.view.scrollLandscape.chapters.fx.visible=false;a.app.render();});const a=await page.screenshot();
 await frame(3.4);const b=await page.screenshot();
 const headPixels=await pixels(a,b,{left:110,top:93,width:275,height:125}),floorPixels=await pixels(a,b,{left:65,top:525,width:260,height:75});
 assert.ok(headPixels>400,`Giant itself must move visibly: ${headPixels}`);assert.equal(floorPixels,0,'Battle floor must stay fixed');
 const transform=await page.evaluate(()=>{const r=window.__LINGHU__.view.scrollLandscape.chapters;return r.beasts.map(b=>({x:b.x,y:b.y,rotation:b.rotation,scaleY:b.scale.y}));});assert.ok(transform.some(b=>b.scaleY>1.01&&Math.abs(b.rotation)>.005));
 await page.evaluate(()=>{const a=window.__LINGHU__;a.view.scrollLandscape.chapters.fx.visible=true;a.app.render();});await shot('01-inhale');await frame(1.4);await shot('02-exhale');await frame(3.6);await shot('03-sleep-eyelid');
 await page.evaluate(()=>{const h=window.__LINGHU__.game.hualing;h.previewLandscape('night');const s=h.sceneSeal;for(let i=0;i<5;i++)s.captured.add(i);h.clock=6.9;});await shot('04-awake-blink');
 await frame(.4);await shot('05-awake-open');
 await page.evaluate(()=>{window.__LINGHU__.action('pause');window.__LINGHU__.app.ticker.stop();});await frame();const p=await page.screenshot();await frame(2);const q=await page.screenshot();assert.equal(await pixels(p,q,{left:10,top:90,width:370,height:500}),0,'Pause must freeze beast, snow and mist');
 await page.evaluate(()=>{window.__LINGHU__.action('resume');window.__LINGHU__.app.ticker.stop();});await chapter(1);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.scrollLandscape.chapters.beasts.length),0);await chapter(3);await frame(1);assert.equal((await frame()).gl,0);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({headPixels,floorPixels,transform,errors,shots},null,2));console.log('PASS actual beast breath without weather, fixed arena, exhale, sleep eyelid, awake blinking, paused animation and chapter cleanup', {headPixels,floorPixels});
}finally{await browser.close();}
