import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
const folder='screenshots/slash-lv1-restored';await mkdir(folder,{recursive:true});
await copyFile('screenshots/slash-length/lv1-400.png',`${folder}/before.png`);
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const [name,length,angle,time,hit] of [['blade',300,0,.10,false],['wake',300,0,.18,false],['fade',300,0,.26,false],['short-diagonal',100,.7,.14,false],['vertical',180,-Math.PI/2,.14,false],['reverse',300,Math.PI,.14,false],['impact',300,0,.12,true]]){
  const result=await page.evaluate(async({length,angle,time,hit})=>{
   const {recognize}=await import('/src/input/recognizer.ts');const a=window.__LINGHU__;
   a.input.cancel();a.game.start(false,true);a.game.director.disabled=true;a.game.practiceLevels.line=1;a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.ui.show(a.game.state,a.game);a.practiceUI.update();
   const d={x:Math.cos(angle),y:Math.sin(angle)},center={x:360,y:550};
   if(hit)for(const f of [-.25,.25]){const e=a.game.spawn('ink',{x:center.x+d.x*length*f,y:center.y+d.y*length*f});e.hp=e.maxHp=5000;e.ai='Telegraph';e.stateAge=-100;e.speed=0;}
   const pts=[{x:center.x-d.x*length/2,y:center.y-d.y*length/2},{x:center.x+d.x*length/2,y:center.y+d.y*length/2}];
   a.input.event({...pts[0],kind:'down',id:300});a.input.event({...pts[1],kind:'move',id:300});a.input.event({...pts[1],kind:'up',id:300});
   const s=a.game.skills[0];if(!s?.slash)throw Error('actual handwritten slash did not cast');
   for(let i=0;i<Math.round(time*60);i++){a.game.advance(1/60);for(const e of a.game.drain())a.view.event(e);a.input.update(1/60);a.view.update(a.game,a.input,1/60,60,1/60);}
   a.app.render();const item=a.view.slashes.items.get(s.id);
   return {length,angle,time,range:s.range,damage:s.damage,visible:item.evolution.root.visible,edge:item.evolution.core.context.instructions.length,wake:item.evolution.flames.context.instructions.length,hits:s.hit.size,glError:a.app.renderer.gl?.getError()??0};
  },{length,angle,time,hit});
  assert.ok(Math.abs(result.range-length*1.5)<1e-7);assert.equal(result.damage,60);assert.equal(result.visible,true);assert.ok(result.edge>0&&result.wake>0);assert.equal(result.hits,hit?2:0);assert.equal(result.glError,0);
  await page.locator('#app').screenshot({path:`${folder}/${name}.png`});results.push(result);
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));
 console.log('PASS browser: real handwriting, layered Lv1, three phases, short/vertical/reverse strokes, actual hits and no page/WebGL errors');
}finally{await browser.close();}
