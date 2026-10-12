import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('screenshots/four-runes', { recursive: true });
const browser = await chromium.launch({headless:true,channel:"msedge"});
const page = await browser.newPage({viewport:{width:430,height:765},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const scene of ['line','circle','triangle','z']){
 await page.goto(`http://127.0.0.1:5173/?qa=1&scene=${scene}`);
 await page.waitForSelector(`canvas[data-qa-ready="${scene}"]`);
 await page.screenshot({path:`screenshots/four-runes/${scene}.png`});
 console.log(scene,await page.evaluate(()=>({rune:window.__LINGHU__.input.last?.rune,skills:window.__LINGHU__.game.skills.map(s=>s.rune)})));
}
await browser.close();
if(errors.length)throw new Error(errors.join('\n'));
