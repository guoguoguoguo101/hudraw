import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/advanced-spells';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const rune of ['z','wave','spiral'])for(let level=1;level<=4;level++){
  const result=await page.evaluate(async({rune,level})=>{
   const a=window.__LINGHU__,{glyphSample}=await import('/src/input/glyph-samples.ts');a.game.start(false,true);a.game.director.disabled=true;a.game.practiceLevels[rune]=level;a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.ui.show(a.game.state,a.game);a.practiceUI.reset();a.practiceUI.update();
   const p=glyphSample(rune).map(v=>({x:360+v.x,y:665+v.y}));
   for(const i of [15,55,95,135,175]){const v=rune==='spiral'?{x:360+Math.cos(i)*65,y:665+Math.sin(i)*65}:p[Math.min(p.length-1,i)];const e=a.game.spawn('ink',v);e.hp=e.maxHp=5000;e.ai='Telegraph';e.stateAge=-100;e.speed=0;}
   a.input.cancel();a.input.event({...p[0],kind:'down',id:912});for(const v of p.slice(1))a.input.event({...v,kind:'move',id:912});a.input.event({...p.at(-1),kind:'up',id:912});const s=a.game.skills[0];if(s?.rune!==rune)throw Error(`${rune} handwritten input failed`);
   const time=rune==='z'?([.42,.65,1.06,1.95][level-1]):rune==='wave'?([.46,.66,.86,1.35][level-1]):.5;
   for(let i=0;i<Math.round(time*60);i++){a.game.advance(1/60);for(const event of a.game.drain())a.view.event(event);a.view.update(a.game,a.input,1/60,60,0);}
   a.practiceUI.update();a.app.render();return {rune,level,time,hits:s.hit.size,nodes:s.thunder?.targets.length,arcs:s.wave?.segments.length,turns:s.binding?.turns,glError:a.app.renderer.gl?.getError()??0};
  },{rune,level});assert.equal(result.glError,0);await page.locator('#app').screenshot({path:`${folder}/${rune}-lv${level}.png`});results.push(result);
 }
 const buttons=await page.evaluate(()=>{
  const a=window.__LINGHU__;a.game.start(false,true);a.game.director.disabled=true;a.practiceUI.reset();a.view.begin();a.view.update(a.game,a.input,0,60,0);a.practiceUI.update();
  const out=[];for(const [i,rune] of ['line','circle','triangle','arc','z','wave','spiral'].entries()){a.game.skills=[];a.practiceUI.handle({x:106+i%4*172,y:1120+Math.floor(i/4)*82+a.practiceUI.root.y,kind:'down',id:42});const level=rune==='line'||rune==='circle'?5:4;a.practiceUI.handle({x:60+(level-.5)*(600/level),y:930+a.practiceUI.root.y,kind:'down',id:42});a.practiceUI.handle({x:106+i%4*172,y:1158+Math.floor(i/4)*82+a.practiceUI.root.y,kind:'down',id:42});const s=a.game.skills.at(-1);out.push({rune,result:s?.rune,level:s?.testLevel});}a.game.skills=[];a.view.update(a.game,a.input,0,60,0);a.practiceUI.update();a.app.render();return out;
 });for(const v of buttons){assert.equal(v.result,v.rune);assert.equal(v.level,v.rune==='line'||v.rune==='circle'?5:4);}await page.locator('#app').screenshot({path:`${folder}/practice-seven-skills.png`});
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,buttons,errors},null,2));console.log('PASS browser: 12 actual input stage renders, seven level/select/cast controls, zero page or WebGL errors');
}finally{await browser.close();}
