import {chromium} from '@playwright/test';
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';

const dir='screenshots/arrow-review-2026-10-13';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1180,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/?lab=1&qa=1&arrow=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__ARROW_PREVIEW__&&window.__LINGHU__);
 await page.evaluate(()=>{window.__LINGHU__.app.ticker.stop();window.__ARROW_PREVIEW__.moving(false);});
 const panels=[],times=[.29,.36,.42,2.16],names=['穿甲矢','追魂矢','诛妖矢','灵狐降灵'];
 for(let lv=1;lv<=4;lv++){
  await page.evaluate(({lv,t})=>{window.__ARROW_PREVIEW__.frame(lv,t);window.__LINGHU__.app.render();},{lv,t:times[lv-1]});
  const shot=await page.locator('#app').screenshot({path:`${dir}/lv${lv}.png`});
  panels.push(await sharp(shot).resize(450,800).png().toBuffer());
 }
 const labels=Buffer.from(`<svg width="960" height="1780" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:'Microsoft YaHei',sans-serif;fill:#f5e4c4} .title{font-size:27px;font-weight:700} .label{font-size:23px;font-weight:600}</style><text x="20" y="36" class="title">箭头技能 · Lv1–Lv4 当前实机预览</text>${names.map((name,i)=>`<text x="${20+i%2*470}" y="${88+Math.floor(i/2)*875}" class="label">Lv${i+1} · ${name}</text>`).join('')}</svg>`);
 await sharp({create:{width:960,height:1780,channels:4,background:'#242127'}}).composite([...panels.map((input,i)=>({input,left:20+i%2*470,top:110+Math.floor(i/2)*875})),{input:labels,left:0,top:0}]).png().toFile(`${dir}/arrow-levels-review.png`);
 if(errors.length)throw new Error(errors.join('\n'));
 console.log(`Saved ${dir}/arrow-levels-review.png`);
} finally {await browser.close();}
