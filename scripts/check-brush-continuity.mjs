import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/brush-continuity';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
async function reset(level){return page.evaluate(async level=>{
 const a=window.__LINGHU__;a.action('restart');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();a.input.cancel();a.game.director.disabled=true;a.game.enemies=[];a.game.hualing.upgrades.setLevel('wide',level);a.view.pen.liveFX.clear();
 a.view.update(a.game,a.input,0,60,0);a.brushUpgradeUI.update();return {...a.game.hualing.bounds};
},level);}
async function capture(name,points,level,release=false){
 const data=await page.evaluate(async({points,level,release})=>{
  const a=window.__LINGHU__,fx=a.view.pen.liveFX;
  a.input.event({kind:'down',id:81,...points[0]});
  // Deliberately submit more than 24 samples between render frames.
  for(const p of points.slice(1))a.input.event({kind:'move',id:81,...p});
  if(release)a.input.event({kind:'up',id:81,...points.at(-1)});
  a.view.update(a.game,a.input,0,60,0);a.app.render();
  const rect=a.app.renderer.screen.clone();rect.x=rect.y=0;rect.width=720;rect.height=1280;
  const target=a.app.renderer.generateTexture({target:fx.ink,frame:rect,resolution:1,antialias:false}),extracted=a.app.renderer.extract.pixels({target}),pixels=extracted.pixels;
  const alpha=(x,y)=>pixels[(Math.round(y)*720+Math.round(x))*4+3];let missing=0,samples=0;
  for(let i=1;i<points.length;i++){const p=points[i-1],q=points[i],d=Math.hypot(q.x-p.x,q.y-p.y),n=Math.ceil(d/3);for(let j=0;j<=n;j++){const t=j/n;samples++;if(alpha(p.x+(q.x-p.x)*t,p.y+(q.y-p.y)*t)<100)missing++;}}
  const middle=points[Math.floor(points.length/2)];let width=0;
  if(points.every(p=>p.y===points[0].y))for(let y=middle.y-45;y<=middle.y+45;y++)if(alpha(middle.x,y)>100)width++;
  const gl=a.app.renderer.gl.getError(),segments=fx.strokes.length;
  target.destroy(true);return{missing,samples,width,segments,retained:a.input.points.length,level,release,gl};
 },{points,level,release});
 assert.equal(data.missing,0,`${name}: every sampled point must have continuous ink`);assert.equal(data.gl,0);assert.ok(data.segments<=320);
 await page.screenshot({path:`${folder}/${name}.png`});results.push({name,...data});return data;
}
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__?.brushUpgradeUI);
 for(const [width,height] of [[390,844],[375,667],[430,932]]){
  await page.setViewportSize({width,height});
  const measured=[];
  for(const level of [0,1,2,3,4]){
   const b=await reset(level),y=Math.round(b.top+180),points=Array.from({length:101},(_,i)=>({x:70+i*5.6,y}));
   const state=await capture(`straight-lv${level}-${width}`,points,level);assert.equal(state.retained,24);measured.push(state.width);
  }
  assert.ok(measured[0]<=18&&measured[4]<=36,'base and max strokes must remain slim');assert.ok(measured.every((n,i)=>i===0||n>measured[i-1]),'all five widths stay visibly distinct');
  const b=await reset(4),top=Math.round(b.top+100),points=[];
  for(const [a,z] of [[{x:90,y:top},{x:580,y:top}],[{x:580,y:top},{x:580,y:top+140}],[{x:580,y:top+140},{x:130,y:top+140}],[{x:130,y:top+140},{x:130,y:top+270}]])for(let i=points.length?1:0;i<=20;i++)points.push({x:a.x+(z.x-a.x)*i/20,y:a.y+(z.y-a.y)*i/20});
  await capture(`fast-turn-release-${width}`,points,4,true);
  // A new stroke must not connect to the old stroke across an untouched gap.
  await reset(0);const fresh=await page.evaluate(()=>{const a=window.__LINGHU__,y=a.game.hualing.bounds.top+150;for(const [id,x] of [[1,100],[2,500]]){a.input.event({kind:'down',id,x,y});a.input.event({kind:'up',id,x:x+60,y});}a.view.update(a.game,a.input,0,60,0);return a.view.pen.liveFX.strokes.map(s=>Math.hypot(s.b.x-s.a.x,s.b.y-s.a.y));});assert.ok(fresh.every(n=>n<20));
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));console.log('PASS slim widths 0–4, all centerline pixels connected, >24 input samples per frame, rapid turns and release before rendering, separate strokes, 375/390/430 and bounded geometry');
}catch(error){console.error(error);throw error;}finally{await browser.close();}
