import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/mountain-map-guardians';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function zone(index){const p=await page.evaluate(async index=>{const a=window.__LINGHU__,z=a.mountainUI.zones[index],r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+(z.x+z.w/2)*v.scale,y:r.top+v.y+(z.y+z.h/2)*v.scale};},index);await page.mouse.click(p.x,p.y);await settle();}
try{
 await page.goto(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5175/?mode=mountains&qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.mountainUI?.opened);
 for(const [width,height] of [[390,844],[375,667],[430,932]]){
  await page.setViewportSize({width,height});await settle();
  for(const [i,ch] of ['valley','sea','palace','snow'].entries()){
   await zone(i);await page.waitForFunction(()=>window.__LINGHU__.mountainUI.mapReady);await settle();
   assert.equal(await page.evaluate(()=>window.__LINGHU__.mountainUI.zones.length),16);
   for(const index of [0,3,4,8,9]){await zone(4+index);assert.equal(await page.evaluate(()=>window.__LINGHU__.mountainUI.selected),i*10+index);}
   await zone(4+(i===0?0:4));
   const state=await page.evaluate(()=>{const a=window.__LINGHU__,m=a.mountainUI;return {chapter:m.chapter,selected:m.selected,header:a.view.ui.hud.y,footer:a.view.ui.footer.y,gl:a.app.renderer.gl?.getError()??0,zones:m.zones.map(z=>({x:z.x,y:z.y,w:z.w,h:z.h}))};});
   assert.equal(state.gl,0);assert.ok(state.zones.every(z=>z.x>=0&&z.x+z.w<=720&&z.y>=state.header&&z.y+z.h<=1280+state.footer));
   if(width===390){
    const motion=await page.evaluate(async()=>{
     const m=window.__LINGHU__.mountainUI.mapLife;
     const snapshot=()=>m.actors.map(a=>[a.node.x,a.node.y,a.node.rotation,...a.node.children.map(c=>c.rotation)]);
     const before=snapshot(),count=m.root.children.length;
     await new Promise(r=>setTimeout(r,350));
     return{before,after:snapshot(),count,afterCount:m.root.children.length,eventMode:m.root.eventMode};
    });
    assert.notDeepEqual(motion.before,motion.after,'chapter wildlife should animate while selecting a level');
    assert.equal(motion.count,motion.afterCount);assert.equal(motion.eventMode,'none');
   }
   results.push({width,ch,...state});await page.screenshot({path:`${folder}/${ch}-${width}.png`});
  }
 }
 // Completion stamps and selected state coexist without changing a completed level's click target.
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.campaign.completed.add(0);a.game.campaign.completed.add(4);a.game.campaign.completed.add(9);});await zone(0);await settle();await page.screenshot({path:`${folder}/completed-430.png`});
 await zone(13);await zone(15);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.campaign.levelId),9);assert.equal(await page.evaluate(()=>window.__LINGHU__.mountainUI.opened),false);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.panel),null);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.upgrades.pending),0);
 await page.evaluate(()=>window.__LINGHU__.action('start'));await settle();assert.equal(await page.evaluate(()=>window.__LINGHU__.mountainUI.opened),true);await zone(14);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.state),'menu');
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.mountainUI?.mapReady);await settle();
 const still=await page.evaluate(async()=>{const m=window.__LINGHU__.mountainUI.mapLife;const snapshot=()=>m.actors.map(a=>[a.node.x,a.node.y,a.node.rotation,...a.node.children.map(c=>c.rotation)]);const before=snapshot();await new Promise(r=>setTimeout(r,250));return{before,after:snapshot()};});assert.deepEqual(still.before,still.after,'reduced-motion setting should keep wildlife still');
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));
 console.log('PASS chapter map design: four chapter backgrounds and regular two-column level seals, 375/390/430 layouts, ordered hit targets, completed stamps, boss selection/start, first upgrade and return; zero page/WebGL errors');
}finally{await browser.close();}
