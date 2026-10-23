import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/moon-tail';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
 await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const [level,time,label] of [[1,.28,'lv1'],[2,.32,'lv2'],[3,.45,'lv3-recoil'],[4,.18,'lv4-spirit'],[4,.52,'lv4-wave'],[4,.85,'lv4-stamp']]){
  const result=await page.evaluate(async({level,time})=>{
   const a=window.__LINGHU__;a.game.start(false,true);a.game.director.disabled=true;a.game.practiceLevels.arc=level;a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.ui.show(a.game.state,a.game);a.practiceUI.update();
   for(const [x,y] of [[315,530],[360,515],[408,495],[325,395],[395,360],[180,400]]){const e=a.game.spawn('ink',{x,y});e.hp=e.maxHp=5000;e.ai='Telegraph';e.stateAge=-100;e.speed=0;}
   const pts=Array.from({length:90},(_,i)=>{const t=-Math.PI/2+i/89*Math.PI;return {x:360+Math.sin(t)*60,y:425-Math.cos(t)*60};});
   a.input.cancel();a.input.event({...pts[0],kind:'down',id:912});for(const p of pts.slice(1))a.input.event({...p,kind:'move',id:912});a.input.event({...pts.at(-1),kind:'up',id:912});
   const s=a.game.skills[0];if(!s?.moonTail)throw Error('actual input failed to cast arc');
   for(let i=0;i<Math.round(time*60);i++)a.game.advance(1/60);
   for(const event of a.game.drain())a.view.event(event);
   a.view.update(a.game,a.input,0,60,0);a.practiceUI.update();a.app.render();
   return {level,time,rune:s.rune,travel:s.moonTail.travel,hits:s.hit.size,positions:a.game.enemies.map(e=>({x:e.x,y:e.y,hp:e.hp})),glError:a.app.renderer.gl?.getError()??0};
  },{level,time});
  assert.equal(result.rune,'arc');assert.equal(result.glError,0);await page.locator('#app').screenshot({path:`${folder}/${label}.png`});results.push(result);
 }
 // New fifth button uses the same actual glyph auto-cast pipeline.
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.start(false,true);a.game.director.disabled=true;a.practiceUI.reset();a.practiceUI.update();a.view.update(a.game,a.input,0,60,0);a.app.render();});
 await page.locator('#app').screenshot({path:`${folder}/practice-five-skills.png`});
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));
 console.log('PASS browser: actual handwritten arcs, Lv1–Lv4 phases, five skill controls, no page/WebGL errors');
}finally{await browser.close();}
