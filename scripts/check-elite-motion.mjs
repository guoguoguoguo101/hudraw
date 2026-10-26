import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='screenshots/elite-motion';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:430,height:932}}),errors=[],report=[];
page.on('pageerror',e=>errors.push(e.message));
if(process.env.LINGHU_MOTION_WEBGL1)await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:get.call(this,kind,...args);};});
try{
 for(let retry=0;;retry++){try{await page.goto('http://127.0.0.1:5173/?mode=hualing&qa=1',{waitUntil:'domcontentloaded'});break;}catch(e){if(retry)throw e;}}
 await page.waitForFunction(()=>window.__LINGHU__);if(process.env.LINGHU_MOTION_WEBGL1)await page.evaluate(async()=>{const {installWechatTextureStyle}=await import('/src/platform/wechat-texture-style.ts');installWechatTextureStyle();const gl=window.__LINGHU__.app.renderer.gl;while(gl.getError()){};});await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.director.disabled=true;a.playUI.formal=false;});
 const kinds=await page.evaluate(async()=>Object.keys((await import('/src/rendering/elite-motion.ts')).ELITE_BONES));
 for(const kind of kinds){
  await mkdir(`${dir}/${kind}`,{recursive:true});
  await page.evaluate(kind=>{const a=window.__LINGHU__;a.game.clearHualingElites();a.game.summonHualingElite(kind);a.view.update(a.game,a.input,0,60,0);},kind);
  await page.waitForFunction(kind=>window.__LINGHU__.view.elites.assets.has(kind),kind);
  const poses=[];
  for(const action of ['idle','prepare','cast','impact','parry','break','recall']){
   const result=await page.evaluate(async action=>{const a=window.__LINGHU__,e=a.game.enemies.find(e=>e.elite),s=e.elite,Rectangle=a.app.screen.constructor;
    s.clock=10;s.age=action==='prepare'?.85:action==='break'?.4:1;s.phase=action==='prepare'?'windup':action==='break'?'stagger':action==='recall'?'recover':'dash';s.motion={action,age:.08,power:1,side:1,serial:1};e.hit=action==='parry'?.22:0;
    a.view.update(a.game,a.input,0,60,0);a.app.render();const p=a.view.elites.rigs.get(e.id).puppet;if(!p)throw Error('missing puppet');const positions=Array.from(p.mesh.geometry.positions);
    for(const v of positions)if(!Number.isFinite(v))throw Error('nonfinite vertex');
    const png=await a.app.renderer.extract.base64({target:p.root,frame:new Rectangle(-155,-155,310,310),resolution:1,clearColor:'#253b44'});
    p.update(e);const before=Array.from(p.mesh.geometry.positions);for(let i=0;i<20;i++)p.update(e);const stable=before.every((v,i)=>v===p.mesh.geometry.positions[i]);
    return {positions,png,stable,gl:a.app.renderer.gl.getError()};
   },action);
   assert.equal(result.gl,0);assert.equal(result.stable,true);await writeFile(`${dir}/${kind}/${action}.png`,Buffer.from(result.png.split(',')[1],'base64'));poses.push(result.positions);
  }
  const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i]))),charge=delta(poses[0],poses[1]),release=delta(poses[1],poses[2]);assert.ok(charge>2&&release>2,kind+' visible joints');
  report.push({kind,charge,release,vertices:poses[0].length/2,stable:true});
 }
 // Kill and summon again: geometry is disposable while the cached source remains usable.
 await page.evaluate(()=>{const a=window.__LINGHU__,e=a.game.enemies.find(e=>e.elite);e.hp=0;a.view.update(a.game,a.input,0,60,0);e.elite.clock+=.4;a.view.update(a.game,a.input,0,60,0);a.app.render();a.game.clearHualingElites();a.game.summonHualingElite('umbrella');a.view.update(a.game,a.input,0,60,0);a.app.render();});
 assert.deepEqual(errors,[]);await writeFile(`${dir}/verification.json`,JSON.stringify({report,errors},null,2));console.log('PASS 20 articulated skins: seven behavior poses, visible joints, deterministic paused rendering, disposal, no JS/WebGL errors');
}catch(e){console.error(e);process.exitCode=1;}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3000))]);process.exit(process.exitCode??0);}
