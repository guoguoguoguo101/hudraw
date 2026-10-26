import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/maple-brush';await mkdir(folder,{recursive:true});
const base=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173/';
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],shots=[];
const page=await browser.newPage({viewport:{width:430,height:932}});page.on('pageerror',e=>errors.push(e.message));
async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale}},{x,y});await page.mouse.move(p.x,p.y);}
async function click(x,y){await move(x,y);await page.mouse.down();await page.mouse.up();}
async function shot(name){await page.screenshot({path:`${folder}/${name}.png`});shots.push(name);}
try{
 await page.goto(new URL('?mode=hualing&qa=1',base).href);await page.waitForFunction(()=>window.__LINGHU__);
 for(const [width,height] of [[430,932],[375,667],[390,844]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.evaluate(()=>{const a=window.__LINGHU__;a.action('restart');a.game.director.disabled=true;a.game.enemies=[];a.game.hualing.frozen=true;});
  await page.waitForTimeout(80);const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);
  await click(492,1090+footer);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.petals.active),true);
  assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.selected),null);
  await move(110,570);await page.mouse.down();
  for(let i=1;i<=36;i++){await move(110+i*14,570+Math.sin(i/36*Math.PI*2)*70);await page.waitForTimeout(9);}
  await shot(`drawing-${width}`);await page.mouse.up();
  const before=await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing.petals;return {count:m.petals.length,y:m.petals.at(-1).y,id:m.petals.at(-1).phase};});assert.ok(before.count>10&&before.count<=96);
  await page.waitForTimeout(300);await shot(`falling-${width}`);
  const after=await page.evaluate(id=>{const m=window.__LINGHU__.game.hualing.petals;return {count:m.petals.length,y:m.petals.find(p=>p.phase===id)?.y};},before.id);
  assert.ok(after.y>before.y);assert.ok(after.count<=before.count);
  await page.evaluate(()=>window.__LINGHU__.action('pause'));const paused=await page.evaluate(()=>window.__LINGHU__.game.hualing.petals.remaining);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.petals.remaining),paused);
  await page.evaluate(()=>window.__LINGHU__.action('resume'));await page.waitForTimeout(2600);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.petals.petals.length),0);
  assert.equal(await page.evaluate(()=>window.__LINGHU__.game.casts),0);assert.equal(await page.evaluate(()=>window.__LINGHU__.app.renderer.gl.getError()),0);
 }
 await page.evaluate(()=>window.__LINGHU__.action('menu'));assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.petals.remaining),0);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({shots,errors},null,2));
 console.log('PASS petal card: real click, path-following emission, downward flutter after release, no idle emission, pause, cleanup, 375/390/430 layouts and no WebGL errors');
}finally{await browser.close();}
