import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const base=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184';
const folder='output/renderer-reuse';await mkdir(folder,{recursive:true});
const names=['ink-dragon','petal-brush','brush-upgrades'];
if(process.env.PERF_CAPTURE==='1'){
 for(const name of names){const r=await fetch(`${base}/src/rendering/${name}.ts`);assert.ok(r.ok);await writeFile(`${folder}/${name}-baseline.js`,await r.text());}
 console.log('Captured current renderer baseline modules for exact before/after comparison');
}else{
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
for(const name of names)await page.route(`**/src/rendering/${name}-perf-baseline.js`,async route=>route.fulfill({contentType:'text/javascript',body:await readFile(`${folder}/${name}-baseline.js`,'utf8')}));
try{
 await page.goto(`${base}/?mode=mountains&qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
 const pixiPath=(await readFile(`${folder}/petal-brush-baseline.js`,'utf8')).match(/from "([^"]*pixi__js[^\"]*)"/)[1];
 const report=await page.evaluate(async pixiPath=>{
  const a=window.__LINGHU__;a.app.ticker.stop();
  const {Container,Graphics}=await import(pixiPath);
  const {DragonRoute}=await import('/src/rendering/dragon-motion.ts');
  const [oldPetal,newPetal,oldDragon,newDragon,oldBrush,newBrush]=await Promise.all([
   import('/src/rendering/petal-brush-perf-baseline.js'),import('/src/rendering/petal-brush.ts'),
   import('/src/rendering/ink-dragon-perf-baseline.js'),import('/src/rendering/ink-dragon.ts'),
   import('/src/rendering/brush-upgrades-perf-baseline.js'),import('/src/rendering/brush-upgrades.ts')]);
  const scene=new Container();a.app.stage.removeChildren();a.app.stage.addChild(scene);
  scene.addChild(new Graphics().rect(0,0,720,1280).fill(0x203031));
  const model={clock:2,leaves:Array.from({length:72},(_,i)=>({x:50+i%12*54,y:260+Math.floor(i/12)*43,age:.28+i%5*.13,life:1.7,size:5+(i%4)*.75,phase:i*2.399,angle:i*.8,tone:i%4})),buds:Array.from({length:6},(_,i)=>({x:80+i*108,y:600,age:.1+i*.14,angle:i*.2})),blooms:Array.from({length:6},(_,i)=>({x:80+i*108,y:790,age:.08+i*.13,angle:i*.2})),isSlowed:()=>false};
  const petal=[];
  for(const Module of [oldPetal,newPetal]){
   const renderer=new Module.PetalBrushRenderer();scene.addChild(renderer.root);
   renderer.update(model,true);a.app.render();const png=await a.app.renderer.extract.base64({target:a.app.stage,resolution:1});
   const clear=Graphics.prototype.clear,fill=Graphics.prototype.fill,stroke=Graphics.prototype.stroke;let clears=0,draws=0;
   Graphics.prototype.clear=function(...args){clears++;return clear.apply(this,args);};
   Graphics.prototype.fill=function(...args){draws++;return fill.apply(this,args);};Graphics.prototype.stroke=function(...args){draws++;return stroke.apply(this,args);};
   for(let i=0;i<60;i++)renderer.update(model,true);Graphics.prototype.clear=clear;Graphics.prototype.fill=fill;Graphics.prototype.stroke=stroke;
   const dynamicInstructions=[];function walk(n){if(n.context)dynamicInstructions.push(n.context.instructions.length);for(const c of n.children??[])walk(c);}walk(renderer.root);
   renderer.update(model,true,true);a.app.render();const lowPng=await a.app.renderer.extract.base64({target:a.app.stage,resolution:1});
   const lowCounts=renderer.leafPool?{leaves:renderer.leafPool.filter(n=>n.visible).length,shards:renderer.bloomPool.reduce((sum,r)=>sum+r.shards.filter(s=>s.visible).length,0)}:null;
   renderer.update({...model,leaves:[],buds:[],blooms:[]},true);const clearedPools=renderer.leafPool?renderer.leafPool.every(n=>!n.visible)&&renderer.budPool.every(r=>!r.root.visible)&&renderer.bloomPool.every(r=>!r.root.visible):null;
   renderer.update(model,false);const disabledHidden=!renderer.root.visible;renderer.update(model,true);
   petal.push({png,lowPng,clears,drawsPerFrame:draws/60,instructions:dynamicInstructions.reduce((x,y)=>x+y,0),objects:dynamicInstructions.length,lowCounts,clearedPools,disabledHidden});scene.removeChild(renderer.root);
  }
  const dragon=[];
  for(const Module of [oldDragon,newDragon]){
   const renderer=new Module.InkDragonRenderer();scene.addChild(renderer.root);
   const path=Array.from({length:220},(_,i)=>({x:150+Math.sin(i/219*Math.PI*4)*105,y:220+i*3.5}));
   const model={effects:[{id:1,kind:'dragon',path,age:.9,duration:3.3}],selected:null,path:[]};
   let samples=0;const sample=DragonRoute.prototype.sample;DragonRoute.prototype.sample=function(...args){samples++;return sample.apply(this,args);};
   renderer.update(model,false);DragonRoute.prototype.sample=sample;a.app.render();
   const png=await a.app.renderer.extract.base64({target:a.app.stage,resolution:1});
   const rig=renderer.active.get(1),paths=rig.ribbons.context.instructions.map(i=>JSON.stringify(i.data.path.instructions));
   dragon.push({png,samples,paths});scene.removeChild(renderer.root);
  }
  const mask=[];
  for(const Module of [oldBrush,newBrush]){
   const renderer=new Module.BrushUpgradeRenderer(),bounds={left:26,right:694,top:300,bottom:990};
   const {BrushUpgrades}=await import('/src/gameplay/brush-upgrades.ts'),model=new BrushUpgrades();
   let clears=0;const clear=renderer.clip.clear.bind(renderer.clip);renderer.clip.clear=(...args)=>{clears++;return clear(...args);};
   for(let i=0;i<60;i++)renderer.update(model,true,false,bounds);const stableClears=clears;
   renderer.update(model,true,false,{...bounds,top:320});const resizedClears=clears-stableClears;
   mask.push({stableClears,resizedClears});
  }
  return{petal,dragon,mask,gl:a.app.renderer.gl.getError()};
 },pixiPath);
 async function pixels(a,b,prefix){
  const aa=Buffer.from(a.split(',')[1],'base64'),bb=Buffer.from(b.split(',')[1],'base64');await writeFile(`${folder}/${prefix}-before.png`,aa);await writeFile(`${folder}/${prefix}-after.png`,bb);
  const x=await sharp(aa).ensureAlpha().raw().toBuffer(),y=await sharp(bb).ensureAlpha().raw().toBuffer();assert.equal(x.length,y.length);let changed=0,error=0;for(let i=0;i<x.length;i++){const e=Math.abs(x[i]-y[i]);error+=e;if(e>8)changed++;}return{changedChannels:changed/ x.length,meanAbsoluteError:error/x.length};
 }
 report.petalPixels=await pixels(report.petal[0].png,report.petal[1].png,'petal');report.petalLowPixels=await pixels(report.petal[0].lowPng,report.petal[1].lowPng,'petal-low');report.dragonPixels=await pixels(report.dragon[0].png,report.dragon[1].png,'dragon');
 assert.deepEqual(report.dragon[0].paths,report.dragon[1].paths,'dragon ribbons preserve the exact contour command sequence');assert.ok(report.dragon[1].samples<report.dragon[0].samples*.5);
 assert.ok(report.petalPixels.changedChannels<.025,'pooled decorative artwork should preserve the reference image');
 assert.ok(report.petalLowPixels.changedChannels<.025);assert.ok(report.petal[1].drawsPerFrame<report.petal[0].drawsPerFrame*.25,'static decorations must no longer be repainted');
 assert.deepEqual(report.petal[1].lowCounts,{leaves:36,shards:20});assert.ok(report.petal[1].clearedPools);assert.ok(report.petal.every(p=>p.disabledHidden));
 assert.equal(report.mask[0].stableClears,60);assert.equal(report.mask[1].stableClears,1);assert.equal(report.mask[1].resizedClears,1);
 for(const p of report.petal){delete p.png;delete p.lowPng;}for(const d of report.dragon){delete d.png;delete d.paths;}
 assert.deepEqual(errors,[]);assert.equal(report.gl,0);await writeFile(`${folder}/verification.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
}
