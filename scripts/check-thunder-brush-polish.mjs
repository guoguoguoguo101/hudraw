import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
import sharp from 'sharp';

const base=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184',webgl1=process.env.LINGHU_WEBGL1==='1',folder='output/thunder-brush-polish',suffix=webgl1?'webgl1':'webgl2';
await mkdir(folder,{recursive:true});
if(process.env.PERF_CAPTURE==='1'){
 const response=await fetch(`${base}/src/rendering/thunder-brush.ts`);assert.ok(response.ok);await writeFile(`${folder}/thunder-brush-baseline.js`,await response.text());console.log('Captured thunder brush reference');
}else{
 const reference=await readFile(`${folder}/thunder-brush-baseline.js`,'utf8'),pixiPath=reference.match(/from "([^"]*pixi__js[^"]*)"/)[1];
 const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(webgl1)await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:get.call(this,kind,...args);};});
 await page.route('**/src/rendering/thunder-brush-polish-baseline.js',route=>route.fulfill({contentType:'text/javascript',body:reference}));
 try{
  await page.goto(`${base}/?qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
  if(webgl1)await page.evaluate(async()=>{const {installWechatTextureStyle}=await import('/src/platform/wechat-texture-style.ts');installWechatTextureStyle();while(window.__LINGHU__.app.renderer.gl.getError()){};});
  await page.evaluate(async pixiPath=>{
   const a=window.__LINGHU__;a.app.stop();const {Container,Graphics,Rectangle}=await import(pixiPath),{ThunderBrush}=await import('/src/gameplay/thunder-brush.ts'),before=await import('/src/rendering/thunder-brush-polish-baseline.js'),after=await import('/src/rendering/thunder-brush.ts');
   const scene=new Container();a.app.stage.removeChildren();a.app.stage.addChild(scene);scene.addChild(new Graphics().rect(0,0,720,1280).fill(0x263b40));
   const enemies=[[410,550],[450,650],[545,545],[585,665],[625,540]].map(([x,y],i)=>({id:i+1,x,y,hp:200,maxHp:200,kind:'ink',ai:'Approach'}));
   const markers=new Graphics();for(const e of enemies)markers.ellipse(e.x,e.y+10,21,29).fill({color:0x50646b}).ellipse(e.x-4,e.y,7,12).fill({color:0x7d8b87,alpha:.55});scene.addChild(markers);
   const renderers={before:new before.ThunderBrushRenderer(),after:new after.ThunderBrushRenderer()};for(const r of Object.values(renderers))scene.addChild(r.root);
   const input={drawing:true,exhausted:false,points:[]},hits=[];let model;
   const reset=()=>{model=new ThunderBrush();model.activate();hits.length=0;input.drawing=true;input.points=[];let previous={x:95,y:670};for(let i=0;i<=18;i++){const p={x:95+i*13,y:650+Math.sin(i/18*Math.PI*2)*26};input.points.push(p);model.trace(previous,p);previous=p;}model.begin(previous);window.__THUNDER_POLISH__.model=model;};
   window.__THUNDER_POLISH__={renderers,input,enemies,scene,Rectangle,hits,reset,advanceTo(t){while(model.clock<t-1e-8){const dt=Math.min(1/120,t-model.clock);if(model.clock>=.27){input.drawing=false;model.end();}model.advance(dt,enemies,(enemy,amount)=>hits.push({id:enemy.id,amount,at:model.clock}),input.drawing,{left:26,right:694,top:300,bottom:990});}}};reset();
  },pixiPath);
  const phases=[];
  for(const [name,time]of [['draw',0],['first-contact',1/120],['chain-delay',.04],['chain-arrival',.07],['settle',.15],['tail',.25],['cleared',.4]]){
   const result=await page.evaluate(async({time})=>{
    const a=window.__LINGHU__,f=window.__THUNDER_POLISH__;f.advanceTo(time);const images=[],state=JSON.stringify({arcs:f.model.arcs,links:f.model.links,contacts:f.model.contacts,clock:f.model.clock});
    for(const key of ['before','after']){for(const [name,r]of Object.entries(f.renderers))r.root.visible=name===key;const r=f.renderers[key];r.update(f.model,f.input,true,false);a.app.render();images.push(await a.app.renderer.extract.base64({target:f.scene,frame:new f.Rectangle(60,470,620,270),resolution:1}));assertState();}
    function assertState(){if(state!==JSON.stringify({arcs:f.model.arcs,links:f.model.links,contacts:f.model.contacts,clock:f.model.clock}))throw Error('Renderer mutated gameplay state');}
    const r=f.renderers.after;return{images,time,gl:a.app.renderer.gl.getError(),hits:f.hits.map(h=>({...h})),contacts:f.model.contacts.length,activeLinks:f.model.links.filter(l=>l.age>=0).length,delayedLinks:f.model.links.filter(l=>l.age<0).length,cached:r.linkRigs.size,glows:r.glow.root.children.filter(g=>g.visible).length};
   },{time});
   assert.equal(result.gl,0,`${name}: GL0`);assert.equal(result.cached,result.activeLinks);assert.ok(result.glows<=11);if(name==='chain-delay')assert.ok(result.delayedLinks>0);if(name==='cleared')assert.equal(result.cached,0);
   for(const [i,image]of result.images.entries())await writeFile(`${folder}/${name}-${i?'after':'before'}-${suffix}.png`,Buffer.from(image.split(',')[1],'base64'));delete result.images;phases.push({name,...result});
  }
  const motion={before:[],after:[]};await page.evaluate(()=>window.__THUNDER_POLISH__.reset());
  for(let frame=0;frame<26;frame++){
   const images=await page.evaluate(async time=>{const a=window.__LINGHU__,f=window.__THUNDER_POLISH__;f.advanceTo(time);const images=[];for(const key of ['before','after']){for(const [name,r]of Object.entries(f.renderers))r.root.visible=name===key;f.renderers[key].update(f.model,f.input,true,false);images.push(await a.app.renderer.extract.base64({target:f.scene,frame:new f.Rectangle(60,450,620,320),resolution:.75}));}return images;},frame/60);
   for(const [i,key]of ['before','after'].entries())motion[key].push(await sharp(Buffer.from(images[i].split(',')[1],'base64')).ensureAlpha().raw().toBuffer());
  }
  for(const key of ['before','after'])await sharp(Buffer.concat(motion[key]),{raw:{width:465,height:240*motion[key].length,channels:4,pageHeight:240}}).gif({delay:Array(26).fill(33),loop:0,colours:128,effort:3}).toFile(`${folder}/motion-${key}-${suffix}.gif`);
  const metrics=await page.evaluate(()=>{
   const a=window.__LINGHU__,f=window.__THUNDER_POLISH__;f.reset();f.advanceTo(.075);f.model.arcs=[];f.model.contacts=[];f.model.end();f.input.drawing=false;const results={};
   for(const key of ['before','after']){
    const r=f.renderers[key];r.update(f.model,f.input,true,false);let clears=0,strokes=0,cachedClears=0,cachedStrokes=0;const restores=[];
    const cached=new Set(r.linkRigs?[...r.linkRigs.values()].flatMap(v=>[v.shadow,v.rim,v.core]):[]);
    function visit(n){if(n.clear&&n.stroke)for(const name of ['clear','stroke']){const fn=n[name];restores.push(()=>n[name]=fn);n[name]=function(...args){if(name==='clear'){clears++;if(cached.has(n))cachedClears++;}else{strokes++;if(cached.has(n))cachedStrokes++;}return fn.apply(this,args);};}for(const c of n.children??[])visit(c);}visit(r.root);
    const samples=[];for(let i=0;i<120;i++){const start=performance.now();r.update(f.model,f.input,true,false);samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);for(const restore of restores)restore();results[key]={frames:120,clears,strokes,cachedClears,cachedStrokes,medianMs:samples[60],p95Ms:samples[114]};
   }
   const r=f.renderers.after,template=f.model.links[0];for(let cycle=0;cycle<30;cycle++){f.model.links=Array.from({length:20},(_,i)=>({...template,seed:1000+cycle*20+i,age:.08}));r.update(f.model,f.input,true,false);f.model.links=[];r.update(f.model,f.input,true,false);}
   const cache={active:r.linkRigs.size,spare:r.spare.length,children:r.linkLayer.children.length,glows:r.glow.root.children.length};
   let disabledClears=0;const clear=r.detail.clear;r.detail.clear=function(...args){disabledClears++;return clear.apply(this,args);};for(let i=0;i<120;i++)r.update(f.model,f.input,false,false);r.detail.clear=clear;
   f.reset();f.advanceTo(.07);r.update(f.model,f.input,true,false);const full=[...r.linkRigs.values()].map(v=>v.root.alpha),clock=f.model.clock;r.update(f.model,f.input,true,true);const low=[...r.linkRigs.values()].map(v=>v.root.alpha);r.update(f.model,f.input,true,true);const pausedClock=f.model.clock;a.app.render();
   return{results,cache,disabledClears,full,low,clock,pausedClock,gl:a.app.renderer.gl.getError(),webgl:a.app.renderer.context.webGLVersion};
  });
  assert.equal(metrics.results.after.cachedClears,0);assert.equal(metrics.results.after.cachedStrokes,0);assert.ok(metrics.results.after.strokes<metrics.results.before.strokes);assert.ok(metrics.cache.spare<=20&&metrics.cache.children<=20&&metrics.cache.glows<=12);assert.equal(metrics.cache.active,0);assert.equal(metrics.disabledClears,0);assert.deepEqual(metrics.full,metrics.low);assert.equal(metrics.clock,metrics.pausedClock);assert.equal(metrics.gl,0);assert.deepEqual(errors,[]);
  await writeFile(`${folder}/verification-${suffix}.json`,JSON.stringify({phases,metrics,errors},null,2));console.log(JSON.stringify({result:'PASS thunder polish',phases:phases.length,...metrics}));
 }finally{await browser.close();}
}
