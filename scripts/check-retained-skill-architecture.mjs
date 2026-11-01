import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import sharp from 'sharp';
const base=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184',folder='output/retained-skill-architecture';
await mkdir(folder,{recursive:true});
const names=['paper-dragon','collected-talismans'];
if(process.env.PERF_CAPTURE==='1'){
 for(const name of names){const r=await fetch(`${base}/src/rendering/${name}.ts`);assert.ok(r.ok);await writeFile(`${folder}/${name}-baseline.js`,await r.text());}
 console.log('Captured precomputed-skinning and retained-rune comparison baselines');
}else{
 const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 if(process.env.LINGHU_WEBGL1==='1')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:get.call(this,kind,...args);};});
 for(const name of names)await page.route(`**/src/rendering/${name}-architecture-baseline.js`,async route=>route.fulfill({contentType:'text/javascript',body:await readFile(`${folder}/${name}-baseline.js`,'utf8')}));
 try{
  await page.goto(`${base}/?qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
  if(process.env.LINGHU_WEBGL1==='1')await page.evaluate(async()=>{const {installWechatTextureStyle}=await import('/src/platform/wechat-texture-style.ts');installWechatTextureStyle();const gl=window.__LINGHU__.app.renderer.gl;while(gl.getError()){};});
  const pixiPath=(await readFile(`${folder}/paper-dragon-baseline.js`,'utf8')).match(/from "([^"]*pixi__js[^\"]*)"/)[1];
  const dragon=await page.evaluate(async pixiPath=>{
   const a=window.__LINGHU__;a.app.ticker.stop();const {Container,Graphics}=await import(pixiPath);
   const [oldModule,newModule]=await Promise.all([import('/src/rendering/paper-dragon-architecture-baseline.js'),import('/src/rendering/paper-dragon.ts')]);
   const scene=new Container();a.app.stage.removeChildren();a.app.stage.addChild(scene);scene.addChild(new Graphics().rect(0,0,720,1280).fill(0x203031));
   const wave=Array.from({length:144},(_,i)=>({x:80+i*3.8,y:650+Math.sin(i*.12)*90}));
   const paths=[Array.from({length:90},(_,i)=>({x:75+i*6.3,y:600})),wave,[...wave].reverse(),Array.from({length:140},(_,i)=>({x:360+Math.cos(i/139*Math.PI*2)*190,y:600+Math.sin(i/139*Math.PI*2)*145})),Array.from({length:90},(_,i)=>({x:360+Math.sin(i*.03)*10,y:260+i*6}))];
   const originals=[],updated=[];for(let index=0;index<2;index++){originals.push(new oldModule.PaperDragonActor(index));updated.push(new newModule.PaperDragonActor(index));}
   let maxVertexError=0,compared=0;const poses=[];
   for(let path=0;path<paths.length;path++)for(const time of [0,.17,.43,1,2.5])for(let index=0;index<2;index++){
    const before=originals[index],after=updated[index];before.update(paths[path],.83,time,index);after.update(paths[path],.83,time,index);
    for(let v=0;v<before.geometry.positions.length;v++){const x=before.geometry.positions[v],y=after.geometry.positions[v];if(!Number.isFinite(y))throw new Error('Nonfinite skin vertex');maxVertexError=Math.max(maxVertexError,Math.abs(x-y));compared++;}
    if(path===1&&time===.43&&index===0){for(const actor of [before,after]){scene.addChild(actor.root);a.app.render();poses.push(await a.app.renderer.extract.base64({target:a.app.stage,resolution:1}));scene.removeChild(actor.root);}}
   }
   const samples=[];
   for(const actor of [originals[0],updated[0]]){
    const sin=Math.sin,cos=Math.cos,hypot=Math.hypot;let sinCalls=0,cosCalls=0,hypotCalls=0;
    Math.sin=(...args)=>{sinCalls++;return sin(...args);};Math.cos=(...args)=>{cosCalls++;return cos(...args);};Math.hypot=(...args)=>{hypotCalls++;return hypot(...args);};
    actor.update(wave,1,.7,0);Math.sin=sin;Math.cos=cos;Math.hypot=hypot;
    for(let i=0;i<30;i++)actor.update(wave,1,i/60,0);
    const cpu=[];for(let i=0;i<120;i++){const start=performance.now();actor.update(wave,1,i/60,0);cpu.push(performance.now()-start);}cpu.sort((x,y)=>x-y);
    samples.push({sinCalls,cosCalls,hypotCalls,medianMs:cpu[60],p95Ms:cpu[114],vertices:actor.geometry.positions.length/2,triangles:actor.geometry.indices.length/3});
   }
   return{maxVertexError,compared,poses,samples,gl:a.app.renderer.gl.getError(),webgl:a.app.renderer.context.webGLVersion};
  },pixiPath);
  assert.ok(dragon.maxVertexError<=1/2048);assert.deepEqual(dragon.samples.map(s=>s.vertices),[4771,4771]);assert.deepEqual(dragon.samples.map(s=>s.triangles),[6096,6096]);
  const pixels=[];for(const [i,png]of dragon.poses.entries()){const data=Buffer.from(png.split(',')[1],'base64');await writeFile(`${folder}/paper-dragon-${i?'after':'before'}-${dragon.webgl}.png`,data);pixels.push(await sharp(data).ensureAlpha().raw().toBuffer());}
  let changed=0,total=0;for(let i=0;i<pixels[0].length;i++){const error=Math.abs(pixels[0][i]-pixels[1][i]);if(error>8)changed++;total+=error;}
  dragon.pixels={changedChannels:changed/pixels[0].length,meanAbsoluteError:total/pixels[0].length};delete dragon.poses;
  assert.ok(dragon.pixels.changedChannels<.0001);assert.equal(dragon.gl,0);
  const collected=await page.evaluate(async pixiPath=>{
   const a=window.__LINGHU__,{Container,Graphics}=await import(pixiPath),[oldModule,newModule]=await Promise.all([import('/src/rendering/collected-talismans-architecture-baseline.js'),import('/src/rendering/collected-talismans.ts')]);
   const scene=new Container();a.app.stage.removeChildren();a.app.stage.addChild(scene);scene.addChild(new Graphics().rect(0,0,720,1280).fill(0x203031));
   const kinds=['pulse','dragon','flower','thunder','beast','crab','heal','ward','storm','crescent'],bounds={left:26,right:694,top:300,bottom:990},results=[];
   const marks=Array.from({length:3},(_,beat)=>Array.from({length:21},(_,i)=>({x:70+(i*97+beat*23)%570,y:400+(i*47+beat*101)%480})));
   const fixtures=[{name:'pickups',cast:null,pulse:null,kindOffset:0},{name:'other-pickups',cast:null,pulse:null,kindOffset:2},...([1.05,1.60,2.15].map((age,i)=>({name:'storm-'+i,cast:{id:11,kind:'storm',x:360,y:620,age,marks},pulse:null,kindOffset:0}))),{name:'combined',cast:{id:11,kind:'storm',x:360,y:620,age:2.1,marks},ward:{id:12,kind:'ward',x:360,y:620,age:5.6},pulse:{x:360,y:620,age:.25},kindOffset:1}];
   for(const fixture of fixtures){
    const g={hualingPractice:true,state:'playing',hualing:{bounds},pulse:{effect:fixture.pulse},collected:{clock:2,pickups:Array.from({length:8},(_,i)=>({id:i+1,kind:kinds[(i+fixture.kindOffset)%kinds.length],x:100+i%4*170,y:420+Math.floor(i/4)*145})),casts:[fixture.cast,fixture.ward].filter(Boolean)}};
    const runs=[];
    for(const Module of [oldModule,newModule]){
     const renderer=new Module.CollectedTalismanRenderer();scene.addChild(renderer.root);renderer.update(g,false);a.app.render();const png=await a.app.renderer.extract.base64({target:a.app.stage,resolution:1});
     const originalStroke=Graphics.prototype.stroke,originalClear=Graphics.prototype.clear,originalFill=Graphics.prototype.fill;let clears=0,paints=0;
     Graphics.prototype.clear=function(...args){clears++;return originalClear.apply(this,args);};Graphics.prototype.stroke=function(...args){paints++;return originalStroke.apply(this,args);};Graphics.prototype.fill=function(...args){paints++;return originalFill.apply(this,args);};
     const times=[];for(let i=0;i<30;i++){const start=performance.now();renderer.update(g,false);times.push(performance.now()-start);}times.sort((a,b)=>a-b);
     Graphics.prototype.clear=originalClear;Graphics.prototype.stroke=originalStroke;Graphics.prototype.fill=originalFill;
     const gl=a.app.renderer.gl,originals={},gpu={drawCalls:0,uploadBytes:0};
     for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced'])if(gl[name]){originals[name]=gl[name];gl[name]=function(...args){gpu.drawCalls++;return originals[name].apply(this,args);};}
     for(const name of ['bufferData','bufferSubData']){originals[name]=gl[name];gl[name]=function(...args){const data=args[name==='bufferData'?1:2];if(typeof data==='number')gpu.uploadBytes+=data;else if(data){const offset=name==='bufferSubData'?(args[3]??0):0,count=name==='bufferSubData'?args[4]:undefined;gpu.uploadBytes+=data.BYTES_PER_ELEMENT?(count??data.length-offset)*data.BYTES_PER_ELEMENT:data.byteLength;}return originals[name].apply(this,args);};}
     for(let i=0;i<5;i++){renderer.update(g,false);a.app.render();}for(const [name,original]of Object.entries(originals))gl[name]=original;
     const iconVertices=renderer.supplies.rigs?[...renderer.supplies.rigs.values()].map(r=>a.app.renderer.graphicsContext.getGpuContext(r.art.context).geometryData.vertices.length/2):[];
     if(iconVertices.some(n=>n>=65535))throw new Error('Pickup icon exceeds the native batch vertex limit');
     runs.push({png,clearsPerFrame:clears/30,paintsPerFrame:paints/30,medianMs:times[15],p95Ms:times[28],drawCalls:gpu.drawCalls/5,uploadedBytes:gpu.uploadBytes/5,maxIconVertices:Math.max(0,...iconVertices)});
     renderer.update({...g,state:'menu'},false);scene.removeChild(renderer.root);renderer.root.destroy({children:true});
    }
    results.push({name:fixture.name,runs});
   }
   const {RetainedSkyThunder,RetainedRunePickups}=await import('/src/rendering/retained-rune-fx.ts'),sky=new RetainedSkyThunder(),cast={id:12,kind:'storm',age:1.05,marks};
   sky.update(cast,bounds,false);const original=sky.batches[0].bolts[0].path.context;sky.update(cast,{...bounds,top:320},false);const resized=sky.batches[0].bolts[0].path.context;sky.destroy();
   const pickups=new RetainedRunePickups(),one={id:1,kind:'flower',x:100,y:500};pickups.update([one],1);const shared=pickups.rigs.get(1).art.context;pickups.clear();pickups.update([one],2);const contextReused=pickups.rigs.get(1).art.context===shared&&!shared.destroyed;pickups.clear();
   return{results,lifecycle:{resizedContextReleased:original.destroyed,destroyedContextReleased:resized.destroyed,pickupContextReused:contextReused},gl:a.app.renderer.gl.getError()};
  },pixiPath);
  for(const result of collected.results){
   const pixels=[];for(const [i,run]of result.runs.entries()){const data=Buffer.from(run.png.split(',')[1],'base64');await writeFile(`${folder}/${result.name}-${i?'after':'before'}-${dragon.webgl}.png`,data);pixels.push(await sharp(data).ensureAlpha().raw().toBuffer());delete run.png;}
   let changed=0,error=0;for(let i=0;i<pixels[0].length;i++){const d=Math.abs(pixels[0][i]-pixels[1][i]);if(d>8)changed++;error+=d;}
   result.pixels={changedChannels:changed/pixels[0].length,meanAbsoluteError:error/pixels[0].length};assert.ok(result.pixels.changedChannels<.002,`${result.name}: retained effects must preserve the reference image`);
  }
  assert.equal(collected.gl,0);assert.ok(Object.values(collected.lifecycle).every(Boolean));assert.deepEqual(errors,[]);
  await writeFile(`${folder}/verification-webgl${dragon.webgl}.json`,JSON.stringify({dragon,collected,errors},null,2));console.log(JSON.stringify({dragon,collected,errors},null,2));
 }finally{await browser.close();}
}
