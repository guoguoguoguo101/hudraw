import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/brush-contact';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.move(p.x,p.y);}
async function render(){await page.evaluate(()=>{const a=window.__LINGHU__;for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,0,60,0);a.hualingUI.update(a.view.ui.footer.y);a.app.render();});}
try{
 await page.goto('http://127.0.0.1:5173/?qa=1&mode=hualing');await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.enemies=[];a.game.director.disabled=true;a.game.hualing.frozen=true;for(const y of [500,516,530,575]){const e=a.game.spawn('ink',{x:360,y});e.hp=e.maxHp=100;e.speed=0;e.ai='Approach';e.age=1;}});await render();
 await page.screenshot({path:`${folder}/overlap-before.png`});
 await move(220,500);await page.mouse.down();await move(500,500);await page.mouse.up();await render();
 const hp=await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>e.hp));assert.deepEqual(hp,[70,70,70,100]);await page.screenshot({path:`${folder}/overlap-hit.png`});
 await move(500,500);await page.mouse.down();await move(220,500);await page.mouse.up();assert.deepEqual(await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>e.hp)),hp);
 await page.evaluate(()=>{const g=window.__LINGHU__.game;for(let i=0;i<24;i++)g.advance(1/60);});await move(220,500);await page.mouse.down();await move(500,500);await page.mouse.up();const later=await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>e.hp));assert.deepEqual(later,[40,40,40,100]);
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>window.__LINGHU__.app.renderer.gl.getError()),0);await writeFile(`${folder}/verification.json`,JSON.stringify({firstSweep:hp,afterCooldown:later,errors},null,2));console.log('PASS real brush contact: all three overlapping bodies hit, distant target untouched, independent cooldown and no WebGL errors');
}finally{await browser.close();}
