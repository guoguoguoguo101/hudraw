import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='screenshots/burning-sea';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:430,height:932}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+v.x+x*v.width/720,y:r.top+v.y+y*v.height/1280};},{x,y});}
async function move(x,y){const p=await point(x,y);await page.mouse.move(p.x,p.y);}
async function click(x,y){await move(x,y);await page.mouse.down();await page.mouse.up();}
async function step(seconds=0){return page.evaluate(seconds=>{const a=window.__LINGHU__;for(let t=0;t<seconds-1e-8;t+=1/60){const dt=Math.min(1/60,seconds-t);a.game.advance(dt);a.input.update(dt);for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,dt,60,dt);}a.view.update(a.game,a.input,0,60,0);a.practiceUI.root.y=a.view.ui.footer.y;a.practiceUI.update();a.app.render();return {remaining:a.game.burningSea.remaining,traces:a.game.burningSea.traces.length,formal:a.game.formalCasts,fallback:a.game.freeSlashes.totalCasts,ink:a.game.ink.currentInk,hp:a.game.enemies.map(e=>e.hp),gl:a.app.renderer.gl?.getError()??0};},seconds);}
try{
 await page.goto(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 // Enter through the visible menu zone.
 const zone=await page.evaluate(()=>window.__LINGHU__.view.ui.zones.find(z=>z.action==='interactionPractice'));assert.ok(zone);await click(zone.x+zone.w/2,zone.y+zone.h/2);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const width of [430,375,390]){
  await page.setViewportSize({width,height:width===375?667:width===390?844:932});
  // ResizeObserver updates the footer asynchronously; do not click its old location.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.game.start(false,true,false,true);a.game.director.disabled=true;a.game.ink.setUnlimited(false);a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;a.view.ui.show(a.game.state,a.game);a.practiceUI.reset();const e=a.game.spawn('oni',{x:420,y:600});e.speed=0;e.ai='Telegraph';e.stateAge=-100;});
  await step();const footer=await page.evaluate(()=>window.__LINGHU__.practiceUI.root.y);
  await click(580,1202+footer);assert.equal((await step()).remaining,4);
  // Damage and visible flames while the mouse is still held down.
  await move(200,600);await page.mouse.down();for(let x=220;x<=520;x+=20)await move(x,600+Math.sin(x/50)*30);
  const burning=await step(.25);assert.ok(burning.traces>0);assert.equal(burning.hp[0],240);assert.equal(burning.formal,0);assert.equal(burning.fallback,0);assert.equal(burning.ink,100);assert.equal(burning.gl,0);
  await page.screenshot({path:`${folder}/live-${width}.png`});await page.mouse.up();
  await move(220,750);await page.mouse.down();for(let x=240;x<=520;x+=20)await move(x,750+Math.sin(x/50)*30);await page.mouse.up();await step(.2);
  await page.screenshot({path:`${folder}/two-strokes-${width}.png`});
  await page.evaluate(()=>{const a=window.__LINGHU__;a.action('pause');a.app.ticker.stop();});const before=await step();await step(2);assert.deepEqual(await step(),before);
  await page.evaluate(()=>{const a=window.__LINGHU__;a.action('resume');a.app.ticker.stop();});await step(3.55);const charged=await step();assert.equal(charged.remaining,0);assert.ok(charged.traces>0);assert.equal(charged.hp[0],240);await page.screenshot({path:`${folder}/charge-${width}.png`});await step(2);const explosion=await step();assert.equal(explosion.hp[0],60);await step(.16);await page.screenshot({path:`${folder}/explosion-${width}.png`});await step(.64);const ended=await step();assert.equal(ended.traces,0);
  // Next pointer stroke returns to the existing normal rune path.
  await move(220,650);await page.mouse.down();for(let x=240;x<=500;x+=20)await move(x,650);await page.mouse.up();assert.equal((await step()).formal,1);
  results.push({width,burning,ended});
 }
 // Equip all four brushes through the existing panel, recoloring the same live path.
 await page.setViewportSize({width:430,height:932});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.game.start(false,true,false,true);a.game.director.disabled=true;a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;a.view.ui.show(a.game.state,a.game);a.practiceUI.reset();});await step();
 const footer=await page.evaluate(()=>window.__LINGHU__.practiceUI.root.y);
 await click(580,1202+footer);await move(160,600);await page.mouse.down();for(let x=180;x<=560;x+=20)await move(x,600+Math.sin(x/60)*35);await page.mouse.up();await step(.3);
 const original=await page.evaluate(()=>JSON.stringify(window.__LINGHU__.game.burningSea.traces));const hashes=[];
 for(const [index,id] of ['cinnabar','fox','gold','mountain'].entries()){
  await click(596,1027+footer);await click(122+index*158,320);await click(629,221);await step();
  const state=await page.evaluate(()=>{const a=window.__LINGHU__;return {pen:a.game.pen.id,render:a.view.burningSea.styleId,traces:JSON.stringify(a.game.burningSea.traces),remaining:a.game.burningSea.remaining,ink:a.game.ink.currentInk,gl:a.app.renderer.gl?.getError()??0,text:a.practiceUI.root.children.filter(c=>c.text).map(c=>c.text).join('|')};});
  assert.equal(state.pen,id);assert.equal(state.render,id);assert.equal(state.traces,original);assert.equal(state.gl,0);assert.ok(state.remaining>0);assert.ok(state.text.includes(['朱砂金焰','青碧狐焰','白金御焰','山海墨焰'][index]));
  const capture=await page.screenshot({path:`${folder}/brush-${id}.png`});const pixels=await sharp(capture).extract({left:70,top:350,width:290,height:190}).raw().toBuffer();hashes.push(createHash('sha256').update(pixels).digest('hex'));
  results.push({id,...state,traces:undefined});
 }
 assert.equal(new Set(hashes).size,4,'same brush path must have four visually distinct effects');
 await page.evaluate(()=>{const a=window.__LINGHU__;a.action('menu');a.action('practice');a.app.ticker.stop();});await step();
 assert.equal(await page.evaluate(()=>window.__LINGHU__.practiceUI.root.children.some(c=>c.text?.includes('焚山煮海'))),true);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,hashes,errors},null,2));console.log('PASS burning sea browser: menu entry, four-second drawing, two-second synchronized explosion, pause/expiry, three viewports, actual four-brush selection/recolor, four distinct arena captures, unchanged paths, old arena isolation, zero WebGL/page errors');
}finally{await browser.close();}
