import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('screenshots/ultimate-final',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1250,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5174/?lab=1&qa=1&ultimate=1');await page.waitForFunction(()=>window.__SLASH_PREVIEW__&&window.__LINGHU__);
await page.locator('select').first().selectOption(String(Math.PI*1.5));
for(const [name,time] of [['battle',.38],['charge',.075],['unfold',.145],['impact',.36],['trail',.65]]){
 await page.evaluate(t=>{window.__LINGHU__.app.ticker.stop();window.__SLASH_PREVIEW__.frame(4,t);window.__LINGHU__.app.render();},time);
 await page.locator('#app').screenshot({path:`screenshots/ultimate-final/${name}.png`});
}
await page.screenshot({path:'screenshots/ultimate-final/test-page.png'});
await page.locator('select').first().selectOption('0');await page.setViewportSize({width:1200,height:650});
await page.evaluate(()=>{const {view,app,game}=window.__LINGHU__;window.__SLASH_PREVIEW__.frame(4,.38);game.skills[0].slash.contacts=[];view.slashes.update(game.skills);view.root.children.forEach(c=>c.visible=c===view.world);view.world.children.forEach(c=>c.visible=c===view.slashes.root);view.slashes.root.mask=null;view.slashes.root.children[0].visible=false;for(const item of view.slashes.items.values())for(const ghost of item.ghosts?.values()??[])ghost.visible=false;view.world.position.set(-260,-365);app.renderer.resize(1100,600);const el=document.getElementById('app');el.style.width='1100px';el.style.height='600px';el.style.flexShrink='0';document.querySelector('.lab-panel').style.display='none';app.render();});
await page.locator('#app').screenshot({path:'screenshots/ultimate-final/skill.png'});
for(const [name,t] of [['stage1',.17],['stage2-opening',.255],['afterglow',.65]]){await page.evaluate(t=>{const {view,app,game}=window.__LINGHU__;window.__SLASH_PREVIEW__.frame(4,t);game.skills[0].slash.contacts=[];view.slashes.update(game.skills);view.world.position.set(-260,-365);for(const item of view.slashes.items.values())for(const ghost of item.ghosts?.values()??[])ghost.visible=false;app.render();},t);await page.locator('#app').screenshot({path:`screenshots/ultimate-final/${name}.png`});}
assert.deepEqual(errors,[]);console.log('PASS final live renderer: isolated skill, battle, unfolding/impact/trail, test page; no browser errors');await browser.close();
