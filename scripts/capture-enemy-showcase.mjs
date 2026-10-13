import {chromium} from '@playwright/test';
import fs from 'node:fs';
fs.mkdirSync('screenshots/design',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
const page=await browser.newPage({viewport:{width:1240,height:1050},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/design/enemies/',{waitUntil:'networkidle'});
await page.locator('.copy h2').waitFor();
await page.screenshot({path:'screenshots/design/enemies-overview.png',fullPage:true});
for(let i=0;i<5;i++){
 await page.locator('.portrait').nth(i).click();
 const bounds=await page.locator('#main-art svg > g').evaluate(el=>{const b=el.getBBox();return {x:b.x,y:b.y,w:b.width,h:b.height};});
 if(bounds.x < -160||bounds.y < -160||bounds.x+bounds.w>160||bounds.y+bounds.h>160)throw new Error('Artwork is cropped: '+JSON.stringify(bounds));
 await page.locator('#charge').click();
 if(await page.locator('.artstage').getAttribute('class')!== 'artstage motion charging')throw new Error('Charge preview failed');
 await page.locator('#motion').click();
 await page.locator('#motion').click();
 await page.locator('#charge').click();
}
await page.locator('.portrait').nth(3).click();
await page.screenshot({path:'screenshots/design/enemies-elite.png',fullPage:true});
await page.setViewportSize({width:390,height:844});
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Mobile page overflows');
await page.screenshot({path:'screenshots/design/enemies-mobile.png',fullPage:true});
await browser.close();if(errors.length)throw new Error(errors.join('\n'));
console.log('PASS: five vector assets fit, character switching, animation controls, mobile layout, no browser errors');
