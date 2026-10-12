import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,access} from 'node:fs/promises';
const folder='assets/vfx/天狐雷劫/screenshots/mobile-layout';
await mkdir(folder,{recursive:true});
async function filename(label){for(let version=1;;version++){const path=`${folder}/天狐雷劫_${label}_预览图_v${String(version).padStart(2,'0')}.png`;try{await access(path);}catch{return path;}}}
const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
for(const [width,height] of [[375,844],[390,844],[430,932],[844,390]]){
 const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://192.168.1.2:5174/?lab=1&thunder=1&qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__LINGHU__&&window.__THUNDER_PREVIEW__);
 await page.evaluate(()=>{window.__LINGHU__.app.ticker.stop();window.__THUNDER_PREVIEW__.frame(4,0);window.__LINGHU__.app.render();});
 const bounds=await page.evaluate(()=>{const app=document.querySelector('#app').getBoundingClientRect(),panel=document.querySelector('.lab-panel').getBoundingClientRect();return {top:app.top,bottom:app.bottom,left:app.left,right:app.right,height:app.height,panelTop:panel.top,panelBottom:panel.bottom,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,heightScreen:innerHeight};});
 assert.ok(bounds.top>=-1&&bounds.bottom<=height+1);assert.ok(bounds.height>100);assert.ok(bounds.left>=-1&&bounds.right<=width+1);assert.ok(bounds.scrollWidth<=width+1);
 const before=await page.locator('#app').boundingBox();assert.ok(before.height>=Math.min(height,width*16/9)-2);assert.equal(await page.locator('.lab-panel').isVisible(),false);await page.getByRole('button',{name:'技能栏',exact:true}).click();assert.equal(await page.locator('.lab-panel').isVisible(),true);
 await page.getByRole('button',{name:'雷符 Lv2',exact:true}).click();
 const after=await page.locator('#app').boundingBox();assert.equal(Math.round(before.y),Math.round(after.y));assert.ok(await page.evaluate(()=>window.__LINGHU__.game.skills[0].testLevel===2));
 assert.equal(await page.locator('.lab-panel').isVisible(),false);await page.getByRole('button',{name:'技能栏',exact:true}).click();await page.evaluate(()=>document.querySelector('.lab-panel').scrollTop=0);const afterScroll=await page.locator('#app').boundingBox();assert.equal(Math.round(afterScroll.y),Math.round(before.y));await page.getByRole('button',{name:'收起技能栏',exact:true}).click();
 if(width===390){await page.evaluate(()=>{window.__THUNDER_PREVIEW__.frame(4,1.7);window.__LINGHU__.app.render();});await page.screenshot({path:await filename('手机390_全屏战场')});}
 console.log(`PASS ${width}x${height}: battlefield visible, controls work, no horizontal overflow`);await page.close();
}
assert.deepEqual(errors,[]);await browser.close();
