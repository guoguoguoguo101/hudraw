import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/thunder-brush';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:430,height:932}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173/';
async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.move(p.x,p.y);}
async function click(x,y){await move(x,y);await page.mouse.down();await page.mouse.up();}
try{
 await page.goto(new URL('?qa=1&mode=hualing',base).href);await page.waitForFunction(()=>window.__LINGHU__);
 for(const [width,height] of [[430,932],[375,667],[390,844]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.evaluate(()=>{const a=window.__LINGHU__;a.action('restart');a.game.director.disabled=true;a.game.hualing.frozen=true;a.game.enemies=[];const e=a.game.spawn('oni',{x:360,y:570});e.ai='Approach';e.speed=0;});await page.waitForTimeout(80);
  const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);await click(624,1090+footer);
  assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.thunder.active),true);await move(130,570);await page.mouse.down();
  for(let i=1;i<=38;i++){await move(130+i*12,570+Math.sin(i/38*Math.PI*2)*55);await page.waitForTimeout(7);}
  assert.ok(await page.evaluate(()=>window.__LINGHU__.game.hualing.thunder.arcs.length>0));
  assert.equal(await page.evaluate(()=>window.__LINGHU__.view.pen.liveFX.ink.visible),false);
  await page.screenshot({path:`${folder}/drawing-${width}.png`});await page.mouse.up();await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.thunder.arcs.length),0);
  await page.evaluate(()=>window.__LINGHU__.action('pause'));const remaining=await page.evaluate(()=>window.__LINGHU__.game.hualing.thunder.remaining);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.thunder.remaining),remaining);
  await page.evaluate(()=>{const a=window.__LINGHU__;a.action('resume');a.app.ticker.stop();for(let i=0;i<800;i++)a.game.advance(1/60);a.app.ticker.start();});await page.waitForTimeout(80);
  assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.thunder.active),false);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.pen.liveFX.ink.visible),true);
  assert.equal(await page.evaluate(()=>window.__LINGHU__.game.casts),0);assert.equal(await page.evaluate(()=>window.__LINGHU__.app.renderer.gl.getError()),0);
 }
 await page.evaluate(()=>window.__LINGHU__.action('menu'));assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.thunder.remaining),0);assert.deepEqual(errors,[]);
 await writeFile(`${folder}/verification.json`,JSON.stringify({sizes:[430,375,390],errors},null,2));console.log('PASS thunder: real card click, electric stroke replaces red ink, short decay, pause, timeout restoration, reset, three mobile sizes, no WebGL errors');
}finally{await browser.close();}
