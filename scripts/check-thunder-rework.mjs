import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage({viewport:{width:1180,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:5173/?lab=1&thunder=1&qa=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__THUNDER_PREVIEW__&&window.__LINGHU__);await p.evaluate(()=>window.__LINGHU__.app.ticker.stop());
await mkdir('screenshots/thunder-rework',{recursive:true});
for(const [i,t] of [.7,1.4,1.7,2.2,3.7,4.6].entries()){
 await p.evaluate(t=>{window.__THUNDER_PREVIEW__.frame(4,t);window.__LINGHU__.app.render();},t);
 await p.locator('#app').screenshot({path:`screenshots/thunder-rework/stage-${i}.png`});
 if(t<1.65)assert.equal(await p.evaluate(()=>window.__LINGHU__.game.skills[0].hit.size),0);
 if(t===2.2){assert.equal(await p.evaluate(()=>window.__LINGHU__.game.skills[0].hit.size),8);assert.equal(await p.evaluate(()=>[...window.__LINGHU__.view.thunder.items.values()][0].ultimate.foxTailLayers.length),9);}
}
assert.equal(await p.evaluate(()=>window.__LINGHU__.view.thunder.items.size),0);assert.deepEqual(errors,[]);await b.close();console.log('PASS six phase frames, nine independent tails, delayed eight impacts, cleanup and no page errors');
