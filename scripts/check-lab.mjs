import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/?lab=1&qa=1');await page.waitForSelector('.lab-levels');
for(const [index,rune] of ['line','circle','triangle','z'].entries())for(let lv=1;lv<=4;lv++){
 await page.locator(`input[name="level-${rune}"][value="${lv}"]`).check();await page.locator('.lab-row').filter({hasText:`${index+1} ·`}).getByRole('button',{name:'释放',exact:true}).click();
 const skill=await page.evaluate(()=>{const s=window.__LINGHU__.game.skills.at(-1);return {rune:s.rune,lv:s.testLevel};});assert.deepEqual(skill,{rune,lv});
}
await page.locator('canvas').click({position:{x:10,y:120}});const before=await page.evaluate(()=>window.__LINGHU__.game.casts);await page.keyboard.press('1');assert.equal(await page.evaluate(()=>window.__LINGHU__.game.casts),before+1);
const serial=await page.evaluate(()=>window.__LINGHU__.game.serial);await page.waitForTimeout(1300);assert.ok(await page.evaluate(()=>window.__LINGHU__.game.serial)>serial);assert.deepEqual(errors,[]);await page.screenshot({path:'screenshots/four-runes/lab-levels.png'});console.log('PASS 16 levels, keyboard cast, continuous enemies, no browser errors');await browser.close();
