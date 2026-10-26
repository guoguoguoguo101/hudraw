import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/ink-formations';await mkdir(folder,{recursive:true});
console.log('Launching formation preview');const browser=await chromium.launch({channel:'msedge',headless:true,timeout:30000});console.log('Browser ready');
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message);});
 console.log('Loading arena');await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__?.playUI,{},{timeout:30000});
 await page.evaluate(async()=>{const a=window.__LINGHU__;a.playUI.formal=true;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();});
 async function frame(dt=0){return page.evaluate(dt=>{
  const a=window.__LINGHU__,g=a.game,m=g.hualing.upgrades;
  for(let t=0;t<dt-1e-8;t+=1/60)g.advance(Math.min(1/60,dt-t),a.input.drawing);
  for(const e of g.drain())a.view.event(e);a.view.update(g,a.input,dt,60,dt);a.view.ui.hud.visible=false;a.view.ui.counter.visible=false;a.hualingUI.root.visible=false;a.view.hualing.compactUI=true;a.playUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.brushUpgradeUI.compactUI=true;a.brushUpgradeUI.update();a.app.render();
  return{level:m.levels.trail,formations:m.trail.rituals.formations.length,blocks:m.trail.rituals.blocks.length,slams:m.trail.rituals.formations.map(f=>f.slams),segments:m.trail.segments.length,gl:a.app.renderer.gl.getError()};
 },dt);}
 async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.move(p.x,p.y);}
 async function shot(name){const state=await frame();assert.equal(state.gl,0);await page.screenshot({path:`${folder}/${name}.png`});results.push({name,...state});}
 async function reset(level){await page.evaluate(level=>{const a=window.__LINGHU__,g=a.game;a.input.cancel();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;g.enemies=[];g.hualing.upgrades.setLevel('trail',level);a.view.begin();},level);await frame();}
 async function drawCircle(rx=145,ry=115,cancel=false){
  const pts=Array.from({length:57},(_,i)=>({x:350+Math.cos(i/56*Math.PI*2)*rx,y:680+Math.sin(i/56*Math.PI*2)*ry}));
  await move(pts[0].x,pts[0].y);await page.mouse.down();for(const p of pts.slice(1)){await move(p.x,p.y);await frame(.006);}
  assert.equal((await frame()).formations,0,'no summon before release');
  if(cancel)await page.evaluate(()=>window.__LINGHU__.input.cancel());await page.mouse.up();
 }
 console.log('Arena ready');for(const level of [1,2,3,4]){
  console.log('Tier',level);
  await reset(level);await drawCircle();assert.equal((await frame()).formations,level>=3?1:0);
  await page.evaluate(()=>{const g=window.__LINGHU__.game;for(const p of [{x:350,y:700},{x:420,y:700},{x:80,y:850}]){const e=g.spawn('oni',p);e.hp=e.maxHp=10000;e.speed=0;}});
  await frame(.12);await shot(`lv${level}-opening`);await frame(.28);await shot(`lv${level}-formed`);
  if(level>=3){const hp=await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>e.hp));assert.ok(hp[0]<10000);assert.equal(hp[2],10000);}
  if(level===4){await frame(.52);await shot('lv4-guardian-raised');await frame(.46);assert.equal((await frame()).slams[0],1);await shot('lv4-first-slam');await frame(1.45);assert.equal((await frame()).slams[0],2);await shot('lv4-second-slam');}
  const before=await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.trail.time);await page.evaluate(()=>window.__LINGHU__.game.pause());await frame(.5);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.trail.time),before);await page.evaluate(()=>window.__LINGHU__.game.pause());
  await frame(6);assert.equal((await frame()).formations,0);assert.equal((await frame()).segments,0);
 }
 await reset(4);await drawCircle(145,115,true);assert.equal((await frame()).formations,0);
 await reset(2);await move(140,700);await page.mouse.down();await move(560,700);await page.mouse.up();await frame(.15);
 // Actual elite projectiles are intercepted through the same real simulation hook.
 await page.evaluate(()=>{const a=window.__LINGHU__,g=a.game,e=g.summonHualingElite('umbrella');g.hualing.elites.field.begin(e,g.hualing.bounds,g.enemies);const field=g.hualing.elites.field,o=field.objects[0];field.objects=field.objects.slice(0,1);o.x=300;o.y=675;o.vx=0;o.vy=900;o.warn=0;o.age=.2;g.hualing.frozen=false;});
 await frame(.04);assert.ok((await frame()).blocks>0);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.elites.field.objects.filter(o=>!o.dead).length),0);await shot('lv2-real-projectile-block');
 await reset(4);await drawCircle();await frame(.9);
 const perf=await page.evaluate(()=>{const a=window.__LINGHU__,times=[];for(let i=0;i<25;i++){const t=performance.now();a.view.inkTrail.update(a.game.hualing.upgrades.trail,true,a.game.hualing.bounds,false);a.app.render();if(i>4)times.push(performance.now()-t);}times.sort((a,b)=>a-b);return{desktopBuildAndSubmitMedianMs:times[10],desktopBuildAndSubmitP95Ms:times[19]};});
 await page.evaluate(()=>{const a=window.__LINGHU__;a.view.inkTrail.update(a.game.hualing.upgrades.trail,true,a.game.hualing.bounds,true);a.app.render();});assert.equal(await page.evaluate(()=>window.__LINGHU__.app.renderer.gl.getError()),0);
 await page.setViewportSize({width:375,height:667});await shot('small-screen-guardian');
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.hualing.upgrades.panel='custom';a.brushUpgradeUI.update();});await shot('upgrade-ui');
 const audio=await page.evaluate(async()=>{const {Synth}=await import('/src/audio/synth.ts'),out=[];for(const kind of ['inkSeal','inkSummon','inkSlam','inkBlock']){const c=new OfflineAudioContext(1,44100*2,44100),s=new Synth();s.context=c;s.master=c.createGain();s.master.gain.value=.25;s.master.connect(c.destination);s.play(kind);const data=(await c.startRendering()).getChannelData(0);let peak=0;for(const x of data){if(!Number.isFinite(x))throw Error('invalid audio sample');peak=Math.max(peak,Math.abs(x));}out.push({kind,peak});}return out;});
 assert.ok(audio.every(x=>x.peak>.001&&x.peak<.8));assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,perf,audio,errors},null,2));console.log('PASS ink formations: real pointer circles/ellipses, four tiers, summon after release, guardian damage and slam timing, cancel, real elite projectile interception, pause, cleanup, UI, low quality, small screen, GL and audio');
}finally{await browser.close();}
