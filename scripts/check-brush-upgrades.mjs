import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/brush-upgrades';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173';
async function frame(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__;for(let t=0;t<seconds-1e-8;t+=1/60)a.game.advance(Math.min(1/60,seconds-t),a.input.drawing);
 for(const e of a.game.drain())a.view.event(e);
 a.view.update(a.game,a.input,0,60,seconds?Math.min(seconds,1/60):0);a.hualingUI.update(a.view.ui.footer.y);a.brushUpgradeUI.update();a.comboUI.update();a.app.render();
 const m=a.game.hualing.upgrades;return{levels:{...m.levels},panel:m.panel,charge:m.chargeRatio,drops:m.drops.length,splashes:m.splashes.length,time:a.game.time,clock:m.clock,kills:a.game.kills,picks:m.picks,pending:m.pending,gl:a.app.renderer.gl.getError()};
 },seconds);}
async function at(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});}
async function move(x,y){const p=await at(x,y);await page.mouse.move(p.x,p.y);}
async function click(x,y){const p=await at(x,y);await page.mouse.click(p.x,p.y);await frame();}
async function shot(name){const state=await frame();assert.equal(state.gl,0);await page.screenshot({path:`${folder}/${name}.png`});results.push({name,state});}
async function reset(){await page.evaluate(async()=>{const a=window.__LINGHU__;a.action('restart');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();a.playUI.formal=false;a.brushUpgradeUI.compactUI=false;a.input.cancel();a.game.director.disabled=true;a.game.hualing.frozen=true;a.game.enemies=[];});await frame();return page.evaluate(()=>({...window.__LINGHU__.game.hualing.bounds}));}
try{
 await page.goto(`${base}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__?.brushUpgradeUI);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const [width,height] of [[390,844],[375,667],[430,932]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const b=await reset(),top=b.top+35;
  await click(590,b.top-1);assert.equal((await frame()).panel,'custom');
  for(let row=0;row<4;row++)for(let level=0;level<=4;level++){
   await click(268+level*82,top+124+row*82);assert.equal((await frame()).levels[['spray','wide','splash','trail'][row]],level);
  }
  await shot(`custom-${width}`);
  const before=await frame();await frame(2);assert.equal((await frame()).time,before.time);assert.equal((await frame()).clock,before.clock);
  await click(150,top+459);assert.deepEqual((await frame()).levels,{spray:4,wide:4,splash:4,trail:4});await click(560,top+459);assert.equal((await frame()).panel,null);
  // Real pointer: wide brush and two secondary paths reach off-center targets.
  const y=b.top+180;
  await page.evaluate(y=>{const g=window.__LINGHU__.game;for(let i=0;i<6;i++){const e=g.spawn('ink',{x:120+i*85,y:y+(i%2?12:0)});e.hp=1000;e.speed=0;}},y);
  await move(70,y);await page.mouse.down();
  for(let x=90;x<=620;x+=20){await move(x,y);await frame(.025);}
  assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.dual.sides.length),2);assert.equal((await frame()).splashes,0);await shot(`wide-spray-ready-${width}`);
  await page.mouse.up();assert.equal((await frame()).splashes,0);await frame(.29);await shot(`splash-lv4-${width}`);
  // Pause cancels the live gesture and suspends skill movement.
  await frame(1);await move(100,y);await page.mouse.down();await move(260,y);await page.evaluate(()=>{const a=window.__LINGHU__;a.action('pause');});await frame(1);assert.equal((await frame()).splashes,0);await page.mouse.up();await page.evaluate(()=>{const a=window.__LINGHU__;a.action('resume');a.app.ticker.stop();});
  // Actual growth UI: reset loadout, choose a skill, earn kills, upgrade same skill.
  await click(590,b.top-1);await click(360,top+511);assert.equal((await frame()).panel,'upgrade');await shot(`growth-${width}`);
  await click(360,top+150);assert.equal((await frame()).levels.spray,1);assert.equal((await frame()).picks,1);
  await page.evaluate(()=>{const g=window.__LINGHU__.game;g.enemies=[];for(let i=0;i<4;i++){const e=g.spawn('ink',{x:200+i*80,y:500});g.damage(e,999,0,{id:-2,rune:'ink'});}});await frame(.02);assert.equal((await frame()).panel,'upgrade');
  await click(360,top+150);assert.equal((await frame()).levels.spray,2);
  await page.evaluate(()=>{const a=window.__LINGHU__;a.action('restart');a.app.ticker.stop();});assert.deepEqual((await frame()).levels,{spray:0,wide:0,splash:0,trail:0});
 }
 // Exercise each level in the actual renderer with a real stroke; capture the 12 states.
 const b=await reset();
 for(const id of ['spray','wide','splash'])for(let level=1;level<=4;level++){
  await page.evaluate(({id,level})=>{const a=window.__LINGHU__,g=a.game,m=g.hualing.upgrades;m.reset();m.setLevel(id,level);g.enemies=[];a.view.pen.liveFX.clear();for(let i=0;i<5;i++){const e=g.spawn('ink',{x:150+i*90,y:g.hualing.bounds.top+170});e.hp=1000;}},{id,level});
  const y=b.top+170;await move(90,y);await page.mouse.down();for(let x=110;x<=600;x+=20){await move(x,y);await frame(.035);}
  if(id==='splash'){// Secondary paths follow actual passes without charge/release AoE.
   await frame(.36);for(let x=580;x>=100;x-=20){await move(x,y);await frame(.02);}assert.equal((await frame()).charge,0);await page.mouse.up();await frame(.28);
  }
  await shot(`${id}-lv${level}`);await page.mouse.up();await frame(.9);
 }
 await page.evaluate(()=>{const a=window.__LINGHU__;a.action('interactionPractice');a.app.ticker.stop();});await frame();assert.equal(await page.evaluate(()=>window.__LINGHU__.brushUpgradeUI.root.visible),false);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));
 console.log('PASS browser: 0–4 manual buttons, max/reset, real wide/spray/dual paths, release/cancel, frozen panels, growth selection and repeated upgrade, twelve level renders, three phone layouts and old-mode isolation');
}finally{await browser.close();}
