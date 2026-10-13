import {chromium} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const out=path.resolve('screenshots/archive');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
const page=await browser.newPage({viewport:{width:450,height:800},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const scene of ['win','lose']){
 await page.goto(`http://127.0.0.1:5173/?qa=1&scene=${scene}`,{waitUntil:'networkidle'});
 const canvas=page.locator('#app canvas');await canvas.waitFor();await page.waitForFunction(value=>document.querySelector('#app canvas')?.dataset.qaReady===value,scene);
 await canvas.screenshot({path:path.join(out,`settlement-${scene}.png`)});
}
await browser.close();if(errors.length)throw new Error(errors.join('\n'));
console.log(`Saved settlement screenshots to ${out}`);
