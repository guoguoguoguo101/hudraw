import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/brush-rift';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message);});
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__?.playUI,{},{timeout:30000});
 await page.evaluate(async()=>{const a=window.__LINGHU__;a.playUI.formal=true;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();});
 async function frame(dt=0){return page.evaluate(dt=>{
  const a=window.__LINGHU__,g=a.game,m=g.hualing.upgrades;
  for(let t=0;t<dt-1e-8;t+=1/60)g.advance(Math.min(1/60,dt-t),a.input.drawing);
  for(const e of g.drain())a.view.event(e);a.view.update(g,a.input,dt,60,dt);a.view.ui.hud.visible=false;a.view.ui.counter.visible=false;a.hualingUI.root.visible=false;a.view.hualing.compactUI=true;a.playUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.brushUpgradeUI.compactUI=true;a.brushUpgradeUI.update();a.app.render();
  return{level:m.levels.wide,ready:m.wideReady,cooldown:m.wideRemaining,waves:m.wideWaves.length,width:m.width,contact:m.contactRadius,cuts:m.wideCuts.length,gl:a.app.renderer.gl.getError(),commands:a.view.brushUpgrades.wide.art.context.instructions.length+a.view.brushUpgrades.wide.glow.context.instructions.length};
 },dt);}
 async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.move(p.x,p.y);}
 async function shot(name){const state=await frame();assert.equal(state.gl,0);await page.screenshot({path:`${folder}/${name}.png`});results.push({name,...state});}
 async function reset(level){await page.evaluate(level=>{const a=window.__LINGHU__,g=a.game;a.input.cancel();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;g.enemies=[];g.hualing.upgrades.setLevel('wide',level);a.view.begin();for(const p of [{x:440,y:610},{x:500,y:580},{x:550,y:650}]){const e=g.spawn('oni',p);e.hp=e.maxHp=10000;e.speed=0;}},level);await frame();}
 async function sweep(){await move(160,740);await page.mouse.down();for(let i=1;i<=14;i++){await move(160+i*15,740-i*6-Math.sin(i/14*Math.PI)*20);await frame(.006);}}
 const shapes={
  straight:Array.from({length:22},(_,i)=>({x:140+i*19,y:700-i*4})),
  curve:Array.from({length:35},(_,i)=>({x:130+i*13,y:630+Math.sin(i/34*Math.PI*2)*90})),
  circle:Array.from({length:45},(_,i)=>({x:355+155*Math.cos(i/44*Math.PI*2),y:650+155*Math.sin(i/44*Math.PI*2)})),
  corner:[{x:140,y:460},{x:140,y:700},{x:480,y:700}],
 };
 for(const [name,points] of Object.entries(shapes)){
  await reset(4);await frame(.8);await move(points[0].x,points[0].y);await page.mouse.down();
  for(const p of points.slice(1)){await move(p.x,p.y);await frame(.009);}
  await frame(.07);assert.equal((await frame()).waves,1);await shot(`${name}-held`);
  const geometry=await page.evaluate(()=>{const w=window.__LINGHU__.game.hualing.upgrades.wideWaves[0];return{points:w.path.length,length:w.length};});
  assert.ok(geometry.points<=96);results.push({name,geometry});
  await page.mouse.up();await frame(.3);await shot(`${name}-closing`);await frame(1.2);assert.equal((await frame()).waves,0);
 }
 await reset(4);await frame(.8);
 for(let i=0;i<9;i++){await move(120,480+i*32);await page.mouse.down();await move(470,480+i*32);await page.mouse.up();}
 assert.equal((await frame()).waves,6);assert.equal((await frame()).cooldown,0);await frame(.08);const stress=await frame();assert.ok(stress.commands<400);await shot('six-rifts');
 await page.evaluate(()=>{const a=window.__LINGHU__;a.view.brushUpgrades.update(a.game.hualing.upgrades,true,true,a.game.hualing.bounds);a.app.render();});
 assert.equal(await page.evaluate(()=>window.__LINGHU__.app.renderer.gl.getError()),0);
 const perf=await page.evaluate(()=>{const a=window.__LINGHU__,build=[],submit=[];for(let i=0;i<35;i++){const start=performance.now();a.view.brushUpgrades.update(a.game.hualing.upgrades,true,false,a.game.hualing.bounds);const mid=performance.now();a.app.render();if(i>4){build.push(mid-start);submit.push(performance.now()-mid);}}const stats=v=>{v.sort((a,b)=>a-b);return{median:v[Math.floor(v.length*.5)],p95:v[Math.floor(v.length*.95)]};};return{note:'Desktop CPU timings, not phone FPS.',effectBuildMs:stats(build),renderSubmitMs:stats(submit)};});
 await page.setViewportSize({width:375,height:667});await frame(.19);await shot('small-finisher');
 const audio=await page.evaluate(async()=>{const {Synth}=await import('/src/audio/synth.ts'),ctx=new OfflineAudioContext(1,22050,22050),s=new Synth();s.context=ctx;s.master=ctx.createGain();s.master.gain.value=.25;s.master.connect(ctx.destination);s.play('wideCast');const buffer=await ctx.startRendering(),samples=buffer.getChannelData(0);let peak=0,energy=0;for(const n of samples){if(!Number.isFinite(n))throw Error('invalid wide audio sample');peak=Math.max(peak,Math.abs(n));energy+=n*n;}return{peak,rms:Math.sqrt(energy/samples.length)};});
 assert.ok(audio.rms>.001&&audio.peak<.8);assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,stress,perf,audio,errors},null,2));console.log('PASS brush rift: real pointer straight/curve/circle/corner, no cooldown, six-rift cap, cleanup, small screen, low quality, GL and audio');
}finally{await browser.close();}
