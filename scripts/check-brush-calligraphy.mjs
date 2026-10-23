import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const folder='screenshots/brush-calligraphy';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:540,height:960},deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173/?qa=1&scene=none',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.qaReady==='none');
 const result=await page.evaluate(async()=>{
  const a=window.__LINGHU__;
  a.app.ticker.stop();a.game.enemies=[];a.game.ink.setUnlimited(true);
  const {SpiritPenRenderer}=await import('/src/rendering/spirit-pen.ts');
  const {brushStroke}=await import('/src/rendering/brush-stroke.ts');
  const {BRUSH_SKINS}=await import('/src/input/brush-settings.ts');
  a.view.update(a.game,a.input,0,60,0);
  const paths=[];
  for(let row=0;row<4;row++){
   const points=Array.from({length:90},(_,i)=>{const t=i/89;return {x:125+t*455,y:400+row*150+Math.sin(t*Math.PI*1.7)*39-35*t};});
   let time=0;const times=points.map((_,i)=>{time+=.021*(1-i/110);return time;});
   a.game.pen.select(BRUSH_SKINS[row].id);
   const pen=new SpiritPenRenderer();
   const input=Object.assign(Object.create(Object.getPrototypeOf(a.input)),a.input,{points,pointTimes:times,drawAge:time,drawing:row===0,success:false,traceAge:0,dryPoints:[],penSnapshot:a.game.pen.snapshot(),gestureId:100+row});
   const source=JSON.stringify(points);
   pen.update(input);a.view.pen.root.parent.addChild(pen.root);
   const ribbon=brushStroke(points,times,10,true);
   paths.push({skin:BRUSH_SKINS[row].id,geometry:pen.trace.context.instructions.length,firstWidth:ribbon[0].width,lastWidth:ribbon.at(-1).width,unchanged:source===JSON.stringify(points)});
   input.drawing=false;input.traceAge=.13;pen.update(input);
   paths[row].clean=pen.trace.context.instructions.length===0;
   input.traceAge=0;input.drawing=row===0;pen.update(input);
  }
  a.app.render();return paths;
 });
 for(const p of result){assert.ok(p.geometry>0);assert.equal(p.clean,true);assert.equal(p.unchanged,true);}
 await page.locator('canvas').screenshot({path:`${folder}/four-brushes.png`});
 // Exercise real browser pointer input, including normal and depleted ink.
 await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.qaReady==='none');
 await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.enemies=[];a.game.pen.select('cinnabar');a.game.ink.setUnlimited(true);});
 const box=await page.locator('canvas').boundingBox();
 const map=(x,y)=>({x:box.x+x*box.width/720,y:box.y+y*box.height/1280});
 const path=Array.from({length:48},(_,i)=>({x:140+i*9,y:550+Math.sin(i/47*Math.PI*1.3)*75}));
 await page.mouse.move(...Object.values(map(path[0].x,path[0].y)));await page.mouse.down();
 for(const p of path.slice(1)){const q=map(p.x,p.y);await page.mouse.move(q.x,q.y);}
 const live=await page.evaluate(()=>{const a=window.__LINGHU__;a.view.update(a.game,a.input,0,60,0);a.app.render();return {drawing:a.input.drawing,samples:a.input.points.length,geometry:a.view.pen.trace.context.instructions.length};});
 assert.equal(live.drawing,true);assert.ok(live.samples>10&&live.geometry>0);
 await page.locator('canvas').screenshot({path:`${folder}/in-game.png`});
 await page.mouse.up();
 const clean=await page.evaluate(()=>{const a=window.__LINGHU__;a.input.update(.16);a.view.update(a.game,a.input,0,60,0);a.app.render();return a.view.pen.trace.context.instructions.length;});assert.equal(clean,0);
 const depleted=await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.game.ink.setUnlimited(false);a.game.ink.setAmount(8);a.input.event({x:120,y:500,kind:'down',id:93});a.input.event({x:620,y:550,kind:'move',id:93});a.view.update(a.game,a.input,0,60,0);a.app.render();const dry=a.input.dryPoints.length,empty=a.game.ink.currentInk;a.input.event({x:620,y:550,kind:'up',id:93});a.input.update(.16);a.view.update(a.game,a.input,0,60,0);return {dry,empty,clean:a.view.pen.trace.context.instructions.length};});
 assert.ok(depleted.dry>0);assert.equal(depleted.empty,0);assert.equal(depleted.clean,0);
 assert.deepEqual(errors,[]);
 await writeFile(`${folder}/verification.json`,JSON.stringify({result,live,clean,depleted,errors},null,2));
 console.log('PASS calligraphy: four skins, live pointer drawing, released cleanup, unchanged recognition points, no browser errors');
}finally{await browser.close();}
