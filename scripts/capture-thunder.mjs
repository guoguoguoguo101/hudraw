import {chromium} from '@playwright/test';
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('screenshots/thunder-upgrade',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1180,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/?lab=1&qa=1&thunder=1');
await page.waitForFunction(()=>window.__THUNDER_PREVIEW__&&window.__LINGHU__);
await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
const frames=[];
for(let lv=1;lv<=4;lv++){
 await page.evaluate(lv=>{window.__THUNDER_PREVIEW__.frame(lv,[.3,.65,1.35,2.35][lv-1]);window.__LINGHU__.app.render();},lv);
 const data=await page.evaluate(()=>{const s=window.__LINGHU__.game.skills[0];return {hits:s.hit.size,targets:s.thunder.targets.length,x:window.__LINGHU__.view.fox.root.x,y:window.__LINGHU__.view.fox.root.y};});assert.equal(data.targets,[1,3,6,8][lv-1]);assert.equal(data.hits,data.targets);assert.equal(data.x,360);assert.equal(data.y,665);
 const b=await page.locator('#app').screenshot({path:`screenshots/thunder-upgrade/lv${lv}.png`});frames.push(await sharp(b).resize(360,640).png().toBuffer());
}
await sharp({create:{width:1440,height:684,channels:4,background:'#242326'}}).composite(frames.map((input,i)=>({input,left:i*360,top:44})).concat([{input:Buffer.from('<svg width="1440" height="44"><style>text{font:22px sans-serif;fill:#e7ba68}</style>'+[1,2,3,4].map((lv,i)=>`<text x="${i*360+145}" y="30">Lv${lv}</text>`).join('')+'</svg>'),left:0,top:0}])).png().toFile('screenshots/thunder-upgrade/comparison.png');
const seq=[];
for(const [i,t] of [.25,.8,1.4,1.75,2.35,3.6,4.6].entries()){
 await page.evaluate(t=>{window.__THUNDER_PREVIEW__.frame(4,t);window.__LINGHU__.app.render();},t);
 const b=await page.locator('#app').screenshot({path:`screenshots/thunder-upgrade/stage-${i}.png`});seq.push(await sharp(b).resize(240,427).png().toBuffer());
 if(t<1.65)assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills[0].hit.size),0);
}
await sharp({create:{width:1680,height:427,channels:4,background:'#242326'}}).composite(seq.map((input,i)=>({input,left:i*240,top:0}))).png().toFile('screenshots/thunder-upgrade/sequence.png');
assert.equal(await page.evaluate(()=>window.__LINGHU__.view.thunder.items.size),0);
await page.evaluate(()=>window.__LINGHU__.app.ticker.start());await page.getByRole('button',{name:'雷符 Lv4',exact:true}).click();await page.waitForTimeout(200);await page.getByRole('button',{name:'冻结 / 播放雷符',exact:true}).click();const t=await page.evaluate(()=>window.__LINGHU__.game.skills[0].age);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills[0].age),t);
await page.getByRole('button',{name:'重播雷符',exact:true}).click();await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>window.__LINGHU__.game.skills[0].age<.3));
assert.deepEqual(errors,[]);await browser.close();console.log('PASS four levels, target counts, delayed impact, fixed player, cleanup, freeze, replay, no page errors');
