import {chromium} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const folder='output/skill-restyle/carp';await mkdir(folder,{recursive:true});
const webgl1=process.env.LINGHU_WEBGL1==='1',browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:430,height:780}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
if(webgl1)await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:get.call(this,kind,...args);};});
await page.route('**/src/rendering/ink-carp-restyle-baseline.js',async route=>route.fulfill({contentType:'text/javascript',body:await readFile(folder+'/baseline.js','utf8')}));
try{
 await page.goto((process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184')+'/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
 if(webgl1)await page.evaluate(async()=>{const {installWechatTextureStyle}=await import('/src/platform/wechat-texture-style.ts');installWechatTextureStyle();while(window.__LINGHU__.app.renderer.gl.getError()){};});
 await page.evaluate(async()=>{
  const a=window.__LINGHU__;a.app.ticker.stop();const {InkCarpRenderer:Before}=await import('/src/rendering/ink-carp-restyle-baseline.js'),{InkCarpRenderer:After}=await import('/src/rendering/ink-carp.ts'),{InkCarp}=await import('/src/gameplay/ink-carp.ts');
  a.beginMountain(0);a.mountainUI.opened=false;a.game.enemies=[];a.game.hualing.frozen=true;a.view.update(a.game,a.input,0,60,0);a.app.stage.removeChildren();
  const Container=a.view.root.constructor,Graphics=a.view.fx.constructor,root=new Container(),before=new Before(),after=new After();root.addChild(new Graphics().rect(0,0,720,1280).fill(0x1c3436),before.root,after.root);a.app.stage.addChild(root);
  window.__CARP_ART_QA__={a,InkCarp,before,after};
 });
 const results=[];
 for(const [name,time]of [['entry',.07],['flight',.24],['landing',.57],['crest',.68],['fade',.87]]){
  for(const mode of ['before','after']){
   const state=await page.evaluate(({time,mode})=>{const q=window.__CARP_ART_QA__,m=new q.InkCarp();m.level=4;m.bounds={left:26,right:694,top:200,bottom:1100};m.begin();m.trace({x:110,y:650},{x:200,y:650});m.end();m.advance(time,[],()=>{});q.before.root.visible=mode==='before';q.after.root.visible=mode==='after';q[mode].update(m,true,false);q.a.app.render();return{fishes:m.fishes.length,age:m.fish?.age,burst:m.fish?.burst,gl:q.a.app.renderer.gl.getError()};},{time,mode});
   assert.equal(state.fishes,1);assert.equal(state.gl,0);results.push({name,mode,...state});await page.locator('canvas').screenshot({path:folder+'/'+mode+'-'+name+(webgl1?'-webgl1':'')+'.png'});
  }
 }
 const frames=[];
 if(!webgl1){
  for(let i=0;i<30;i++){
   await page.evaluate(time=>{const q=window.__CARP_ART_QA__,m=new q.InkCarp();m.level=4;m.bounds={left:26,right:694,top:200,bottom:1100};m.begin();m.trace({x:110,y:650},{x:200,y:650});m.end();m.advance(time,[],()=>{});q.before.root.visible=false;q.after.root.visible=true;q.after.update(m,true);q.a.app.render();},.01+i/32);
   frames.push(await page.locator('canvas').screenshot());
  }
  const size=await sharp(frames[0]).metadata(),raw=[];for(const frame of frames)raw.push(await sharp(frame).ensureAlpha().raw().toBuffer());
  await sharp(Buffer.concat(raw),{raw:{width:size.width,height:size.height*frames.length,channels:4,pageHeight:size.height}}).gif({loop:0,delay:Array(frames.length).fill(45)}).toFile(folder+'/carp-motion.gif');
 }
 const checks=await page.evaluate(()=>{
  const q=window.__CARP_ART_QA__,Graphics=q.a.view.fx.constructor,gl=q.a.app.renderer.gl,report=[];
  for(const mode of ['before','after']){
   const m=new q.InkCarp();m.level=3;m.begin();m.trace({x:200,y:600},{x:230,y:600});m.end();m.advance(.24,[],()=>{});const r=q[mode];q.before.root.visible=mode==='before';q.after.root.visible=mode==='after';r.update(m,true);q.a.app.render();
   const oldClear=Graphics.prototype.clear;let clears=0;Graphics.prototype.clear=function(...args){clears++;return oldClear.apply(this,args);};const times=[];
   for(let i=0;i<120;i++){const start=performance.now();r.update(m,true);times.push(performance.now()-start);}Graphics.prototype.clear=oldClear;times.sort((a,b)=>a-b);
   r.update(m,false);report.push({mode,clears,medianMs:times[60],hidden:!r.root.visible,gl:gl.getError()});
  }
  const r=q.after,m=new q.InkCarp();for(let round=0;round<12;round++){m.reset();m.level=4;m.begin();m.trace({x:160,y:600},{x:210,y:600});m.end();m.advance(.6,[],()=>{});r.update(m,true);m.reset();r.update(m,true);}
  return{report,actors:r.actors.length,visible:r.actors.filter(a=>a.root.visible).length,sprites:r.actors.reduce((n,a)=>n+a.glow.root.children.length,0),gl:gl.getError()};
 });
 assert.ok(checks.report.every(r=>r.gl===0&&r.hidden));assert.ok(checks.actors<=6&&checks.sprites<=checks.actors*2);assert.equal(checks.visible,0);assert.equal(checks.gl,0);assert.deepEqual(errors,[]);
 await writeFile(folder+'/verification'+(webgl1?'-webgl1':'')+'.json',JSON.stringify({results,checks,errors},null,2));console.log('PASS ink carp restyle: real flight/landing times, original carp body, pooled paper accents and local glows, cleanup, bounded nodes and GL0');
}finally{await browser.close();}
