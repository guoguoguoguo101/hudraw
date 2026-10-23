import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/sancai';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:430,height:932}}),errors=[],results=[],handwritten=[];
page.on('pageerror',e=>errors.push(e.message));
async function draw(points){
 const coordinates=await page.evaluate(async points=>{
  const {gameViewport}=await import('/src/platform/viewport.ts');const r=window.__LINGHU__.app.canvas.getBoundingClientRect(),v=gameViewport(r.width,r.height);return points.map(p=>({x:r.left+v.x+p.x*v.width/720,y:r.top+v.y+p.y*v.height/1280}));
 },points);
 await page.mouse.move(coordinates[0].x,coordinates[0].y);await page.mouse.down();for(const p of coordinates.slice(1))await page.mouse.move(p.x,p.y);await page.mouse.up();
}
try{
 await page.goto('http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const form of ['small','large'])for(let level=1;level<=4;level++){
  const points=await page.evaluate(async({form,level})=>{
   const a=window.__LINGHU__,{sancaiSample}=await import('/src/input/glyph-samples.ts');a.input.cancel();a.game.start(false,true);a.game.director.disabled=true;a.game.practiceLevels.sancai=level;a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.ui.show(a.game.state,a.game);a.practiceUI.reset();a.practiceUI.update();
   const p=sancaiSample(form).map(v=>({x:360+v.x,y:665+v.y}));const e=a.game.spawn('oni',{x:510,y:520});e.ai='Telegraph';e.stateAge=-100;
   return p;
  },{form,level});
  // Real pointer events exercise browser coordinates, sampling, recognition and ink settlement.
  await draw(points);
  const state=await page.evaluate(({form,level})=>{
   const a=window.__LINGHU__,s=a.game.skills[0];if(s?.rune!=='sancai'||s.sancai.form!==form||s.testLevel!==level)throw Error(`Actual pointer input failed: ${form} ${level} ${s?.rune} ${s?.sancai?.form}`);
   const t=s.sancai;a.input.traceAge=2;return {form,level,arrival:t.arrival,splitAt:t.splitAt,destination:t.destination,vertices:t.triangle.vertices,duration:s.duration};
  },{form,level});
  const frames=form==='small'?[['flight',state.arrival*.55],['spin',state.arrival+.25],['split',state.splitAt+.12]]:[['array',.25],['sustain',state.duration/2],['ending',state.duration-.4]];
  for(const [name,time] of frames){
   const result=await page.evaluate(time=>{
    const a=window.__LINGHU__,s=a.game.skills[0];while(s.age+1e-8<time){const dt=Math.min(1/60,time-s.age);a.game.update(dt);for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,dt,60,0);}a.practiceUI.update();a.app.render();return {phase:s.sancai.phase,enemyHP:a.game.enemies[0].hp,infoText:a.practiceUI.info?.text,glError:a.app.renderer.gl?.getError()??0};
   },time);assert.equal(result.glError,0);assert.equal(result.enemyHP,240);if(name==='sustain'){assert.equal(result.phase,'sustain');assert.match(result.infoText,/余 .* 秒/);}await page.locator('#app').screenshot({path:`${folder}/${form}-lv${level}-${name}.png`});results.push({...state,frame:name,time,...result});
  }
 }
 for(const sample of [{scale:.55,round:.28,jitter:2.5,gap:.1},{scale:.8,round:.18,jitter:2.5,gap:.06},{scale:1.5,round:.28,jitter:2.5,gap:.1}]){
  const points=await page.evaluate(async sample=>{
   const a=window.__LINGHU__,{handTriangle}=await import('/tests/sancai-fixtures.ts'),{resample}=await import('/src/input/recognizer.ts');a.input.cancel();a.game.start(false,true);a.game.director.disabled=true;return resample(handTriangle(sample.scale,sample.round,sample.jitter,sample.gap),28);
  },sample);await draw(points);const rune=await page.evaluate(()=>window.__LINGHU__.game.skills[0]?.rune);assert.equal(rune,'sancai',JSON.stringify(sample));handwritten.push({...sample,rune});
 }
 const controls=await page.evaluate(()=>{
  const a=window.__LINGHU__,out=[];a.input.cancel();a.game.start(false,true);a.game.director.disabled=true;a.practiceUI.reset();a.practiceUI.root.y=a.view.ui.footer.y;a.practiceUI.update();
  for(let level=1;level<=4;level++){
   a.practiceUI.handle({x:622,y:1202+a.practiceUI.root.y,kind:'down',id:99});a.practiceUI.handle({x:60+(level-.5)*150,y:930+a.practiceUI.root.y,kind:'down',id:99});
   for(const [index,form] of ['small','large'].entries()){a.game.skills=[];a.practiceUI.handle({x:582+index*80,y:1240+a.practiceUI.root.y,kind:'down',id:99});const s=a.game.skills[0];out.push({level,form,actual:s?.sancai?.form,actualLevel:s?.testLevel});}
  }
  a.view.update(a.game,a.input,0,60,0);a.practiceUI.update();a.app.render();return out;
 });for(const c of controls){assert.equal(c.actual,c.form);assert.equal(c.actualLevel,c.level);}await page.locator('#app').screenshot({path:`${folder}/practice-eight-skills.png`});
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,handwritten,controls,errors},null,2));console.log(`PASS browser: 8 real pointer casts, ${results.length} stage captures, 3 rounded/gapped/jittered handwritten contours, 8 shared-level form buttons, no damage, zero page/WebGL errors`);
}finally{await browser.close();}
