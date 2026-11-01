import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='screenshots/brush-line';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
async function frame(seconds=0){return page.evaluate(seconds=>{const a=window.__LINGHU__,g=a.game;for(let t=0;t<seconds-1e-8;t+=1/60){const dt=Math.min(1/60,seconds-t);g.advance(dt,a.input.drawing);a.input.update(dt);a.view.update(g,a.input,dt,60,dt);}for(const e of g.drain())a.view.event(e);a.view.update(g,a.input,0,60,0);a.playUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.brushUpgradeUI.update(a.view.ui.hud.y);a.mountainUI.update(a.view.ui.hud.y,a.view.ui.footer.y);a.app.render();return{effects:g.hualing.upgrades.line.effects.map(e=>e.kind),gl:a.app.renderer.gl.getError(),bounds:g.hualing.bounds,level:g.hualing.upgrades.levels.line};},seconds);}
async function stroke(p,q){const screen=await page.evaluate(async({p,q})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return[p,q].map(p=>({x:r.left+v.x+p.x*v.scale,y:r.top+v.y+p.y*v.scale}));},{p,q});await page.mouse.move(screen[0].x,screen[0].y);await page.mouse.down();await page.mouse.move(screen[1].x,screen[1].y,{steps:18});await page.mouse.up();await frame();}
try{
 await page.goto((process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5280')+'/?mode=hualing&qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.playUI);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const mode of ['sandbox','campaign'])for(const level of [1,2,3,4]){
  const b=await page.evaluate(({mode,level})=>{const a=window.__LINGHU__,g=a.game;a.input.cancel();if(mode==='campaign'){a.beginMountain(0);a.mountainUI.opened=false;}else g.start(false,true,false,false,true);g.director.disabled=true;g.campaign.spawn=999;g.hualing.frozen=true;g.hualing.journey.autoEvents=false;g.enemies=[];g.ink.setUnlimited(true);g.hualing.upgrades.setLevel('line',level);a.playUI.formal=true;a.brushUpgradeUI.compactUI=true;a.view.begin();return g.hualing.bounds;},{mode,level});await frame();
  const y=b.top+140,base=Math.min(b.bottom-140,y+300),path=[[{x:100,y:base+50},{x:380,y:y-30}],[{x:340,y:y-30},{x:620,y:base+50}],[{x:100,y:base},{x:620,y:base}]];
  await stroke(...path[0]);await frame(.06);assert.ok((await frame()).effects.includes('slash'));
  if(level>=2){await stroke(...path[1]);await frame(.1);assert.ok((await frame()).effects.includes('cross'));}
  if(level>=3){await stroke(...path[2]);if(process.env.CAPTURE_LINE==='1'&&mode==='sandbox'&&level===4){await mkdir(`${dir}/frames`,{recursive:true});for(let i=0;i<22;i++){await frame(.05);await page.screenshot({path:`${dir}/frames/frame-${String(i).padStart(3,'0')}.png`});}}await frame(.47);assert.ok((await frame()).effects.includes('seal'));}
  await page.screenshot({path:`${dir}/${mode}-lv${level}.png`});
  if(level===4){await frame(.4);await stroke({x:60,y:y+120},{x:650,y:y+120});await frame(.08);assert.ok((await frame()).effects.includes('borrow'));await frame(.25);await page.screenshot({path:`${dir}/${mode}-lv4-scroll.png`});await frame(.24);await page.screenshot({path:`${dir}/${mode}-lv4-borrow.png`});if(process.env.CAPTURE_LINE==='1'&&mode==='sandbox'){for(let i=22;i<36;i++){await frame(.05);await page.screenshot({path:`${dir}/frames/frame-${String(i).padStart(3,'0')}.png`});}}}
  const state=await frame();assert.equal(state.gl,0);results.push({mode,level,...state});
 }
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.start(false,true,false,false,true);a.game.hualing.upgrades.panel='custom';a.playUI.formal=true;a.brushUpgradeUI.compactUI=true;});await frame();await page.screenshot({path:`${dir}/five-skills-mobile.png`});
 const zones=await page.evaluate(()=>{const a=window.__LINGHU__,u=a.brushUpgradeUI;return u.zones.map(z=>({x:z.x,y:z.y,w:z.w,h:z.h}));});assert.equal(zones.length,30);assert.ok(zones.every(z=>z.y+z.h<1280));
 assert.deepEqual(errors,[]);await writeFile(`${dir}/verification.json`,JSON.stringify({results,errors,zones},null,2));console.log('PASS real-pointer all four tiers in sandbox and campaign; fifth-skill mobile layout, WebGL and page errors');
}finally{await browser.close();}
