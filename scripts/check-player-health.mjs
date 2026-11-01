import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/player-health';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
async function frame(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__,g=a.game;g.campaign.age+=seconds;for(const e of g.drain())a.view.event(e);
 a.view.update(g,a.input,seconds,60,seconds);a.mountainUI.update(a.view.ui.hud.y,a.view.ui.footer.y);a.app.render();
 const hud=a.mountainUI.combatHUD,h=hud.health;
 return {visible:hud.root.visible&&a.mountainUI.root.visible,value:h.value.text,status:h.status.text,nearby:h.nearby.context.instructions.length>0,trail:h.trail,life:g.life,max:g.maxHp,y:h.value.y,header:a.view.ui.hud.y,footer:a.view.ui.footer.y,rootY:a.view.fox.root.y,gl:a.app.renderer.gl.getError()};
},seconds);}
async function shot(name){const state=await frame();assert.equal(state.gl,0);await page.screenshot({path:`${folder}/${name}.png`});results.push({name,...state});return state;}
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5183'}/?qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.mountainUI);
 await page.evaluate(async()=>{const a=window.__LINGHU__;a.beginMountain(0);a.mountainUI.opened=false;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();a.game.enemies=[];a.game.hualing.frozen=true;a.game.life=a.game.maxHp=100;a.game.invulnerable=0;});
 let s=await shot('full-390');assert.equal(s.value,'100 / 100');assert.equal(s.status,'');assert.equal(s.nearby,false);assert.equal(s.visible,true);
 await page.evaluate(()=>{const g=window.__LINGHU__.game;g.hurt(24);});s=await frame(.1);assert.equal(s.value,'76 / 100');assert.equal(s.status,'受伤 −24');assert.equal(s.nearby,true);assert.ok(s.trail>.76);assert.equal(s.life,76);await shot('damage-390');
 await frame(1.2);s=await frame(.3);assert.equal(s.status,'');assert.equal(s.nearby,false);
 await page.evaluate(()=>{const g=window.__LINGHU__.game;g.invulnerable=0;g.hurt(51);});s=await frame(.1);assert.equal(s.value,'25 / 100');assert.equal(s.status,'受伤 −51');await frame(1.1);s=await shot('critical-390');assert.equal(s.status,'生命危险');assert.equal(s.nearby,true);
 await page.evaluate(()=>window.__LINGHU__.game.ink.setAmount(3));s=await shot('critical-low-ink-390');assert.equal(s.status,'生命危险');
 const positions=await page.evaluate(()=>{const a=window.__LINGHU__,h=a.mountainUI.combatHUD;return {healthBottom:h.health.value.y-24+82,inkTop:h.notice.y-21,buttonTop:a.view.ui.footer.y+1150};});assert.ok(positions.healthBottom<positions.inkTop);assert.ok(positions.inkTop+42<positions.buttonTop);
 await page.evaluate(()=>{const g=window.__LINGHU__.game;g.life=80;g.ink.setAmount(70);});s=await frame(.1);assert.equal(s.status,'恢复 +55');assert.equal(s.value,'80 / 100');assert.equal(s.nearby,false);
 await page.evaluate(()=>{const g=window.__LINGHU__.game;g.maxHp=140;g.life=119;});s=await frame(.1);assert.equal(s.value,'119 / 140');assert.equal(s.status,'');
 // Alerts freeze with the campaign clock, including when system time keeps advancing.
 const before=await frame();await page.waitForTimeout(200);assert.deepEqual(await frame(),before);
 for(const [chapter,id]of[[0,'valley'],[10,'sea'],[20,'palace'],[30,'snow']]){
  await page.evaluate(id=>{const a=window.__LINGHU__;a.beginMountain(id);a.mountainUI.opened=false;},chapter);
  await frame();await page.waitForFunction(()=>window.__LINGHU__.view.scrollLandscape.chapterReady);await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.hualing.frozen=true;a.game.enemies=[];a.game.life=25;a.game.maxHp=100;});
  await frame();await frame(1.1);s=await shot(`${id}-critical-390`);assert.equal(s.status,'生命危险');
 }
 for(const [width,height]of[[375,667],[430,932],[720,1280]]){await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));s=await shot(`critical-${width}`);assert.ok(s.y-24>=s.footer+990);}
 await page.evaluate(()=>window.__LINGHU__.action('pause'));s=await frame();assert.equal(s.visible,false);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.action('resume');a.app.ticker.stop();a.game.hualing.upgrades.panel='custom';});s=await frame();assert.equal(s.visible,false);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.hualing.upgrades.panel=null;a.mountainUI.open();});assert.equal((await frame()).visible,false);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,positions,errors},null,2));
 console.log('PASS player health: real damage, exact values, healing, critical/local warnings, max HP, alert layout, paused clock, four chapter backgrounds and mobile sizes');
}finally{await browser.close();}
