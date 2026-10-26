import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/mountain-formations';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5175/?mode=mountains&qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.mountainUI);
 for(const [kind,index,count,wait] of [['chain',0,4,1750],['fan',1,5,850],['pincer',2,4,1050],['ring',4,6,1250]]){
  await page.evaluate(index=>{const a=window.__LINGHU__;a.game.startMountainLevel(0);a.mountainUI.opened=false;a.game.invulnerable=1e6;a.game.campaign.chainNumber=index;a.app.ticker.start();},index);
  await page.waitForFunction(()=>window.__LINGHU__.game.campaign.entryWarnings.length>0);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await page.screenshot({path:`${folder}/${kind}-warning.png`});
  await page.evaluate(()=>window.__LINGHU__.app.ticker.start());await page.waitForFunction(count=>window.__LINGHU__.game.campaign.spawned>=count,count);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
  const state=await page.evaluate(()=>{const g=window.__LINGHU__.game;return{formation:g.campaign.formation,count:g.enemies.length,positions:g.enemies.map(e=>({x:e.x,y:e.y,look:e.look})),pending:g.hualing.upgrades.pending,top:g.hualing.bounds.top,gl:window.__LINGHU__.app.renderer.gl.getError()};});
  assert.equal(state.formation,kind);assert.equal(state.count,count);assert.equal(state.pending,0);assert.equal(state.gl,0);
  if(kind==='fan')assert.ok(Math.max(Math.max(...state.positions.map(p=>p.x))-Math.min(...state.positions.map(p=>p.x)),Math.max(...state.positions.map(p=>p.y))-Math.min(...state.positions.map(p=>p.y)))>250);
  if(kind==='pincer')assert.ok(state.positions.some(p=>p.x<170)&&state.positions.some(p=>p.x>550));
  if(kind==='ring')assert.ok(state.positions.some(p=>p.x<170)&&state.positions.some(p=>p.x>550)&&state.positions.some(p=>p.y<state.top+100));
  results.push(state);await page.screenshot({path:`${folder}/${kind}.png`});
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({errors,results},null,2));console.log('PASS four real rendered formation patterns, timed entry warnings, spatial spread, no opening upgrades, no page/WebGL errors');
}finally{await browser.close();}
