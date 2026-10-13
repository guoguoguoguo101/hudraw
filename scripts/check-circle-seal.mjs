import {chromium} from '@playwright/test';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {mkdir,access,writeFile} from 'node:fs/promises';
const folder='assets/vfx/circle_lv5/交互图片/预览实机图';
await mkdir(folder,{recursive:true});
async function nextFile(stem,extension,dir=folder){for(let n=1;;n++){const file=`${dir}/${stem}_v${String(n).padStart(2,'0')}.${extension}`;try{await access(file);}catch{return file;}}}
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1180,height:900}}),errors=[],saved=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173/?lab=1&qa=1',{waitUntil:'commit',timeout:60000});
 await page.waitForFunction(()=>window.__CIRCLE_PREVIEW__&&window.__LINGHU__);
 await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 const frames=[],vectors=[];
 for(let level=1;level<=4;level++){
  await page.evaluate(level=>{const {game,app}=window.__LINGHU__;game.shield=game.shieldTime=0;window.__CIRCLE_PREVIEW__.frame(level,.85,'seal');app.render();},level);
  const state=await page.evaluate(()=>{const {game,view}=window.__LINGHU__,s=game.skills[0],w=view.circles.wards.get(s.id);return {mode:s.circle.mode,radius:s.radius,x:s.x,y:s.y,shield:game.shield,gates:w.seal?.gates.length,phantom:!!w.grand?.fox,captured:s.circle.captured.size,health:game.enemies.map(e=>e.hp)};});
  assert.equal(state.mode,'seal');assert.equal(state.radius,[200,230,270,320][level-1]);assert.ok(Math.abs(state.x-360)<1);assert.ok(Math.abs(state.y-320)<1);assert.equal(state.shield,0);assert.equal(state.gates,level===4?4:0);assert.equal(state.phantom,false);assert.equal(state.captured,3);assert.ok(state.health.slice(0,3).every(h=>h<1600));assert.equal(state.health[3],1600);
  const file=await nextFile(`圆形护阵_Lv${level}_镇妖阵实机预览图`,'png');const buffer=await page.locator('#app').screenshot({path:file});saved.push(file);frames.push(await sharp(buffer).resize(360,640).png().toBuffer());
  vectors.push(await page.evaluate(async()=>{const {vectorMarkup}=await import('/src/rendering/vector-export.ts'),ward=[...window.__LINGHU__.view.circles.wards.values()][0],marks=ward.seal.marks;marks.visible=false;const content=vectorMarkup(ward.seal.root)+vectorMarkup(ward.seal.front);marks.visible=true;return content;}));
 }
 const comparison=await nextFile('圆形护阵_Lv1至Lv4_镇妖阵对照图','png');
 await sharp({create:{width:1440,height:684,channels:4,background:'#192027'}}).composite(frames.map((input,i)=>({input,left:i*360,top:44})).concat([{input:Buffer.from('<svg width="1440" height="44"><style>text{font:22px sans-serif;fill:#e7ba68}</style><text x="140" y="30">Lv1</text><text x="500" y="30">Lv2</text><text x="860" y="30">Lv3</text><text x="1220" y="30">Lv4</text></svg>'),left:0,top:0}])).png().toFile(comparison);saved.push(comparison);
 const designFolder='assets/vfx/circle_lv5/交互图片/生成设计图';await mkdir(designFolder,{recursive:true});
 const header='<style>text{font-family:Microsoft YaHei,sans-serif;fill:#ffeaca}</style>';
 const designs=[['圆形护阵_Lv4_四门封妖矢量实机导出',`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="850" viewBox="0 0 800 850">${header}<rect width="800" height="850" fill="#192027"/><text x="400" y="51" text-anchor="middle" font-size="28">Lv4 · 四门封妖阵</text><g transform="translate(400 420)">${vectors[3]}</g><text x="400" y="813" text-anchor="middle" font-size="17">四门镇封 · 反向阵纹 · 内向符纸 · 破阵震荡</text></svg>`],['圆形护阵_Lv1至Lv4_镇妖阵矢量结构对照',`<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="690" viewBox="0 0 2400 690">${header}<rect width="2400" height="690" fill="#192027"/>${vectors.map((v,i)=>`<g transform="translate(${i*600} 0)"><text x="300" y="44" text-anchor="middle" font-size="28">Lv${i+1}</text><g transform="translate(300 348) scale(.78)">${v}</g></g>`).join('')}</svg>`]];
 for(const [stem,svg] of designs){const file=await nextFile(stem,'svg',designFolder),png=file.replace(/\.svg$/,'.png');await writeFile(file,svg);await sharp(Buffer.from(svg)).png().toFile(png);saved.push(file,png);}
 for(let level=1;level<=5;level++){
  const state=await page.evaluate(level=>{window.__CIRCLE_PREVIEW__.frame(level,level===5?3.2:.85,'ward');const {game,view}=window.__LINGHU__,s=game.skills[0],w=view.circles.wards.get(s.id);return {mode:s.circle.mode,shield:game.shield,phantom:!!w.grand?.fox,shadows:w.grand?.orbit?.shadows.length??0,seal:!!w.seal};},level);
  assert.equal(state.mode,level===5?'ultimate':'ward');assert.equal(state.shield,[20,35,50,80,120][level-1]);assert.equal(state.seal,false);assert.equal(state.phantom,level>=4);assert.equal(state.shadows,level===4?9:0);
 }
 const ultimate=await page.evaluate(()=>{window.__CIRCLE_PREVIEW__.frame(5,3.2,'seal');const s=window.__LINGHU__.game.skills[0];return {mode:s.circle.mode,x:s.x,y:s.y,cinematic:window.__LINGHU__.view.circles.cinematicStrength};});
 assert.deepEqual({mode:ultimate.mode,x:ultimate.x,y:ultimate.y},{mode:'ultimate',x:360,y:665});assert.ok(ultimate.cinematic>.9);
 // Real pointer input, not a prebuilt cast, must preserve circle center and ignore stroke size.
 await page.locator('input[name="level-circle"][value="4"]').check();
 const bounds=await page.locator('canvas').first().boundingBox();
 assert.ok(bounds);
 async function draw(cx,cy,r){
  await page.evaluate(()=>{const {game,view}=window.__LINGHU__;game.start();game.director.disabled=true;view.begin();});
  for(let i=0;i<=72;i++){const a=i/72*Math.PI*2,x=bounds.x+(cx+Math.cos(a)*r)/720*bounds.width,y=bounds.y+(cy+Math.sin(a)*r)/1280*bounds.height;if(i===0){await page.mouse.move(x,y);await page.mouse.down();}else await page.mouse.move(x,y);}
  await page.mouse.up();return page.evaluate(()=>{const {game,input}=window.__LINGHU__,s=game.skills.at(-1);return {valid:input.success,mode:s?.circle?.mode,radius:s?.radius,center:s?.geometry.center};});
 }
 for(const size of [40,100]){const state=await draw(500,300,size);assert.equal(state.valid,true);assert.equal(state.mode,'seal');assert.equal(state.radius,320);assert.ok(Math.abs(state.center.x-500)<2&&Math.abs(state.center.y-300)<2);}
 assert.equal((await draw(360,665,50)).mode,'ward');
 await page.evaluate(()=>{window.__LINGHU__.game.practice=false;window.__CIRCLE_PREVIEW__.frame(4,0,'seal');});
 const motion=[];let height;
 for(let i=0;i<=30;i++){
  await page.evaluate(target=>{const {game,view,input,app}=window.__LINGHU__;while(game.time+1e-8<target){const dt=Math.min(1/120,target-game.time);game.update(dt);for(const event of game.drain())view.event(event);view.update(game,input,dt,60);}view.update(game,input,0,60);app.render();},i*.2);
  const {data,info}=await sharp(await page.locator('#app').screenshot()).resize({width:360}).ensureAlpha().raw().toBuffer({resolveWithObject:true});height=info.height;motion.push(data);
 }
 assert.equal(await page.evaluate(()=>window.__LINGHU__.view.circles.wards.size),0);
 const gif=await nextFile('圆形护阵_Lv4_四门镇封与破阵动画','gif');await sharp(Buffer.concat(motion),{raw:{width:360,height:height*motion.length,channels:4,pageHeight:height}}).gif({delay:200,loop:0,effort:4}).toFile(gif);saved.push(gif);
 await page.evaluate(()=>window.__LINGHU__.app.ticker.start());await page.getByRole('button',{name:'镇妖阵 Lv4',exact:true}).click();await page.waitForTimeout(350);
 assert.ok(await page.evaluate(()=>window.__LINGHU__.game.skills[0]?.age>.1));
 await page.getByRole('button',{name:'冻结 / 播放圆阵',exact:true}).click();const age=await page.evaluate(()=>window.__LINGHU__.game.skills[0]?.age);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills[0]?.age),age);
 assert.deepEqual(errors,[]);
 console.log('PASS: four seal levels, four gates, localized DoT, no shield, unchanged five wards, unconditional Lv5, real hand circles, rupture cleanup, replay/freeze, no browser errors');
 console.log(JSON.stringify({saved},null,2));
}finally{await browser.close();}
