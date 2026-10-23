import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/talisman-barrage';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:430,height:932}}),errors=[],results=[],optionalResourceWarnings=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'){const msg=m.text()+' '+m.location().url;if(m.location().url.endsWith('/favicon.ico'))optionalResourceWarnings.push(msg);else errors.push(msg);}});
page.on('response',r=>{if(r.status()>=400)console.log('HTTP '+r.status()+' '+r.url());});
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+v.x+x*v.width/720,y:r.top+v.y+y*v.height/1280};},{x,y});}
async function move(x,y){const p=await point(x,y);await page.mouse.move(p.x,p.y);}
async function click(x,y){await move(x,y);await page.mouse.down();await page.mouse.up();}
async function step(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__;
 for(let t=0;t<seconds-1e-8;t+=1/60){const dt=Math.min(1/60,seconds-t);a.game.advance(dt);a.input.update(dt);for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,dt,60,dt);}
 a.view.update(a.game,a.input,0,60,0);a.practiceUI.root.y=a.view.ui.footer.y;a.practiceUI.update();a.relicUI.update(a.view.ui.footer.y,a.view.ui.brushViewport.top,a.view.ui.brushViewport.top+a.view.ui.brushViewport.height);a.app.render();
 const b=a.game.talismanBarrage;return {phase:b.phase,age:b.age,total:b.totalPapers,papers:b.papers.length,volleys:b.volleys,direction:b.direction,ink:a.game.ink.currentInk,casts:a.game.formalCasts,fallback:a.game.freeSlashes.totalCasts,hp:a.game.enemies.map(e=>({id:e.id,hp:e.hp,x:e.x,y:e.y})),gl:a.app.renderer.gl?.getError()??0};
 },seconds);}
async function capture(name){const s=await step();assert.equal(s.gl,0);results.push({name,...s});await page.screenshot({path:`${folder}/${name}.png`});return s;}
async function button(){return page.evaluate(()=>{const a=window.__LINGHU__,label=a.practiceUI.root.children.find(c=>c.text?.startsWith('万符洪流'));return label?{x:label.x,y:label.y+a.practiceUI.root.y}:null;});}
async function reset(){await page.evaluate(()=>{
 const a=window.__LINGHU__;a.input.cancel();a.game.start(false,true,false,true);a.game.director.disabled=true;a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;a.view.ui.show(a.game.state,a.game);a.practiceUI.reset();a.relicUI.reset();
 for(const p of [{x:480,y:520},{x:550,y:450},{x:620,y:380}]){const e=a.game.spawn('oni',p);e.hp=e.maxHp=10000;e.speed=0;e.ai='Telegraph';e.stateAge=-100;}
 const e=a.game.spawn('ink',{x:135,y:480});e.hp=e.maxHp=10000;e.speed=0;e.ai='Telegraph';e.stateAge=-100;
});await step();}
try{
 await page.goto(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 const entry=await page.evaluate(()=>window.__LINGHU__.view.ui.zones.find(z=>z.action==='interactionPractice'));assert.ok(entry);await click(entry.x+entry.w/2,entry.y+entry.h/2);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const [width,height] of [[430,932],[375,667],[390,844]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await reset();
  const launch=await button();assert.ok(launch);await click(launch.x,launch.y);assert.equal((await step()).phase,'aiming');
  await move(550,500);await page.mouse.down();await move(620,380);await capture(`aim-${width}`);assert.equal((await step()).casts,0);
  await page.mouse.up();const locked=await step();assert.equal(locked.phase,'charging');assert.equal(locked.ink,100);assert.equal(locked.fallback,0);
  await step(.25);assert.equal((await step()).total,0);await capture(`charge-${width}`);
  await step(.9);const stream=await capture(`stream-${width}`);assert.equal(stream.phase,'firing');assert.ok(stream.papers>25);assert.ok(stream.hp.some(e=>e.hp<10000));assert.equal(stream.hp.at(-1).hp,10000);assert.equal(stream.casts,0);
  // Fire continues independently while another ordinary hand-drawn spell is released.
  await move(160,550);await page.mouse.down();await move(270,550);await move(380,550);await page.mouse.up();assert.equal((await step()).casts,1);assert.deepEqual((await step()).direction,locked.direction);
  await page.evaluate(()=>{const a=window.__LINGHU__;a.action('pause');a.app.ticker.stop();});const paused=await step();await step(1);assert.equal((await step()).age,paused.age);
  await page.evaluate(()=>{const a=window.__LINGHU__;a.action('resume');a.app.ticker.stop();});await step(.8);await capture(`sustain-${width}`);
  await page.evaluate(()=>window.__LINGHU__.game.activateHourglass());await step(3.5);assert.equal((await step()).phase,'idle');await capture(`finished-${width}`);
  await click(launch.x,launch.y);assert.equal((await step()).phase,'aiming');await click(launch.x,launch.y);assert.equal((await step()).phase,'idle');
  // Low-quality rendering retains real projectiles and damage; only decorative echoes are omitted.
  await reset();await page.evaluate(()=>window.__LINGHU__.view.ui.low=true);const lowButton=await button();await click(lowButton.x,lowButton.y);await click(620,380);await step(1.2);await capture(`low-${width}`);await page.evaluate(()=>window.__LINGHU__.view.ui.low=false);
 }
 // Optional rendering profile: exercise the full GPU submission path, not just simulation updates.
 let renderProfile;
 if(process.env.LINGHU_PROFILE_BARRAGE==='1'){
  await reset();await page.evaluate(()=>{const a=window.__LINGHU__;a.game.activateTalismanBarrage();a.game.handleBarrageInput({kind:'down',id:91,x:620,y:380});a.game.handleBarrageInput({kind:'up',id:91,x:620,y:380});});await step(.9);
  renderProfile=await page.evaluate(()=>{
   const a=window.__LINGHU__,samples=[];let peakVisible=0;
   for(let i=0;i<100;i++){
    const start=performance.now();a.game.advance(1/60);for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,1/60,60,1/60);a.app.render();
    if(i>=10)samples.push(performance.now()-start);
    peakVisible=Math.max(peakVisible,a.view.talismanBarrage.root.children.filter(p=>p.visible).length);
   }
   samples.sort((a,b)=>a-b);return {frames:samples.length,medianMs:samples[Math.floor(samples.length*.5)],p95Ms:samples[Math.floor(samples.length*.95)],peakVisible,gl:a.app.renderer.gl?.getError()??0};
  });assert.equal(renderProfile.gl,0);console.log('Barrage rendering profile '+JSON.stringify(renderProfile));
 }
 // Both ordinary practice and formal runs have no new ultimate control.
 for(const mode of ['practice','start']){await page.evaluate(mode=>{const a=window.__LINGHU__;a.action(mode);a.app.ticker.stop();},mode);await step();assert.equal(await button(),null);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.activateTalismanBarrage()),false);}
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,renderProfile,errors,optionalResourceWarnings},null,2));
 console.log('PASS barrage browser: real menu/button/aim/release, 3 viewports, sustained directional damage, normal drawing, pause, hourglass, repeat/cancel, low quality, mode isolation; zero page/WebGL errors');
}finally{await browser.close();}
