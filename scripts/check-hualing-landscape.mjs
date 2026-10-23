import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=new URL(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5176').origin,folder='screenshots/hualing-landscape';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],shots=[];
page.on('pageerror',e=>errors.push(e.message));
async function frame(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__;
 for(let t=0;t<seconds-1e-9;t+=1/60)a.game.advance(Math.min(1/60,seconds-t),a.input.drawing);
 a.input.minY=Math.max(175,a.view.ui.hud.y+220);a.input.maxY=990+a.view.ui.footer.y;
 a.game.interactions.bounds={left:0,right:720,top:a.input.minY,bottom:a.input.maxY};
 a.game.hualing.bounds={left:26,right:694,top:Math.max(a.input.minY+30,280+a.view.ui.hud.y),bottom:a.input.maxY-28};
 for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,0,60,0);a.hualingUI.update(a.view.ui.footer.y);a.practiceUI.update();a.app.render();
 const m=a.game.hualing;return {stage:m.journey.stage,time:m.journey.time,auto:m.journey.automatic,event:m.sceneSeal.mode,progress:m.sceneSeal.progress,cards:m.scenes.filter(s=>s.phase==='stored').map(s=>({kind:s.mode,slot:s.slotIndex})),gl:a.app.renderer.gl.getError()};
 },seconds);}
async function move(p){const q=await page.evaluate(async p=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+v.x+p.x*v.scale,y:r.top+v.y+p.y*v.scale};},p);await page.mouse.move(q.x,q.y);}
async function click(p){await move(p);await page.mouse.down();await page.mouse.up();await frame();}
async function phase(index){const y=await page.evaluate(()=>window.__LINGHU__.game.hualing.bounds.top-42);await click({x:316+index*104,y});}
async function draw(points){await move(points[0]);await page.mouse.down();for(const p of points.slice(1))await move(p);await page.mouse.up();await frame();}
async function shot(name){const state=await frame();assert.equal(state.gl,0);await page.screenshot({path:`${folder}/${name}.png`});shots.push({name,...state});return state;}
async function reset(){await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.game.hualing.reset();a.game.hualing.frozen=true;a.game.skills=[];a.game.enemies=[];a.game.director.disabled=true;a.hualingUI.reset();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;for(const [x,y] of [[180,560],[540,520],[120,730]]){const e=a.game.spawn('ink',{x,y});e.speed=0;e.ai='Approach';}});await frame();}
try{
 await page.goto(`${base}/?qa=1&mode=hualing`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await reset();
 await shot('01-sunset-390');const partial=await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing,s=m.sceneSeal,c=s.center(m.bounds);m.traceScene({x:c.x-145,y:c.y-45},{x:c.x-55,y:c.y-45});return s.progress;});
 await phase(2);assert.equal((await frame()).stage,'wind');assert.equal((await frame()).event,'fire');await shot('02-wind-390');
 const c=await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing;return m.sceneSeal.center(m.bounds);});await draw(Array.from({length:81},(_,i)=>({x:c.x+230*Math.cos(i/80*Math.PI*2),y:c.y+230*Math.sin(i/80*Math.PI*2)})));await frame(1);assert.equal((await frame()).cards.length,1);
 await phase(3);assert.equal((await frame()).stage,'night');assert.equal((await frame()).event,'beast');await shot('03-night-390');assert.equal((await frame()).cards[0].kind,'fire');
 await phase(1);assert.equal((await frame()).progress,partial);await shot('04-progress-preserved');
 // Earned card is still visible and usable after switching back to a different landscape.
 const fire=await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing,s=m.scenes.find(s=>s.mode==='fire');return {slot:s.slot(m.bounds),target:{x:360,y:550}};});await move(fire.slot);await page.mouse.down();await move(fire.target);await shot('05-archived-card-drag');await page.mouse.up();await frame(.3);assert.equal((await frame()).cards.length,0);
 await reset();await frame(25);await shot('06-transition-wind');await frame(9);assert.equal((await frame()).stage,'wind');assert.equal((await frame()).event,'fire');await shot('07-auto-wind');await frame(22);await shot('08-transition-night');await frame(12);assert.equal((await frame()).stage,'night');assert.equal((await frame()).event,'beast');await shot('09-auto-night');
 const before=(await frame()).time;await page.evaluate(()=>{window.__LINGHU__.action('pause');window.__LINGHU__.app.ticker.stop();});await frame(3);assert.equal((await frame()).time,before);await page.evaluate(()=>{window.__LINGHU__.action('resume');window.__LINGHU__.app.ticker.stop();});await frame();
 for(const [width,height] of [[375,667],[430,932]]){await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await reset();for(const [index,name] of [[1,'sunset'],[2,'wind'],[3,'night']]){await phase(index);assert.equal((await frame()).stage,name);await shot(`10-${name}-${width}`);}}
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await reset();await phase(3);
 const timing=await page.evaluate(async()=>{const a=window.__LINGHU__,samples=[];for(let i=0;i<30;i++){const t=performance.now();a.game.advance(1/60);a.view.update(a.game,a.input,1/60,60,1/60);a.hualingUI.update(a.view.ui.footer.y);a.app.render();samples.push(performance.now()-t);await new Promise(r=>requestAnimationFrame(r));}samples.sort((a,b)=>a-b);return {median:samples[15],p95:samples[28]};});
 await page.evaluate(()=>{window.__LINGHU__.action('menu');window.__LINGHU__.app.ticker.stop();});await frame();assert.equal(await page.evaluate(()=>window.__LINGHU__.view.environment.back.visible),true);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.scrollLandscape.back.visible),false);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({shots,timing,errors},null,2));console.log('PASS landscape: three phase buttons, automatic warm/wind/night transitions, pause, progress and cross-phase card preservation/use, 375/390/430 layouts, normal menu isolation, no page/WebGL errors',timing);
}finally{await browser.close();}
