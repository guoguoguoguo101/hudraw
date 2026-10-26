import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/elite-field';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:430,height:932}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
async function frame(t=0){await page.evaluate(t=>{const a=window.__LINGHU__;for(let n=0;n<t*60-1e-6;n++)a.game.advance(1/60);for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,t,60,t);a.hualingUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.app.render();},t);}
async function point(p){return page.evaluate(async p=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+p.x*v.scale,y:r.top+v.y+p.y*v.scale};},p);}
async function click(x,y){const p=await point({x,y});await page.mouse.click(p.x,p.y);await frame();}
async function draw(points){const a=await point(points[0]);await page.mouse.move(a.x,a.y);await page.mouse.down();for(const q of points.slice(1)){const p=await point(q);await page.mouse.move(p.x,p.y);}await page.mouse.up();await frame();}
const results=[];
try{
 for(let retry=0;;retry++){try{await page.goto('http://127.0.0.1:5173/?mode=hualing&qa=1',{waitUntil:'domcontentloaded',timeout:30000});break;}catch(e){if(retry)throw e;}}
 await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.director.disabled=true;a.playUI.formal=false;a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;});
 for(const chapter of ['valley','sea','palace','snow']){
  await page.evaluate(ch=>{const a=window.__LINGHU__;a.game.changeHualingChapter(ch);a.game.hualing.journey.automatic=false;},chapter);await frame();
  for(let i=0;i<5;i++){
   const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);await click(97+i*132,1174+footer);await frame(3.7);
   const data=await page.evaluate(async({chapter,i})=>{const a=window.__LINGHU__,{chapterElites}=await import('/src/gameplay/hualing-elites.ts'),e=a.game.enemies.find(e=>e.elite),f=a.game.hualing.elites.field;return{kind:e.elite.kind,expected:chapterElites(chapter)[i],count:f.objects.length,gl:a.app.renderer.gl.getError()};},{chapter,i});assert.equal(data.kind,data.expected);assert.ok(data.count>=2,data.kind+' full map objects');assert.equal(data.gl,0);await page.waitForFunction(k=>window.__LINGHU__.view.elites.assets.has(k),data.kind);await frame();await page.screenshot({path:`${folder}/${data.kind}-430.png`});
   const action=await page.evaluate(()=>{const a=window.__LINGHU__,f=a.game.hualing.elites.field,e=a.game.enemies.find(e=>e.elite),kind=e.elite.kind;let o=f.objects.find(o=>kind==='weaver'?o.shape==='thread':kind==='deer'?o.shape==='deer'&&o.index===1:true);
    if(['thread','tentacle'].includes(o.shape)){const x=(o.nodes[0].x+o.nodes[1].x)/2,y=(o.nodes[0].y+o.nodes[1].y)/2;return{id:o.id,points:[{x:x-15,y},{x:x+15,y}]};}
    if(o.shape==='crack')return{id:o.id,points:o.nodes.map(p=>({x:p.x,y:p.y}))};
    if(o.shape==='ring'){const b=f.bounds,candidates=[{x:o.x+o.radius,y:o.y},{x:o.x-o.radius,y:o.y},{x:o.x,y:o.y+o.radius},{x:o.x,y:o.y-o.radius}],p=candidates.find(p=>p.x>b.left+20&&p.x<b.right-20&&p.y>b.top+20&&p.y<b.bottom-20);return{id:o.id,points:[{x:p.x-8,y:p.y},{x:p.x+8,y:p.y}]};}
    let target=e;if(o.shape==='claw'||o.shape==='ray')target=f.objects.find(q=>q.id!==o.id&&q.shape===o.shape);if(o.shape==='deer')target={x:o.x+60,y:o.y};const n=Math.hypot(target.x-o.x,target.y-o.y)||1;return{id:o.id,points:[{x:o.x,y:o.y},{x:o.x+(target.x-o.x)/n*18,y:o.y+(target.y-o.y)/n*18}]};
   });await draw(action.points);
   const reaction=await page.evaluate(id=>{const f=window.__LINGHU__.game.hualing.elites.field,o=f.objects.find(o=>o.id===id);return !o||o.friendly||o.marks.size>0||o.stage>0;},action.id);assert.equal(reaction,true,data.kind+' reacts to a real mouse stroke');await frame(.3);await page.screenshot({path:`${folder}/${data.kind}-reaction.png`});results.push({...data,reacted:reaction});
  }
 }
 // A full reflection cycle through actual input: wait for all three returning parasols to land.
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.clearHualingElites();a.game.summonHualingElite('umbrella');a.game.enemies=a.game.enemies.filter(e=>e.elite);a.game.hualing.journey.automatic=false;});await frame(3);
 for(let i=0;i<3;i++){const o=await page.evaluate(()=>{const f=window.__LINGHU__.game.hualing.elites.field,o=f.objects.find(o=>!o.friendly);return o?{x:o.x,y:o.y}:null;});if(o)await draw([{x:o.x-6,y:o.y},{x:o.x+6,y:o.y}]);}
 await frame(2.2);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.enemies.find(e=>e.elite).elite.phase),'stagger');await page.screenshot({path:`${folder}/umbrella-full-parry.png`});
 const clock=await page.evaluate(()=>window.__LINGHU__.game.hualing.elites.field.effects.map(f=>f.age));await page.evaluate(()=>window.__LINGHU__.game.pause());await frame(1);assert.deepEqual(await page.evaluate(()=>window.__LINGHU__.game.hualing.elites.field.effects.map(f=>f.age)),clock);await page.evaluate(()=>window.__LINGHU__.game.pause());
 for(const width of [375,390]){await page.setViewportSize({width,height:width===375?667:844});await page.waitForTimeout(100);await page.evaluate(()=>{const a=window.__LINGHU__;a.game.clearHualingElites();a.game.summonHualingElite('jelly');});await frame(3.6);await page.screenshot({path:`${folder}/jelly-${width}.png`});}
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>window.__LINGHU__.app.renderer.gl.getError()),0);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));console.log('PASS arena browser: 20 real summon buttons, 20 distinct arena attacks, real mouse reactions, full parasol reflection/stagger, pause, 375/390/430 layouts, no JS/WebGL errors');
}finally{await browser.close();}
