import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const folder='screenshots/chapter-growth';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function frame(){await page.evaluate(()=>{const a=window.__LINGHU__;for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,0,60,0);a.hualingUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.brushUpgradeUI.update(a.view.ui.hud.y);a.playUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.app.render();});}
async function click(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.click(p.x,p.y);await frame();}
async function chapter(index){const y=await page.evaluate(()=>window.__LINGHU__.hualingUI.chapterBarY+18);await click(110+index*168,y);await page.waitForFunction(()=>window.__LINGHU__.view.scrollLandscape.chapterReady);await frame();}
async function custom(){const y=await page.evaluate(()=>{const a=window.__LINGHU__;return a.game.hualing.journey.chapter==='valley'?a.game.hualing.bounds.top-1:a.view.ui.hud.y+185;});await click(590,y);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.panel),'custom');}
try{
 await page.goto('http://127.0.0.1:5173/?mode=hualing&qa=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__?.brushUpgradeUI);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.playUI.formal=false;a.brushUpgradeUI.compactUI=false;a.game.director.disabled=true;a.game.enemies=[];a.game.seedHualingEnemies();a.game.hualing.frozen=true;});await frame();
 const sides=await page.evaluate(()=>{const g=window.__LINGHU__.game,b=g.hualing.bounds;return g.enemies.map(e=>e.y===b.top+55?'top':e.x===b.right-55?'right':e.y===b.bottom-65?'bottom':e.x===b.left+55?'left':'none');});assert.equal(new Set(sides).size,4);await page.screenshot({path:`${folder}/four-sides-390.png`});
 for(let i=0;i<4;i++){
  await chapter(i);await custom();const top=await page.evaluate(()=>window.__LINGHU__.game.hualing.bounds.top+35);
  await click(268+(i+1)*82,top+124+82);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.levels.wide),i+1);
  await page.screenshot({path:`${folder}/custom-${i}-390.png`});await click(560,top+459);
 }
 for(let i=0;i<4;i++){await chapter(i);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.levels.wide),i+1);}
 // Growth must be directly accessible from every chapter's common row.
 const y=await page.evaluate(()=>window.__LINGHU__.view.ui.hud.y+185);await click(420,y);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.panel),'upgrade');
 const top=await page.evaluate(()=>window.__LINGHU__.game.hualing.bounds.top+35);await click(360,top+140);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.levels.spray),1);
 // The formal presentation also exposes this editor, without switching modes.
 await page.evaluate(()=>{const a=window.__LINGHU__;a.playUI.formal=true;a.brushUpgradeUI.compactUI=true;});await frame();const header=await page.evaluate(()=>window.__LINGHU__.view.ui.hud.y);await click(110,header+28);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.panel),'custom');
 await page.setViewportSize({width:375,height:667});await frame();await page.screenshot({path:`${folder}/formal-custom-375.png`});assert.deepEqual(errors,[]);
 console.log('PASS chapter growth browser: four-side seeded enemies, real chapter/custom/level buttons for all four scenes, independent retained levels, growth selection and formal-mode editor at 375/390 widths');
}catch(error){console.error(error);throw error;}finally{await browser.close();}
