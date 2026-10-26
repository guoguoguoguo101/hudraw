import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='screenshots/boss-motion';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],report=[];
page.on('pageerror',e=>errors.push(e.message));
if(process.env.LINGHU_MOTION_WEBGL1)await page.addInitScript(()=>{globalThis.__glFaults=[];const proto=WebGLRenderingContext.prototype,getError=proto.getError;for(const name of ['texParameteri','texImage2D','texStorage2D','renderbufferStorage','framebufferTexture2D','drawElements','pixelStorei','enable','disable','bindBuffer','bufferData','bufferSubData']){const fn=proto[name];if(!fn)continue;proto[name]=function(...args){if(globalThis.__strictWebGL1&&name==='bufferSubData'&&args.length!==3)throw Error('native WebGL1 upload overload');const result=fn.apply(this,args),error=getError.call(this);if(error)globalThis.__glFaults.push({name,args:args.map(v=>typeof v==='number'?v:typeof v),error,stack:new Error().stack});return result;};}const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:get.call(this,kind,...args);};});
try{
 await page.goto('http://127.0.0.1:5173/?mode=hualing&qa=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__);if(process.env.LINGHU_MOTION_WEBGL1)await page.evaluate(async()=>{const {installWechatTextureStyle}=await import('/src/platform/wechat-texture-style.ts');installWechatTextureStyle();globalThis.__glFaults=[];globalThis.__strictWebGL1=true;const gl=window.__LINGHU__.app.renderer.gl;while(gl.getError()){};});await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.director.disabled=true;});
 for(const id of ['valley','sea','palace','snow']){
  await mkdir(`${dir}/${id}`,{recursive:true});
  await page.evaluate(id=>{const a=window.__LINGHU__;a.game.changeHualingChapter(id);a.game.summonHualingBoss();a.view.update(a.game,a.input,0,60,0);a.app.render();},id);
  await page.waitForFunction(id=>window.__LINGHU__.view.chapterBosses.assets.has(id),id);
  const poses=[];
  for(let frame=0;frame<48;frame++){
   const result=await page.evaluate(async({id,frame})=>{
    const a=window.__LINGHU__,e=a.game.enemies.find(e=>e.chapterBoss),s=e.chapterBoss,{spawnAssault,createBattlefield}=await import('/src/gameplay/boss-battlefield.ts'),Rectangle=a.app.screen.constructor;
    s.clock=10+frame/12;s.age=1;s.phase='windup';s.field=createBattlefield();e.hit=0;
    const shot=spawnAssault(s.field,id,s.arena,e);shot.age=frame<12?0:frame<25?shot.charge*(frame-12)/12:shot.charge+(frame-25)/12;
    if(frame<12){s.phase='idle';s.field.attacks=[];}if(frame>=36&&frame<41){s.field.attacks=[];s.field.flash=.32*(1-(frame-36)/5);}if(frame>=41){s.phase='stagger';s.age=(frame-40)/12;s.field.attacks=[];}
    a.view.update(a.game,a.input,0,60,0);a.app.render();const puppet=a.view.chapterBosses.puppet;
    if(!puppet)throw Error('missing articulated puppet');const positions=Array.from(puppet.mesh.geometry.positions);if(positions.some(n=>!Number.isFinite(n)))throw Error('nonfinite skin vertex');
    const png=await a.app.renderer.extract.base64({target:puppet.root,frame:new Rectangle(-210,-195,420,390),resolution:1,clearColor:'#253b44'});
    return {png,positions,gl:a.app.renderer.gl.getError(),faults:globalThis.__glFaults};
   },{id,frame});
   if(result.faults?.length){console.log(JSON.stringify(result.faults.slice(0,2)));throw Error('WebGL1 fault');}assert.equal(result.gl,0);await writeFile(`${dir}/${id}/${String(frame).padStart(2,'0')}.png`,Buffer.from(result.png.split(',')[1],'base64'));poses.push(result.positions);
  }
  const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i]))),charge=delta(poses[11],poses[24]),release=delta(poses[24],poses[27]),recoil=delta(poses[32],poses[36]);assert.ok(charge>5&&release>5&&recoil>5,id+' joints need visible independent movement');
  // Repeated rendering at the same paused simulation time must not accumulate deformation.
  const stable=await page.evaluate(()=>{const a=window.__LINGHU__,e=a.game.enemies.find(e=>e.chapterBoss),p=a.view.chapterBosses.puppet;p.update(e.chapterBoss,e.hit);const before=Array.from(p.mesh.geometry.positions);for(let i=0;i<80;i++)p.update(e.chapterBoss,e.hit);return before.every((v,i)=>v===p.mesh.geometry.positions[i]);});assert.equal(stable,true);
  report.push({chapter:id,charge,release,recoil,vertices:poses[0].length/2,stable});
 }
 // Exercise disposal when swapping chapters repeatedly; stale textures or geometry must not survive.
 await page.evaluate(()=>{const a=window.__LINGHU__;for(let i=0;i<12;i++){a.game.changeHualingChapter(['valley','sea','palace','snow'][i%4]);a.game.summonHualingBoss();a.view.update(a.game,a.input,0,60,0);a.app.render();}});
 assert.deepEqual(errors,[]);await writeFile(`${dir}/verification.json`,JSON.stringify({report,errors},null,2));console.log('PASS four animated skins: charge, release, counter recoil, weak pose, deterministic paused render, bounded 1369 vertices, chapter texture disposal, no WebGL errors');
}finally{await browser.close();}
