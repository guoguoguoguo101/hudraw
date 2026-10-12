import {chromium} from '@playwright/test';
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('screenshots/slash-upgrade',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1180,height:900},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/?lab=1&qa=1');await page.waitForFunction(()=>window.__SLASH_PREVIEW__&&window.__LINGHU__);
await page.locator('select').selectOption(String(Math.PI*1.5));
const frames=[];
for(const [i,time] of [.095,.14,.19,.28].entries()){
 await page.evaluate(([level,time])=>{window.__LINGHU__.app.ticker.stop();window.__SLASH_PREVIEW__.frame(level,time);window.__LINGHU__.app.render();},[i+1,time]);
 const buf=await page.locator('#app').screenshot({path:`screenshots/slash-upgrade/lv${i+1}.png`});frames.push(await sharp(buf).resize(360,640).png().toBuffer());
}
for(const [name,time] of [['line',.15],['fan',.28],['burst',.35],['fade',.56]]){await page.evaluate(t=>{window.__SLASH_PREVIEW__.frame(4,t);window.__LINGHU__.app.render();},time);await page.locator('#app').screenshot({path:`screenshots/slash-upgrade/lv4-${name}.png`});}
await sharp({create:{width:1440,height:684,channels:4,background:'#192027'}}).composite(frames.map((input,i)=>({input,left:i*360,top:44})).concat([{input:Buffer.from('<svg width="1440" height="44"><style>text{font:22px sans-serif;fill:#e7ba68}</style><text x="140" y="30">Lv1</text><text x="500" y="30">Lv2</text><text x="860" y="30">Lv3</text><text x="1220" y="30">Lv4</text></svg>'),left:0,top:0}])).png().toFile('screenshots/slash-upgrade/comparison.png');
// Actual button replay advances, then slider holds combat age.
await page.evaluate(()=>window.__LINGHU__.app.ticker.start());await page.getByRole('button',{name:'预览 Lv4',exact:true}).click();await page.waitForTimeout(220);const age=await page.evaluate(()=>window.__LINGHU__.game.skills[0]?.age);assert.ok(age>.13&&age<.65);
assert.deepEqual(errors,[]);console.log('PASS four screenshots, Lv4 timeline frames, collage, actual preview replay; no page errors');await browser.close();
