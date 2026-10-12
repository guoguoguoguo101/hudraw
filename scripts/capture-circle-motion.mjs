import {chromium} from '@playwright/test';
import sharp from 'sharp';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1180,height:900}});
await page.goto('http://127.0.0.1:5173/?lab=1&qa=1',{waitUntil:'commit',timeout:60000});
await page.waitForFunction(()=>window.__CIRCLE_PREVIEW__&&window.__LINGHU__);
await page.evaluate(()=>{window.__LINGHU__.app.ticker.stop();window.__CIRCLE_PREVIEW__.frame(5,3.0);});
const frames=[];let height;
for(let i=0;i<36;i++){
 const t=i*.14;
 await page.evaluate(t=>{const {view,app,game,input}=window.__LINGHU__;game.skills[0].age=t;view.update(game,input,0,60);app.render();},t);
 const {data,info}=await sharp(await page.locator('#app').screenshot()).resize({width:400}).ensureAlpha().raw().toBuffer({resolveWithObject:true});height=info.height;frames.push(data);
}
await sharp(Buffer.concat(frames),{raw:{width:400,height:height*frames.length,channels:4,pageHeight:height}}).gif({delay:140,loop:0,effort:4}).toFile('screenshots/circle-upgrade/lv5-motion.gif');
await browser.close();console.log('Saved Lv5 tail and scroll motion preview');
