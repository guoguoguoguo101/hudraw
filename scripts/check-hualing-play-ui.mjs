import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/hualing-play-ui';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],shots=[];page.on('pageerror',e=>errors.push(e.message));
async function settle(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.move(p.x,p.y);}
async function click(x,y){await move(x,y);await page.mouse.down();await page.mouse.up();await settle();}
async function toggle(){const header=await page.evaluate(()=>window.__LINGHU__.view.ui.hud.y);await click(595,header+28);}
async function shot(name){await settle();await page.screenshot({path:`${folder}/${name}.png`});shots.push(name);}
try{
 await page.goto(`${new URL(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173').origin}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__?.playUI);await settle();
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.director.disabled=true;a.game.enemies=[];a.game.score=123;a.game.kills=9;a.game.hualing.thunder.activate();});
 if(await page.evaluate(()=>window.__LINGHU__.playUI.formal))await toggle();
 const verbs=await page.evaluate(()=>window.__LINGHU__.hualingUI.root.children.filter(c=>typeof c.text==='string').map(c=>c.text));assert.ok(!verbs.includes('画山')&&!verbs.includes('裁纸')&&!verbs.some(s=>s.includes('推山')));
 await shot('test-390');await toggle();
 assert.equal(await page.evaluate(()=>window.__LINGHU__.playUI.formal),true);
 let state=await page.evaluate(()=>{const a=window.__LINGHU__;return{test:a.hualingUI.root.visible,hud:a.view.ui.hud.visible,debug:a.brushUpgradeUI.root.visible,score:a.game.score,kills:a.game.kills,thunder:a.game.hualing.thunder.remaining};});
 assert.equal(state.test,false);assert.equal(state.hud,false);assert.equal(state.debug,false);assert.equal(state.score,123);assert.equal(state.kills,9);assert.ok(state.thunder>0);
 await shot('formal-390');
 const header=await page.evaluate(()=>window.__LINGHU__.view.ui.hud.y);await move(120,header+280);await page.mouse.down();assert.equal(await page.evaluate(()=>window.__LINGHU__.input.drawing),true);await page.mouse.up();
 const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);await click(121,footer+1188);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.selected),'dragon');
 await move(200,600);await page.mouse.down();await move(490,580);await page.mouse.up();await settle();assert.ok(await page.evaluate(()=>window.__LINGHU__.game.hualing.effects.some(f=>f.kind==='dragon')));
 await click(526,footer+1188);assert.ok(await page.evaluate(()=>window.__LINGHU__.game.hualing.petals.remaining>10));
 await click(643,header+90);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.state),'paused');await page.keyboard.press('Escape');await settle();assert.equal(await page.evaluate(()=>window.__LINGHU__.game.state),'playing');
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.hualing.upgrades.startGrowth();});await settle();assert.equal(await page.evaluate(()=>window.__LINGHU__.brushUpgradeUI.root.visible),true);await shot('formal-upgrade');
 const pick=await page.evaluate(()=>{const a=window.__LINGHU__,z=a.brushUpgradeUI.zones[0];return{x:z.x+z.w/2,y:z.y+z.h/2};});await click(pick.x,pick.y);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.panel),null);
 await page.evaluate(()=>{const c=window.__LINGHU__.game.hualing.combo;for(let i=0;i<12;i++)c.kill(false);});await settle();const width=await page.evaluate(()=>window.__LINGHU__.comboUI.root.getBounds().width);assert.ok(width<180);await shot('formal-combo');
 for(const [width,height] of [[375,667],[430,932]]){await page.setViewportSize({width,height});await settle();await shot(`formal-${width}`);const bounds=await page.evaluate(()=>{const a=window.__LINGHU__;return{max:a.input.maxY,dock:a.view.ui.footer.y+1148};});assert.ok(bounds.max<bounds.dock);}
 await toggle();assert.equal(await page.evaluate(()=>window.__LINGHU__.hualingUI.root.visible),true);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.score),123);
 await toggle();await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__?.playUI);assert.equal(await page.evaluate(()=>window.__LINGHU__.playUI.formal),true);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({shots,comboWidth:width,errors},null,2));console.log('PASS play UI: live toggle preserves run, removed cards, hidden controls do not steal input, cast/buffs/pause/growth, compact combo, 375/390/430 and saved preference');
}finally{await browser.close();}
