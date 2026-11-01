import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}});
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5183'}/?qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
 await page.evaluate(async()=>{const a=window.__LINGHU__;a.beginMountain(0);a.mountainUI.opened=false;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();a.game.enemies=[];a.view.animator.clear();a.view.entrance.y=665;});
 for(const [mode,side]of[['idle',1],['attack',1],['attack',-1]]){
  const result=await page.evaluate(({mode,side})=>{
   const a=window.__LINGHU__,f=a.view.fox;f.act('idle');a.view.foxResponse.clear();f.act(mode);a.game.invulnerable=1;
   a.view.update(a.game,a.input,.18,60,.18);f.root.scale.x=Math.abs(f.root.scale.x)*side;f.update(a.view.clock,0,1);a.view.foxResponse.drawFX(f,a.game.hualing.clock,1);
   a.mountainUI.update(a.view.ui.hud.y,a.view.ui.footer.y);a.app.render();
   const b=a.view.foxResponse.glow.getLocalBounds();return{minX:b.minX,minY:b.minY,maxX:b.maxX,maxY:b.maxY,x:f.root.x,y:f.root.y,mode,side};
  },{mode,side});
  assert.ok(result.minX>result.x-70,JSON.stringify(result));assert.ok(result.minY>result.y-70,JSON.stringify(result));
  assert.ok(result.maxX<result.x+70,JSON.stringify(result));assert.ok(result.maxY<result.y+75,JSON.stringify(result));
 }
 await mkdir('screenshots/fox-arc-fix',{recursive:true});await page.screenshot({path:'screenshots/fox-arc-fix/after.png'});
 console.log('PASS protection and left/right attack arcs stay within the fox effect area; no canvas-origin connectors');
}finally{await browser.close();}
