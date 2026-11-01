import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const base=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184',folder='screenshots/brush-line-art';
await mkdir(folder,{recursive:true});
if(process.env.CAPTURE_BASELINE==='1'){
 const response=await fetch(`${base}/src/rendering/brush-line.ts`);assert.ok(response.ok);await writeFile(`${folder}/baseline-module.js`,await response.text());console.log('Saved brush-line visual baseline');
}else{
 const baseline=await readFile(`${folder}/baseline-module.js`,'utf8'),pixiPath=baseline.match(/from "([^"]*pixi__js[^\"]*)"/)[1];
 const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 if(process.env.LINGHU_WEBGL1==='1')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:get.call(this,kind,...args);};});
 await page.route('**/src/rendering/brush-line-art-baseline.js',route=>route.fulfill({contentType:'text/javascript',body:baseline}));
 try{
  await page.goto(`${base}/?qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
  if(process.env.LINGHU_WEBGL1==='1')await page.evaluate(async()=>{const {installWechatTextureStyle}=await import('/src/platform/wechat-texture-style.ts');installWechatTextureStyle();const gl=window.__LINGHU__.app.renderer.gl;while(gl.getError()){};});
  const result=await page.evaluate(async pixiPath=>{
   const a=window.__LINGHU__;a.app.ticker.stop();
   const {Container,Graphics}=await import(pixiPath),{BrushLine}=await import('/src/gameplay/brush-line.ts');
   const [oldModule,newModule]=await Promise.all([import('/src/rendering/brush-line-art-baseline.js'),import('/src/rendering/brush-line.ts')]);
   const stage=a.app.stage;stage.removeChildren();stage.position.set(0);stage.scale.set(1);a.app.renderer.resize(720,1280);
   const scene=new Container();stage.addChild(scene);scene.addChild(new Graphics().rect(0,0,720,1280).fill(0x203537));
   const ground=new Graphics();for(let i=0;i<11;i++)ground.moveTo(40,320+i*65).lineTo(680,320+i*65).stroke({color:0x426061,width:.65,alpha:.16});scene.addChild(ground);
   const bounds={left:26,right:694,top:300,bottom:990},models={};
   const stroke=(m,p,q)=>{m.begin();m.trace(p,q);m.end(bounds);};
   for(const name of ['slash','cross','seal','borrow']){
    const m=new BrushLine();m.level=name==='slash'?1:name==='cross'?2:4;
    if(name==='slash')stroke(m,{x:100,y:670},{x:620,y:490});
    else if(name==='cross'){stroke(m,{x:150,y:420},{x:570,y:800});m.advance(.25,[],()=>{});stroke(m,{x:150,y:800},{x:570,y:420});}
    else{stroke(m,{x:130,y:770},{x:380,y:380});m.advance(.25,[],()=>{});stroke(m,{x:340,y:380},{x:600,y:770});m.advance(.25,[],()=>{});stroke(m,{x:100,y:690},{x:620,y:690});}
    if(name==='borrow'){m.advance(.9,[],()=>{});stroke(m,{x:65,y:560},{x:655,y:560});}
    const focus=m.effects.findLast(e=>e.kind===name);if(!focus)throw new Error('Missing real-stroke fixture '+name);models[name]={m,born:focus.born};
   }
   const renderers=[new oldModule.BrushLineRenderer(),new newModule.BrushLineRenderer()],poses=[],frames=[];
   for(const fixture of [{name:'slash',time:.08},{name:'cross',time:.09},{name:'seal',time:.26},{name:'seal',time:.6},{name:'seal',time:.72},{name:'seal',time:1.6},{name:'borrow',time:.6}]){
    const model=models[fixture.name];model.m.clock=model.born+fixture.time;const before=JSON.stringify(model.m);
    const images=[];
    for(const renderer of renderers){scene.addChild(renderer.root);renderer.update(model.m,true,false);a.app.render();images.push(await a.app.renderer.extract.base64({target:stage,resolution:1}));scene.removeChild(renderer.root);}
    if(JSON.stringify(model.m)!==before)throw new Error('Renderer mutated the gameplay model');poses.push({...fixture,images});
   }
   const renderer=renderers[1],model=models.seal;scene.addChild(renderer.root);
   for(let i=0;i<32;i++){model.m.clock=model.born+i*.045;renderer.update(model.m,true,false);a.app.render();frames.push(await a.app.renderer.extract.base64({target:stage,resolution:1}));}
   scene.removeChild(renderer.root);
   // Every animated blade starts at the original stroke / vertex and reaches the
   // original endpoint. No collision model, segment or timing is authored here.
   let anchorChecks=0,maxAnchorError=0;const check=(art,point,e)=>{maxAnchorError=Math.max(maxAnchorError,Math.hypot(art.position.x+e.center.x-point.x,art.position.y+e.center.y-point.y));anchorChecks++;};
   for(const name of ['slash','cross','seal','borrow']){const model=models[name];model.m.clock=model.born+(name==='seal'?.6:name==='borrow'?.57:.1);renderer.update(model.m,true,false);
    for(const rig of renderer.effects.values()){const e=rig.source;if(e.kind==='slash'||e.kind==='borrow')rig.blades.forEach((art,i)=>check(art,e.segments[i].a,e));if(e.kind==='cross')rig.blades.forEach(art=>check(art,e.center,e));if(e.kind==='seal'){rig.edges.forEach((art,i)=>check(art,e.vertices[i],e));rig.blades.forEach((art,i)=>{if(art.visible)check(art,e.vertices[i],e);});}}
   }
   const samples=[],stress=new BrushLine();stress.level=4;stress.clock=.58;
   for(let i=0;i<4;i++)for(const e of models.seal.m.effects)stress.effects.push({...e,id:i*100+e.id,born:e.born-.5,center:{...e.center},segments:e.segments,vertices:e.vertices});
   stress.traces=models.cross.m.traces;
   for(const renderer of renderers){scene.addChild(renderer.root);for(let i=0;i<20;i++){renderer.update(stress,true,false);a.app.render();}
    const clear=Graphics.prototype.clear,fill=Graphics.prototype.fill,stroke=Graphics.prototype.stroke;let clears=0,paints=0;
    Graphics.prototype.clear=function(...args){clears++;return clear.apply(this,args);};Graphics.prototype.fill=function(...args){paints++;return fill.apply(this,args);};Graphics.prototype.stroke=function(...args){paints++;return stroke.apply(this,args);};
    const times=[];for(let i=0;i<120;i++){const start=performance.now();renderer.update(stress,true,false);times.push(performance.now()-start);}times.sort((x,y)=>x-y);
    Graphics.prototype.clear=clear;Graphics.prototype.fill=fill;Graphics.prototype.stroke=stroke;
    const gl=a.app.renderer.gl,originals={},gpu={drawCalls:0,uploadBytes:0};
    for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced'])if(gl[name]){originals[name]=gl[name];gl[name]=function(...args){gpu.drawCalls++;return originals[name].apply(this,args);};}
    for(const name of ['bufferData','bufferSubData']){originals[name]=gl[name];gl[name]=function(...args){const data=args[name==='bufferData'?1:2];if(typeof data==='number')gpu.uploadBytes+=data;else if(data){const offset=name==='bufferSubData'?(args[3]??0):0,count=name==='bufferSubData'?args[4]:undefined;gpu.uploadBytes+=data.BYTES_PER_ELEMENT?(count??data.length-offset)*data.BYTES_PER_ELEMENT:data.byteLength;}return originals[name].apply(this,args);};}
    const renderTimes=[];for(let i=0;i<30;i++){renderer.update(stress,true,false);const start=performance.now();a.app.render();renderTimes.push(performance.now()-start);}renderTimes.sort((a,b)=>a-b);
    for(const [name,original]of Object.entries(originals))gl[name]=original;
    samples.push({effects:stress.effects.length,clearsPerFrame:clears/120,paintsPerFrame:paints/120,medianUpdateMs:times[60],p95UpdateMs:times[114],medianSubmitMs:renderTimes[15],drawCalls:gpu.drawCalls/30,uploadBytes:gpu.uploadBytes/30});scene.removeChild(renderer.root);
   }
   renderer.update({...models.slash.m,traces:[],effects:[]},true);const lifecycle={emptyTraces:renderer.traces.size,emptyEffects:renderer.effects.size};
   return{poses,frames,samples,maxAnchorError,anchorChecks,lifecycle,webgl:a.app.renderer.context.webGLVersion,gl:a.app.renderer.gl.getError()};
  },pixiPath);
  const previews=[];for(const [index,pose]of result.poses.entries()){
   const images=[];for(const [i,png]of pose.images.entries()){const data=Buffer.from(png.split(',')[1],'base64');const name=`${pose.name}-${pose.time}-${i?'after':'before'}-gl${result.webgl}.png`;await writeFile(`${folder}/${name}`,data);images.push(await sharp(data).extract({left:40,top:330,width:640,height:650}).resize(320,325).toBuffer());}
   previews.push({input:images[0],left:0,top:index*325},{input:images[1],left:320,top:index*325});delete pose.images;
  }
  await sharp({create:{width:640,height:325*result.poses.length,channels:4,background:'#203537'}}).composite(previews).png().toFile(`${folder}/before-after-gl${result.webgl}.png`);
  if(result.webgl===2){const frames=await Promise.all(result.frames.map(png=>sharp(Buffer.from(png.split(',')[1],'base64')).extract({left:40,top:330,width:640,height:650}).resize(480,488).ensureAlpha().raw().toBuffer()));await sharp(Buffer.concat(frames),{raw:{width:480,height:488*frames.length,channels:4,pageHeight:488}}).gif({loop:0,delay:frames.map(()=>45)}).toFile(`${folder}/sancai-animation.gif`);}
  delete result.frames;assert.equal(result.gl,0);assert.equal(result.maxAnchorError,0);assert.ok(result.anchorChecks>=16);assert.deepEqual(result.lifecycle,{emptyTraces:0,emptyEffects:0});assert.deepEqual(errors,[]);assert.ok(result.samples[1].clearsPerFrame<=1);assert.equal(result.samples[1].paintsPerFrame,0);
  await writeFile(`${folder}/verification-gl${result.webgl}.json`,JSON.stringify({...result,errors},null,2));console.log(JSON.stringify({...result,errors},null,2));
 }finally{await browser.close();}
}
