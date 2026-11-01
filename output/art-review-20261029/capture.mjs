import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='output/art-review-20261029';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[],shots=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5181/?qa=1',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__LINGHU__?.beginMountain);
 for(const [chapter,base] of [['valley',0],['sea',10],['palace',20],['snow',30]]){
  for(const [phase,offset] of [['opening',0],['night',7]]){
   await page.evaluate(id=>{const a=window.__LINGHU__;a.app.ticker.start();a.beginMountain(id);a.game.invulnerable=1e6;},base+offset);
   await page.waitForFunction(()=>window.__LINGHU__.view.scrollLandscape.chapterReady);
   await page.waitForTimeout(2200);
   await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
   const name=`${chapter}-${phase}`;
   await page.screenshot({path:`${folder}/${name}.png`});
   shots.push({name,...await page.evaluate(()=>{const a=window.__LINGHU__,g=a.game;return {level:g.campaign.levelId,stage:g.hualing.journey.stage,enemies:g.enemies.length,chapter:g.hualing.journey.chapter};})});
  }
 }
 await page.evaluate(()=>{const a=window.__LINGHU__;a.beginMountain(4);a.game.invulnerable=1e6;a.game.campaign.room=4;a.app.ticker.start();});
 await page.waitForTimeout(2800);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 await page.screenshot({path:`${folder}/valley-boss.png`});
 shots.push({name:'valley-boss',...await page.evaluate(()=>({boss:!!window.__LINGHU__.game.hualing.bosses.active,enemies:window.__LINGHU__.game.enemies.length}))});
 await page.evaluate(()=>{const a=window.__LINGHU__,g=a.game;a.beginMountain(1);g.invulnerable=1e6;g.campaign.room=3;g.campaign.granted=7;const u=g.hualing.upgrades;u.setLevel('spray',2);u.setLevel('wide',2);u.setLevel('splash',2);u.setLevel('trail',1);u.picks=7;u.pending=0;u.panel=null;a.app.ticker.start();});
 await page.waitForTimeout(6500);
 const points=await page.evaluate(async()=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return [150,600].map(x=>({x:r.left+v.x+x*v.scale,y:r.top+v.y+530*v.scale}));});
 await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();
 await page.mouse.move(points[1].x,points[1].y,{steps:30});
 await page.waitForTimeout(150);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 await page.screenshot({path:`${folder}/valley-brush.png`});
 await page.mouse.up();shots.push({name:'valley-brush',note:'QA setup: seven earned skill points, live pointer stroke in campaign'});
 await page.setViewportSize({width:375,height:667});
 await page.evaluate(()=>{const a=window.__LINGHU__;a.beginMountain(30);a.game.invulnerable=1e6;a.app.ticker.start();});
 await page.waitForTimeout(2200);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 await page.screenshot({path:`${folder}/snow-opening-375.png`});
 await writeFile(`${folder}/capture.json`,JSON.stringify({shots,errors},null,2));
 console.log(JSON.stringify({shots,errors}));
}catch(e){await page.screenshot({path:`${folder}/capture-failure.png`});console.log(JSON.stringify({message:e.message,errors,body:(await page.locator('body').innerText()).slice(0,2000)}));throw e;}finally{await browser.close();}
