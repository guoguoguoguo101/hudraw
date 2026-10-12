import {chromium} from '@playwright/test';
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('screenshots/circle-upgrade',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1180,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/?lab=1&qa=1',{waitUntil:'commit',timeout:60000});
await page.waitForFunction(()=>window.__CIRCLE_PREVIEW__&&window.__LINGHU__);
const frames=[];
for(let lv=1;lv<=5;lv++){
 await page.evaluate(lv=>{window.__LINGHU__.app.ticker.stop();window.__CIRCLE_PREVIEW__.frame(lv,lv===5?3.2:.8);window.__LINGHU__.app.render();},lv);
 const state=await page.evaluate(()=>{const view=window.__LINGHU__.view,ward=[...view.circles.wards.values()][0];return {shield:window.__LINGHU__.game.shield,wards:view.circles.wards.size,phantom:!!ward.grand?.fox,shadows:ward.grand?.orbit?.shadows.length??0};});
 assert.equal(state.shield,[20,35,50,80,120][lv-1]);assert.equal(state.wards,1);
 assert.equal(state.phantom,lv>=4);assert.equal(state.shadows,lv===4?9:0);
 const buffer=await page.locator('#app').screenshot({path:`screenshots/circle-upgrade/lv${lv}.png`});
 frames.push(await sharp(buffer).resize(360,640).png().toBuffer());
}
await sharp({create:{width:1800,height:684,channels:4,background:'#192027'}}).composite(frames.map((input,i)=>({input,left:i*360,top:44})).concat([{input:Buffer.from('<svg width="1800" height="44"><style>text{font:22px sans-serif;fill:#e7ba68}</style><text x="140" y="30">Lv1</text><text x="500" y="30">Lv2</text><text x="860" y="30">Lv3</text><text x="1220" y="30">Lv4</text><text x="1580" y="30">Lv5</text></svg>'),left:0,top:0}])).png().toFile('screenshots/circle-upgrade/comparison.png');
if(process.argv.includes('--frames-only')){assert.deepEqual(errors,[]);await browser.close();console.log('PASS five level frames');process.exit(0);}
for(const t of [0,.16,.35,6.8,7])await page.evaluate(t=>{window.__CIRCLE_PREVIEW__.frame(5,t);window.__LINGHU__.app.render();},t);
assert.equal(await page.evaluate(()=>window.__LINGHU__.view.circles.wards.size),0);
await page.evaluate(()=>window.__LINGHU__.app.ticker.start());await page.getByRole('button',{name:'圆阵 Lv2',exact:true}).click();await page.waitForTimeout(450);
assert.ok(await page.evaluate(()=>window.__LINGHU__.game.skills[0]?.age>.1));
await page.getByRole('button',{name:'冻结 / 播放圆阵',exact:true}).click();
const age=await page.evaluate(()=>window.__LINGHU__.game.skills[0]?.age);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills[0]?.age),age);
await page.getByRole('button',{name:'圆阵 Lv5',exact:true}).click();await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills[0]?.testLevel),5);
assert.deepEqual(errors,[]);await browser.close();console.log('PASS five levels, shields, cleanup, button replay, freeze, no browser errors');
