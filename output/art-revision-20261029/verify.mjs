import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='output/art-revision-20261029';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],shots=[];
page.on('pageerror',e=>errors.push(e.message));
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function start(id){await page.evaluate(id=>{const a=window.__LINGHU__;a.app.ticker.start();a.beginMountain(id);a.game.invulnerable=1e6;},id);await page.waitForFunction(()=>window.__LINGHU__.view.scrollLandscape.chapterReady);await page.waitForTimeout(2200);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());}
async function shot(name){await page.screenshot({path:`${folder}/${name}.png`});shots.push(name);}
try{
 await page.goto('http://127.0.0.1:5181/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.beginMountain);
 await shot('menu-unchanged');
 for(const [chapter,base] of [['valley',0],['sea',10],['palace',20],['snow',30]]){
  for(const [phase,offset] of [['opening',0],['night',7]]){
   await start(base+offset);await shot(`${chapter}-${phase}`);
   assert.equal(await page.evaluate(()=>window.__LINGHU__.game.campaign.levelId),base+offset);
   const full=await page.evaluate(()=>{const f=window.__LINGHU__.view.combatFeedback;return [...f.barRigs.values()].filter(r=>r.root.visible).length;});
   assert.equal(full,0,'full-health ordinary enemies keep the paper clear');
  }
  await start(base+4);
  await page.evaluate(()=>{const a=window.__LINGHU__;a.game.campaign.room=4;a.app.ticker.start();});
  await page.waitForTimeout(2800);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
  await page.waitForFunction(()=>window.__LINGHU__.view.chapterBosses.ready);
  const bossSpacing=await page.evaluate(()=>{const r=window.__LINGHU__.view.chapterBosses,a=r.guard.getBounds(),b=r.hint.getBounds();return {gap:b.minY-a.maxY,command:r.command.width};});
  assert.ok(bossSpacing.gap>=1,'boss progress and instruction remain on separate lines');assert.ok(bossSpacing.command<=501);
  await shot(`${chapter}-boss`);
 }
 await start(30);
 const barState=await page.evaluate(()=>{
  const a=window.__LINGHU__,g=a.game,e=g.enemies[0],f=a.view.combatFeedback;
  e.hp-=10;e.hit=.1;f.update(g.enemies,1/60,true);
  const hit=f.barRigs.get(e.id)?.root.visible;
  f.update(g.enemies,.8,true);const injured=f.barRigs.get(e.id)?.root.visible;
  e.hp=e.maxHp;e.hit=0;f.update(g.enemies,2,true);const healed=f.barRigs.get(e.id)?.root.visible;
  const hud=a.mountainUI.combatHUD.health;
  g.invulnerable=0;g.hurt(76);a.mountainUI.update(a.view.ui.hud.y,a.view.ui.footer.y);a.app.render();
  return {hit,injured,healed,health:hud.value.text,warning:hud.status.text};
 });
 assert.equal(barState.hit,true);assert.equal(barState.injured,true);assert.equal(barState.healed,false);assert.equal(barState.warning,'受伤 −76');
 await shot('snow-critical');
 await page.evaluate(()=>{const a=window.__LINGHU__;a.action('hualingPractice');a.game.changeHualingChapter('snow');a.playUI.formal=true;a.game.invulnerable=1e6;a.app.ticker.start();});await settle();await page.waitForFunction(()=>window.__LINGHU__.view.scrollLandscape.chapterReady);await page.waitForTimeout(1000);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await shot('hualing-snow-formal');
 await page.evaluate(()=>{const a=window.__LINGHU__;a.playUI.formal=false;a.app.ticker.start();});await settle();await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await shot('hualing-snow-test');
 for(const [width,height]of [[375,667],[430,932]]){
  await page.setViewportSize({width,height});await settle();await start(30);await shot(`snow-${width}`);
  const bounds=await page.evaluate(()=>{const a=window.__LINGHU__,h=a.mountainUI.combatHUD.health;return {left:h.paper.getBounds().minX,right:h.paper.getBounds().maxX};});assert.ok(bounds.left>=0&&bounds.right<=width);
 }
 await page.evaluate(()=>{const a=window.__LINGHU__;a.action('menu');a.app.ticker.start();});await settle();assert.equal(await page.evaluate(()=>window.__LINGHU__.view.scrollLandscape.back.visible),false);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({shots,barState,errors},null,2));console.log(JSON.stringify({shots,barState,errors}));
}catch(e){await shot('verification-failure');console.log(JSON.stringify({error:e.message,errors}));throw e;}finally{await browser.close();}
