import {chromium} from '@playwright/test';
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
await mkdir('screenshots/ultimate-rework',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1250,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/?lab=1&qa=1&ultimate=1');await page.waitForFunction(()=>window.__SLASH_PREVIEW__&&window.__LINGHU__);const frames=[];
for(const variant of ['A','B']){
 await page.evaluate(v=>{window.__LINGHU__.app.ticker.stop();window.__SLASH_PREVIEW__.variant(v);},variant);
 for(const [name,angle,time] of [['horizontal',0,.235],['diagonal',Math.PI/4,.235],['charge',0,.075],['main',0,.16],['burst',0,.28],['trail',0,.46]]){
  await page.locator('select').first().selectOption(String(angle));
  await page.evaluate(t=>{window.__SLASH_PREVIEW__.frame(4,t);window.__LINGHU__.app.render();},time);
  const buf=await page.locator('#app').screenshot({path:`screenshots/ultimate-rework/${variant}-${name}.png`});if(name==='horizontal')frames.push(await sharp(buf).resize(432,768).toBuffer());
 }
 // Standalone skill silhouette uses the same live procedural renderer.
 await page.locator('select').first().selectOption('0');
 await page.setViewportSize({width:1200,height:650});await page.evaluate(()=>{const {view,app}=window.__LINGHU__;window.__SLASH_PREVIEW__.frame(4,.235);view.root.children.forEach(c=>c.visible=c===view.world);view.world.children.forEach(c=>c.visible=c===view.slashes.root);view.slashes.root.mask=null;view.slashes.root.children[0].visible=false;for(const item of view.slashes.items.values())for(const ghost of item.ghosts?.values()??[])ghost.visible=false;view.world.position.set(-240,-360);app.renderer.resize(1100,600);const el=document.getElementById('app');el.style.width='1100px';el.style.height='600px';el.style.flexShrink='0';document.querySelector('.lab-panel').style.display='none';app.render();});
 await page.locator('#app').screenshot({path:`screenshots/ultimate-rework/${variant}-isolated.png`});
 await page.setViewportSize({width:1250,height:960});await page.reload();await page.waitForFunction(()=>window.__SLASH_PREVIEW__&&window.__LINGHU__);
}
await sharp({create:{width:864,height:816,channels:4,background:'#192027'}}).composite([{input:frames[0],left:0,top:48},{input:frames[1],left:432,top:48},{input:Buffer.from('<svg width="864" height="48"><style>text{font:22px sans-serif;fill:#e7ba68}</style><text x="115" y="32">A · Sharp</text><text x="540" y="32">B · Ornate</text></svg>'),left:0,top:0}]).png().toFile('screenshots/ultimate-rework/AB-comparison.png');
await sharp({create:{width:1100,height:1296,channels:4,background:'#192027'}}).composite([{input:'screenshots/ultimate-rework/A-isolated.png',left:0,top:48},{input:'screenshots/ultimate-rework/B-isolated.png',left:0,top:696},{input:Buffer.from('<svg width="1100" height="1296"><style>text{font:26px sans-serif;fill:#e7ba68}</style><text x="40" y="32">Version A · Sharp crescent</text><text x="40" y="680">Version B · Ornate talisman flood</text></svg>'),left:0,top:0}]).png().toFile('screenshots/ultimate-rework/static-comparison.png');
if(errors.length)throw Error(errors.join('\n'));console.log('PASS A/B horizontal, diagonal, four timeline phases, isolated previews, no script errors');await browser.close();
