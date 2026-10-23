import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/slash-length';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173/?qa=1',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__LINGHU__);
 await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const level of [1,2,3,4,5])for(const length of [100,400]){
  const result=await page.evaluate(async({level,length})=>{
   const {recognize}=await import('/src/input/recognizer.ts');
   const a=window.__LINGHU__;a.game.start(false,true);a.game.director.disabled=true;
   a.game.practiceLevels.line=level;a.game.cast(recognize([{x:360-length/2,y:500},{x:360+length/2,y:500}]));
   const s=a.game.skills[0];a.game.update(.18);a.input.cancel();
   a.view.update(a.game,a.input,0,60,0);a.practiceUI.update();a.app.render();
   const item=a.view.slashes.items.get(s.id);
   return {level,length,range:s.range,visible:item.root.visible,glError:a.app.renderer.gl?.getError()??0};
  },{level,length});
  assert.equal(result.range,length*1.5);assert.equal(result.visible,true);assert.equal(result.glError,0);
  await page.locator('#app').screenshot({path:`${folder}/lv${level}-${length}.png`});results.push(result);
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));
 console.log('PASS browser: all five preserved effects at short/long drawn lengths, no page or WebGL errors');
}finally{await browser.close();}
