import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const folder='screenshots/combat-feedback';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:430,height:932}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function render(dt=0){return page.evaluate(dt=>{const a=window.__LINGHU__;for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,dt,60,dt);a.app.render();},dt);}
try{
 await page.goto('http://127.0.0.1:5173/?mode=hualing&qa=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.director.disabled=true;a.game.enemies=[];a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;for(const [x,y,kind] of [[190,490,'ink'],[360,470,'crow'],[530,490,'ink']]){const e=a.game.spawn(kind,{x,y});e.ai='Approach';e.hp=e.maxHp=100;e.speed=0;}});await render();
 assert.equal(await page.evaluate(()=>window.__LINGHU__.view.combatFeedback.health.size),3);
 // Use the actual pointer pipeline to strike all three bodies in one sweep.
 const p=await page.evaluate(async()=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+100*v.scale,y:r.top+v.y+490*v.scale,end:r.left+620*v.scale};});
 await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.end,p.y,{steps:20});await page.mouse.up();await render();
 assert.deepEqual(await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>e.hp)),[70,70,70]);
 assert.deepEqual(await page.evaluate(()=>window.__LINGHU__.view.combatFeedback.numbers.map(n=>n.label.text)),['30','30','30']);await render(.1);
 await page.screenshot({path:`${folder}/sweep-430.png`});
 assert.ok(await page.evaluate(()=>[...window.__LINGHU__.view.combatFeedback.health.values()].every(h=>h.ratio>h.last)));
 await page.evaluate(()=>window.__LINGHU__.game.pause());const ages=await page.evaluate(()=>window.__LINGHU__.view.combatFeedback.numbers.map(n=>n.age));await render(.3);assert.deepEqual(await page.evaluate(()=>window.__LINGHU__.view.combatFeedback.numbers.map(n=>n.age)),ages);await page.evaluate(()=>window.__LINGHU__.game.pause());
 await render(.8);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.combatFeedback.numbers.length),0);
 await page.evaluate(()=>{const a=window.__LINGHU__,e=a.game.summonHualingElite('umbrella');e.elite.phase='approach';a.game.damage(e,30);});await render(.1);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.view.combatFeedback.numbers.at(-1).label.text),'25.5');
 await page.evaluate(()=>{const a=window.__LINGHU__,e=a.game.enemies.find(e=>e.elite);e.elite.phase='stagger';a.game.damage(e,30);a.game.damage(a.game.enemies.find(e=>!e.elite),100);});await render(.08);
 const labels=await page.evaluate(()=>window.__LINGHU__.view.combatFeedback.numbers.map(n=>({text:n.label.text,dead:n.dead})));assert.ok(labels.some(n=>n.text==='48'));assert.ok(labels.some(n=>n.text==='100'&&n.dead));
 await page.setViewportSize({width:375,height:667});await render();await page.screenshot({path:`${folder}/elite-kill-375.png`});
 await page.evaluate(()=>{const f=window.__LINGHU__.view.combatFeedback;for(let i=0;i<100;i++)f.hit(300,450,6,false);});assert.equal(await page.evaluate(()=>window.__LINGHU__.view.combatFeedback.numbers.length),32);await render(1);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.combatFeedback.numbers.length),0);
 await page.evaluate(()=>window.__LINGHU__.game.menu());await render();assert.equal(await page.evaluate(()=>window.__LINGHU__.view.combatFeedback.health.size),0);assert.deepEqual(errors,[]);
 console.log('PASS combat feedback: pointer sweep hits every target, health loss trails, exact damage after mitigation/weakness, kill style, pause, expiry, bounded pool, menu cleanup, 375/430 screenshots');
}catch(error){console.error(error);throw error;}finally{await browser.close();}
