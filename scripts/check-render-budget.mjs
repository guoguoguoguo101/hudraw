import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/render-budget';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const url=(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184')+'/?qa=1';
async function begin(){
 await page.evaluate(()=>{const a=window.__LINGHU__,g=a.game;a.beginMountain(1);a.mountainUI.opened=false;g.director.disabled=true;g.campaign.lastRoom=0;g.campaign.spawn=1e8;g.hualing.upgrades.growth=false;g.invulnerable=1e8;g.enemies=[];});
 await page.waitForFunction(()=>window.__LINGHU__.app.ticker.maxFPS===60);
}
async function stress(fps,frames){
 return page.evaluate(({fps,frames})=>{
  const a=window.__LINGHU__,{app,game:g}=a;app.ticker.stop();
  const snapshot=()=>({resolution:app.renderer.resolution,scale:app.stage.scale.x,time:g.time,hp:g.life,bounds:{...g.hualing.bounds},low:a.view.ui.low,particles:a.view.particles.quality,saved:localStorage.getItem('linghu-quality'),targetFPS:app.ticker.maxFPS});
  const before=snapshot();let stamp=Math.max(performance.now(),app.ticker.lastTime);
  // Drive the application ticker through sustained stalls that used to force a downgrade.
  for(let i=0;i<frames;i++){stamp+=1000/fps;app.ticker.update(stamp);}
  return{fps,frames,before,after:snapshot(),gl:app.renderer.gl.getError()};
 },{fps,frames});
}
function unchanged(result,low){
 const {before,after}=result;
 assert.equal(after.resolution,before.resolution,'stalls cannot change rendering resolution');
 assert.equal(after.low,low);assert.equal(after.particles,low?'low':'high');assert.equal(after.saved,before.saved);
 assert.equal(after.targetFPS,60);assert.equal(before.scale,after.scale);assert.deepEqual(before.bounds,after.bounds);assert.equal(before.hp,after.hp);
 assert.ok(after.time-before.time>7.5,'simulation still advances at its authoritative elapsed time');assert.equal(result.gl,0);
}
try{
 await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.app.ticker.maxFPS===30);
 await begin();const high=await stress(30,250);unchanged(high,false);assert.equal(high.after.resolution,1.5);
 await page.evaluate(()=>window.__LINGHU__.action('pause'));await page.waitForFunction(()=>window.__LINGHU__.app.ticker.maxFPS===30);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.view.ui.overlay.children.some(c=>c.text==='画质：精致')),true);
 await page.evaluate(()=>window.__LINGHU__.action('resume'));await page.waitForFunction(()=>window.__LINGHU__.app.ticker.maxFPS===60);
 await page.evaluate(()=>window.__LINGHU__.action('quality'));
 assert.equal(await page.evaluate(()=>localStorage.getItem('linghu-quality')),'low');
 await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.app.ticker.maxFPS===30);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.view.ui.low),true);
 await begin();const low=await stress(15,150);unchanged(low,true);assert.equal(low.after.resolution,1);
 await page.evaluate(()=>window.__LINGHU__.action('pause'));await page.waitForFunction(()=>window.__LINGHU__.app.ticker.maxFPS===30);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.view.ui.overlay.children.some(c=>c.text==='画质：轻盈')),true);
 await page.evaluate(()=>window.__LINGHU__.action('quality'));
 assert.equal(await page.evaluate(()=>window.__LINGHU__.app.renderer.resolution),1.5);
 assert.equal(await page.evaluate(()=>localStorage.getItem('linghu-quality')),'high');
 await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.app.ticker.maxFPS===30);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.view.ui.low),false);
 await page.evaluate(()=>window.__LINGHU__.action('start'));await page.waitForFunction(()=>window.__LINGHU__.app.ticker.maxFPS===30);await page.waitForFunction(()=>window.__LINGHU__.mountainUI.mapReady);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.view.ui.low),false);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({high,low,errors},null,2));
 console.log('PASS real ticker: sustained 30/15fps stalls preserve manual quality, resolution and particle detail; pause/resume, saved settings and refresh; 60fps combat/30fps pause and map; zero page/WebGL errors');
}finally{await browser.close();}
