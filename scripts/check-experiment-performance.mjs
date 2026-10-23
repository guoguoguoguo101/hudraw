import {chromium} from '@playwright/test';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/experiment-performance';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:1.5});const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 async function scene(mode,age,count,optimized){return page.evaluate(async({mode,age,count,optimized})=>{
  const a=window.__LINGHU__,{game:g,view:v,input,app}=a,{recognize}=await import('/src/input/recognizer.ts');input.cancel();g.start(false,true,false,true);g.director.disabled=true;g.practiceLevels.circle=4;v.experimentalOptimizations=optimized;v.begin();v.clock=0;v.shake=0;v.entrance.y=665;v.entrance.scale=.32;
  if(mode==='pen'){input.points=Array.from({length:400},(_,i)=>({x:100+i/399*500,y:600+Math.sin(i*.23)*100}));input.pointTimes=input.points.map((_,i)=>i*.003);input.drawing=true;input.drawAge=1.2;}
  else for(let i=0;i<count;i++){const cy=mode==='seal'?320:665;g.cast(recognize(Array.from({length:73},(_,j)=>({x:360+Math.cos(j/72*Math.PI*2)*60,y:cy+Math.sin(j/72*Math.PI*2)*60}))));const s=g.skills.at(-1);s.age=age;s.released=true;}
  g.drain();v.update(g,input,0,60);if(optimized)v.circles.atlas?.update(1000);v.update(g,input,0,60);app.render();
  return {wards:v.circles.wards.size,pages:v.circles.atlas?.pageCount,cache:v.circles.geometryCache.size,gl:app.renderer.gl.getError()};
 },{mode,age,count,optimized});}
 for(const [mode,age,count] of [['ward',.15,1],['ward',1.2,1],['ward',3,10],['seal',.6,1],['seal',2,10],['seal',5.8,1],['pen',0,0]]){
  const images=[];for(const optimized of [false,true]){const state=await scene(mode,age,count,optimized);assert.equal(state.gl,0);assert.equal(state.wards,count);images.push(await page.locator('#app').screenshot({path:`${folder}/${mode}-${age}-${optimized?'optimized':'original'}.png`}));}
  const a=await sharp(images[0]).ensureAlpha().raw().toBuffer(),b=await sharp(images[1]).ensureAlpha().raw().toBuffer();let sum=0,changed=0;for(let i=0;i<a.length;i+=4){const d=Math.max(...[0,1,2].map(j=>Math.abs(a[i+j]-b[i+j])));sum+=d;if(d>24)changed++;}
  const mean=sum/(a.length/4),changedRatio=changed/(a.length/4);assert.ok(mean<5&&changedRatio<.05,`visual mismatch ${mode}: ${mean}/${changedRatio}`);results.push({mode,age,count,mean,changedRatio});
 }
 // Active drawing must refresh even when the sample array is compacted or replaced.
 await page.evaluate(()=>{const a=window.__LINGHU__,v=a.view,input=a.input;v.pen.optimized=true;const first=v.pen.trace.context.instructions;input.points=input.points.map(p=>({x:p.x,y:p.y-30}));v.pen.update(input);if(v.pen.trace.context.instructions===first&&v.pen.trace.context.instructions.length===0)throw Error('missing pen');});
 // Cache bounds through several lifetimes, followed by scene exit and original-mode isolation.
 const cleanup=await page.evaluate(()=>{const a=window.__LINGHU__;for(let i=0;i<240;i++){for(const s of a.game.skills)s.age=i/60;a.view.circles.update(a.game.skills,[]);}a.game.menu();a.view.update(a.game,a.input,0,60);return {cache:a.view.circles.geometryCache.size,pages:a.view.circles.atlas.pageCount,optimized:a.view.circles.optimized,pen:a.view.pen.optimized};});
 assert.deepEqual(cleanup,{cache:0,pages:0,optimized:false,pen:false});assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,cleanup,errors},null,2));console.log(JSON.stringify({results,cleanup,errors},null,2));
}finally{await browser.close();}
