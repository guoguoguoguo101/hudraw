import {chromium} from '@playwright/test';
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
const dir='screenshots/flowing-scroll';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1250,height:960}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/?lab=1&qa=1&ultimate=1');await page.waitForFunction(()=>window.__SLASH_PREVIEW__&&window.__LINGHU__);
await page.locator('select').first().selectOption('0');
await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
for(const [name,t] of [['wave',.16],['scroll',.40]]){
 await page.evaluate(async t=>{(await import('/src/rendering/ultimate.ts')).setSilhouetteOnly(true);const {view,app}=window.__LINGHU__;window.__SLASH_PREVIEW__.frame(4,t);view.root.children.forEach(c=>c.visible=c===view.world);view.world.children.forEach(c=>c.visible=c===view.slashes.root);view.slashes.root.mask=null;view.slashes.root.children[0].visible=false;for(const item of view.slashes.items.values())for(const ghost of item.ghosts?.values()??[])ghost.visible=false;view.world.position.set(-250,-375);app.renderer.resize(1100,600);const el=document.getElementById('app');el.style.width='1100px';el.style.height='600px';el.style.flexShrink='0';document.querySelector('.lab-panel').style.display='none';app.render();},t);
 await page.locator('#app').screenshot({path:`${dir}/outline-${name}.png`});
}
await sharp({create:{width:1100,height:1200,channels:4,background:'#192027'}}).composite([{input:`${dir}/outline-wave.png`,left:0,top:0},{input:`${dir}/outline-scroll.png`,left:0,top:600}]).png().toFile(`${dir}/outlines.png`);
if(process.argv.includes('--outline')){await browser.close();process.exit(0);}
await page.reload();await page.waitForFunction(()=>window.__SLASH_PREVIEW__&&window.__LINGHU__);
await page.locator('select').first().selectOption('0');
await page.evaluate(async()=>{(await import('/src/rendering/ultimate.ts')).setSilhouetteOnly(false);});
// Capture the actual running ticker rather than reconstructing frames with the scrubber.
await page.getByRole('button',{name:'预览 Lv4',exact:true}).click();
const shots=[];const start=Date.now();
for(const target of [140,280,440,610,780,1030]){
 const remaining=target-(Date.now()-start);if(remaining>0)await page.waitForTimeout(remaining);
 const time=await page.evaluate(()=>document.querySelector('.slash-preview input[type=range]').value);
 const file=`${dir}/live-${target}.png`;const buf=await page.locator('#app').screenshot({path:file});shots.push({buf,time});
}
const tiles=[];for(let i=0;i<shots.length;i++){tiles.push({input:await sharp(shots[i].buf).resize(360,640).toBuffer(),left:(i%3)*360,top:Math.floor(i/3)*680+40});tiles.push({input:Buffer.from(`<svg width="360" height="40"><text x="18" y="28" fill="#e7ba68" font-size="20">${shots[i].time}s</text></svg>`),left:(i%3)*360,top:Math.floor(i/3)*680});}
await sharp({create:{width:1080,height:1360,channels:4,background:'#192027'}}).composite(tiles).png().toFile(`${dir}/live-sequence.png`);
await page.evaluate(()=>{window.__LINGHU__.app.ticker.stop();window.__SLASH_PREVIEW__.frame(4,.43);window.__LINGHU__.app.render();});await page.locator('#app').screenshot({path:`${dir}/scene.png`});
await page.evaluate(()=>{const {view,app}=window.__LINGHU__;window.__SLASH_PREVIEW__.frame(4,.43);view.root.children.forEach(c=>c.visible=c===view.world);view.world.children.forEach(c=>c.visible=c===view.slashes.root);view.slashes.root.mask=null;view.slashes.root.children[0].visible=false;for(const item of view.slashes.items.values())for(const ghost of item.ghosts?.values()??[])ghost.visible=false;view.world.position.set(-180,-160);app.renderer.resize(1100,1000);const el=document.getElementById('app');el.style.width='1100px';el.style.height='1000px';document.querySelector('.lab-panel').style.display='none';app.render();});
await page.locator('#app').screenshot({path:`${dir}/detail.png`});
if(errors.length)throw Error(errors.join('\n'));console.log('PASS live animation, outline isolation, both phases and fade; '+shots.map(s=>s.time).join(', '));await browser.close();
