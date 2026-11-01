import {chromium} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const label=process.env.PERF_LABEL??'latest',folder='docs/performance/mountain';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
if(process.env.PERF_BASELINE_SKILLS==='1'){
 const sources={
  'brush-line.ts':'screenshots/brush-line-art/baseline-module.js',
  'thunder-brush.ts':'output/thunder-brush-polish/thunder-brush-baseline.js',
  'petal-brush.ts':'output/skill-restyle/flower/baseline.js',
  'ink-carp.ts':'output/skill-restyle/carp/baseline.js',
 };
 for(const [name,file]of Object.entries(sources)){const body=await readFile(file,'utf8');await page.route(`**/src/rendering/${name}*`,route=>route.fulfill({contentType:'text/javascript',body}));}
}
try{
 await page.goto((process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184')+'/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 const report=await page.evaluate(async()=>{
  const a=window.__LINGHU__,{game:g,view:v,app,input}=a,gl=app.renderer.gl;
  const summary=n=>{n.sort((a,b)=>a-b);return{median:+n[Math.floor(n.length*.5)].toFixed(3),p95:+n[Math.floor(n.length*.95)].toFixed(3)};};
  const environment={resolution:app.renderer.resolution,canvas:[app.canvas.width,app.canvas.height],maxFPS:app.ticker.maxFPS,userAgent:navigator.userAgent};
  const results=[];
  let drawCount=0,uploadBytes=0,transferBytes=0;const glOriginals={};
  for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced'])if(gl[name]){glOriginals[name]=gl[name];gl[name]=function(...args){drawCount++;return glOriginals[name].apply(this,args);};}
  for(const name of ['bufferData','bufferSubData']){glOriginals[name]=gl[name];gl[name]=function(...args){const data=args[name==='bufferData'?1:2];uploadBytes+=typeof data==='number'?data:data?.byteLength??0;transferBytes+=typeof data==='number'?data:data?(args[4]?args[4]:(data.length??data.byteLength)-(args[3]??0))*(data.BYTES_PER_ELEMENT??1):0;return glOriginals[name].apply(this,args);};}
  for(const scenario of [{name:'monsters14',count:14,effects:false},{name:'mixed14',count:14,effects:true},{name:'mixed35',count:35,effects:true}]){
   input.cancel();a.beginMountain(1);a.mountainUI.opened=false;g.director.disabled=true;g.hualing.frozen=false;g.enemies=[];g.invulnerable=1e8;g.ink.setUnlimited(true);g.campaign.lastRoom=0;g.campaign.spawn=1e8;
   const u=g.hualing.upgrades;u.growth=false;u.panel=null;u.pending=0;
   for(let i=0;i<scenario.count;i++){const e=g.spawn(i%3===0?'crow':'ink',{x:70+i%7*90,y:340+Math.floor(i/7)*110});if(e)e.hp=e.maxHp=1e8;}
   if(scenario.effects){u.levels={spray:4,wide:4,splash:4,trail:4,line:4};u.begin({x:360,y:620});g.hualing.petals.activate();g.hualing.thunder.activate();g.hualing.releaseCollectedDragon({x:360,y:400});for(const kind of ['ward','beast','crescent']){g.collected.grant(kind);g.collected.use(g,kind,{x:360,y:620});}}
   const timings={},wrapped=[];
   for(const name of ['brushUpgrades','inkTrail','hualing','petals','thunderBrush','collected','crescentGuard','elites','chapterBosses','scrollLandscape']){
    const node=v[name],original=node.update;timings[name]=[];node.update=function(...args){const t=performance.now();const r=original.apply(this,args);timings[name].push(performance.now()-t);return r;};wrapped.push(()=>node.update=original);
   }
   const logic=[],view=[],ui=[],render=[],clears=[],nodes=[],draws=[],uploads=[],transfers=[];let clearCount=0;
   const Graphics=v.fx.constructor,originalClear=Graphics.prototype.clear;Graphics.prototype.clear=function(...args){clearCount++;return originalClear.apply(this,args);};
   const count=n=>1+(n.children??[]).reduce((s,c)=>s+count(c),0);
   for(let frame=0;frame<150;frame++){
    const q=frame*.11,p={x:360+Math.sin(q)*220,y:610+Math.sin(q*1.3)*180},next={x:360+Math.sin(q+.11)*220,y:610+Math.sin((q+.11)*1.3)*180};
    if(scenario.effects){u.trace(p,next,g.pen.id==='maple-thunder'?'maple-thunder':'cinnabar');g.hualing.petals.trace(p,next);g.hualing.thunder.trace(p,next);}
    clearCount=drawCount=uploadBytes=transferBytes=0;let t=performance.now();g.advance(1/60,false);for(const e of g.drain())v.event(e);const t1=performance.now();v.update(g,input,1/60,60,1/60);const t2=performance.now();a.mountainUI.update(v.ui.hud.y,v.ui.footer.y);a.collectedUI.update(v.ui.hud.y,v.ui.footer.y,false);const t3=performance.now();app.render();const t4=performance.now();
    if(frame>=50){logic.push(t1-t);view.push(t2-t1);ui.push(t3-t2);render.push(t4-t3);clears.push(clearCount);nodes.push(count(v.root));draws.push(drawCount);uploads.push(uploadBytes);transfers.push(transferBytes);}
    if(frame%6===0)await new Promise(requestAnimationFrame);
   }
   Graphics.prototype.clear=originalClear;wrapped.forEach(f=>f());
   results.push({...scenario,actualEnemies:g.enemies.length,logicMs:summary(logic),viewMs:summary(view),uiMs:summary(ui),renderSubmitMs:summary(render),drawCalls:summary(draws),bufferUploadBytes:summary(uploads),bufferTransferBytes:summary(transfers),graphicsClears:summary(clears),nodes:summary(nodes),renderers:Object.fromEntries(Object.entries(timings).map(([k,v])=>[k,summary(v.slice(50))])),gl:gl.getError()});
  }
  for(const [name,original]of Object.entries(glOriginals))gl[name]=original;
  return{environment,results,note:'Same desktop browser and deterministic campaign workload. CPU timings and render submission only; these are not phone FPS, GPU timings or temperature measurements. bufferUploadBytes counts submitted buffer capacity (including reserved space); bufferTransferBytes respects WebGL2 source offsets/lengths.'};
 });
 if(process.env.PERF_DIAGNOSTIC==='1')report.components=await page.evaluate(async()=>{
  const a=window.__LINGHU__,v=a.view,{app}=a,groups={full:[],brush:[v.brushUpgrades.root],dragon:[v.hualing.root],groundInk:[v.inkTrail.root,v.inkTrail.front],collected:[v.collected.root],petals:[v.petals.root],thunder:[v.thunderBrush.root],crescent:[v.crescentGuard.back,v.crescentGuard.front],landscape:[v.scrollLandscape.back,v.scrollLandscape.front],actors:[v.actors],feedback:[v.combatFeedback.root]},out=[];
  for(const [hidden,roots]of Object.entries(groups)){
   const times=[];
   for(let i=0;i<35;i++){v.update(a.game,a.input,0,60,0);const visible=roots.map(r=>r.visible);roots.forEach(r=>r.visible=false);const start=performance.now();app.render();if(i>=10)times.push(performance.now()-start);roots.forEach((r,j)=>r.visible=visible[j]);if(i%4===0)await new Promise(requestAnimationFrame);}
   times.sort((a,b)=>a-b);out.push({hidden,median:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)]});
  }return out;
 });
 await writeFile(`${folder}/${label}.json`,JSON.stringify({...report,errors},null,2));
 console.log(JSON.stringify({label,environment:report.environment,results:report.results,components:report.components,errors}));
}finally{await browser.close();}
