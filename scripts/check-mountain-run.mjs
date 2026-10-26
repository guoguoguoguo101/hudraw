import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/mountain-pacing';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});}
async function click(x,y){const p=await point(x,y);await page.mouse.click(p.x,p.y);await settle();}
async function zone(where,index=0){const z=await page.evaluate(({where,index})=>{const z=window.__LINGHU__[where].zones[index];return{x:z.x+z.w/2,y:z.y+z.h/2};},{where,index});await click(z.x,z.y);}
try{
 await page.goto(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5175/?mode=mountains&qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.mountainUI?.mapReady);await zone('mountainUI',15);
 await page.waitForTimeout(1800);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.panel),null);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.picks),0);assert.ok(await page.evaluate(()=>window.__LINGHU__.game.enemies.length>=3));await page.screenshot({path:`${folder}/opening-train.png`});
 await zone('mountainUI',0);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.state),'paused');await page.keyboard.press('Escape');await settle();
 await page.evaluate(()=>{const g=window.__LINGHU__.game;g.invulnerable=1e6;for(let i=0;i<6;i++)g.damage(g.spawn('ink',{x:335+i*8,y:580}),1e5);});await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.campaign.xp),6);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.panel),null);await page.screenshot({path:`${folder}/experience-6-of-8.png`});
 await page.evaluate(()=>window.__LINGHU__.game.ink.setAmount(0));await page.waitForTimeout(100);await page.screenshot({path:`${folder}/empty-ink.png`});
 const supply=await page.evaluate(()=>window.__LINGHU__.game.campaign.pickups[0]);assert.ok(supply);await click(supply.x,supply.y);assert.ok(await page.evaluate(()=>window.__LINGHU__.game.ink.currentInk>=28));assert.equal(await page.evaluate(()=>window.__LINGHU__.game.campaign.inkSerial),1);await page.screenshot({path:`${folder}/ink-collected.png`});
 await page.evaluate(()=>{const g=window.__LINGHU__.game;g.ink.setAmount(35);g.campaign.dropInk(g,310,620);});const start=await point(240,620),end=await point(380,620);await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();await settle();assert.equal(await page.evaluate(()=>window.__LINGHU__.game.campaign.inkSerial),2,'actual stroke collects ink');
 await page.evaluate(()=>{const g=window.__LINGHU__.game;for(let i=0;i<2;i++)g.damage(g.spawn('ink',{x:400,y:520}),1e5);});await page.waitForFunction(()=>window.__LINGHU__.game.hualing.upgrades.panel==='upgrade');assert.equal(await page.evaluate(()=>window.__LINGHU__.brushUpgradeUI.zones.length),3);await page.screenshot({path:`${folder}/first-earned-upgrade.png`});
 const time=await page.evaluate(()=>window.__LINGHU__.game.time);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.time),time);await zone('brushUpgradeUI');assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.picks),1);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.campaign.xpNeeded),18);
 for(const [w,h] of [[375,667],[430,932]]){await page.setViewportSize({width:w,height:h});await settle();await page.screenshot({path:`${folder}/combat-${w}.png`});}
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({errors,checks:'no initial upgrade, staggered train, real kill XP 6/8, empty ink feedback, zero-ink pointer pickup, painted pickup, earned three-choice upgrade, increasing XP cost, pause/resume, modal freeze, mobile layouts'},null,2));
 console.log('PASS campaign browser: immediate combat, trains, visible XP, zero-ink tap and painted pickups, earned upgrade and mobile sizes');
}finally{await browser.close();}
