import {chromium} from '@playwright/test';
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='screenshots/fox-guardian';await mkdir(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1180,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket('**',ws=>ws.close());
 await page.goto(process.env.ARROW_CAPTURE_URL??'http://127.0.0.1:5174/?lab=1&qa=1&arrow=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__&&window.__ARROW_PREVIEW__);
 await page.evaluate(()=>{window.__LINGHU__.app.ticker.stop();window.__ARROW_PREVIEW__.moving(false);window.__ARROW_PREVIEW__.frame(4,0);});
 const frames=[],width=300,height=534;
 for(let i=0;i<52;i++){
  await page.evaluate(()=>{const {game,view,input,app}=window.__LINGHU__;for(let n=0;n<8;n++){for(const e of game.enemies){e.ai='Recovery';e.stateAge=0;e.vx=e.vy=0;}game.update(1/128);for(const e of game.drain())view.event(e);view.update(game,input,1/128,60);}view.ui.timer.text='∞';app.render();});
  const buffer=await page.locator('#app').screenshot();frames.push(await sharp(buffer).resize(width,height).ensureAlpha().raw().toBuffer());
 }
 await sharp(Buffer.concat(frames),{raw:{width,height:height*frames.length,channels:4,pageHeight:height}}).gif({delay:63,loop:0,effort:3,colours:128}).toFile(`${dir}/guardian-motion.gif`);assert.deepEqual(errors,[]);console.log('PASS 52-frame guardian animation capture');
}finally{await browser.close();}
