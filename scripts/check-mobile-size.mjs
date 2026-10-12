import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import sharp from 'sharp';
await mkdir('screenshots/mobile-size',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
for(const width of [375,390]){
 const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await page.goto('http://127.0.0.1:5173/?lab=1&qa=1');await page.waitForFunction(()=>window.__LINGHU__&&window.__SLASH_PREVIEW__);
 await page.locator('select').first().selectOption('0');
 const sizes=await page.evaluate(()=>{
  const {view,app}=window.__LINGHU__;app.ticker.stop();document.body.classList.remove('lab');document.querySelector('.lab-panel').style.display='none';window.__SLASH_PREVIEW__.frame(4,.43);app.render();
  const width=document.getElementById('app').getBoundingClientRect().width,fox=view.fox.root.getBounds();
  const mobs=[...view.enemyRigs.values()].filter(r=>r.root.visible).map(r=>r.root.getBounds().width/720*width);
  return {screenWidth:innerWidth,gameWidth:width,foxWidth:fox.width/720*width,foxShare:fox.width/720,mobWidths:mobs};
 });
 await page.locator('#app').screenshot({path:`screenshots/mobile-size/phone-${width}.png`});
 await page.evaluate(()=>{const {view,app}=window.__LINGHU__;view.root.children.forEach(c=>c.visible=c===view.world);view.world.children.forEach(c=>c.visible=c===view.actors);view.actors.children.forEach(c=>c.visible=c===view.fox.root);app.render();});
 const pixels=await sharp(await page.locator('#app').screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true});
 let left=pixels.info.width,right=-1;
 for(let y=0;y<pixels.info.height;y++)for(let x=0;x<pixels.info.width;x++){const at=(y*pixels.info.width+x)*3;if(Math.max(Math.abs(pixels.data[at]-25),Math.abs(pixels.data[at+1]-32),Math.abs(pixels.data[at+2]-39))>35){left=Math.min(left,x);right=Math.max(right,x);}}
 sizes.visibleFoxWidth=right-left+1;sizes.visibleFoxShare=sizes.visibleFoxWidth/sizes.gameWidth;
 results.push(sizes);await page.close();
}
console.log(JSON.stringify(results));await browser.close();
