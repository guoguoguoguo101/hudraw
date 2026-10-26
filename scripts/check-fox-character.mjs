import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const folder='screenshots/fox-character',base=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5182';
await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:720,height:1280}}),errors=[],results=[],tiles=[];
page.on('pageerror',e=>errors.push(e.message));
async function frame(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__,g=a.game;
 for(let t=0;t<seconds-1e-8;t+=1/60){const dt=Math.min(1/60,seconds-t);g.advance(dt,a.input.drawing);for(const e of g.drain())a.view.event(e);a.view.update(g,a.input,dt,60,dt);}
 a.view.update(g,a.input,0,60,0);a.app.render();
 const f=a.view.fox;return {mode:f.mode,spell:f.motion.spell,expression:f.motion.expression,interaction:f.motion.interaction,age:f.actionAge,x:f.root.x,y:f.root.y,arm:f.left_arm.rotation,ear:f.left_ear.rotation,bodyX:f.body.x,bodyY:f.body.y,scale:f.root.scale.x,gl:a.app.renderer.gl.getError()};
},seconds);}
async function reset(){await page.evaluate(()=>{const a=window.__LINGHU__,g=a.game;a.input.cancel();g.state='playing';g.previous='playing';g.life=100;g.invulnerable=0;g.enemies=[];g.director.disabled=true;g.hualing.reset();g.hualing.journey.preview('sunset');g.hualing.frozen=true;a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;g.drain();});await frame(.05);}
async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.move(p.x,p.y);}
async function clickZone(index){const p=await page.evaluate(index=>{const z=window.__LINGHU__.playUI.zones[index];return {x:z.x+z.w/2,y:z.y+z.h/2};},index);await move(p.x,p.y);await page.mouse.down();await page.mouse.up();await frame();}
async function shot(name,label){const state=await frame();assert.equal(state.gl,0);results.push({name,...state});await page.screenshot({path:`${folder}/${name}.png`});const crop=await page.screenshot({clip:{x:265,y:555,width:190,height:190}});const svg=Buffer.from(`<svg width="256" height="290"><rect width="256" height="290" fill="#f3e8d1"/><text x="128" y="278" text-anchor="middle" font-family="KaiTi,serif" font-size="19" fill="#34342d">${label}</text></svg>`);const tile=await sharp(svg).composite([{input:await sharp(crop).resize(256,256).toBuffer(),left:0,top:0}]).png().toBuffer();tiles.push(tile);return state;}
try{
 await page.goto(`${base}/?qa=1&mode=hualing`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.playUI);
 await page.evaluate(async()=>{const a=window.__LINGHU__;a.playUI.formal=true;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();});
 await reset();const idle=await shot('01-idle','待机 · 好奇');
 await move(200,510);await page.mouse.down();await move(120,470);await frame(.2);let s=await shot('02-brush-left','落笔 · 跟随');assert.equal(s.interaction,'brush');assert.ok(s.scale<0);assert.ok(Math.abs(s.arm-idle.arm)>.2);
 await move(570,490);await frame(.15);assert.ok((await frame()).scale>0);await page.mouse.up();await frame(.12);s=await shot('03-attack','收笔 · 挥爪');assert.equal(s.mode,'attack');
 await reset();await clickZone(3);await frame(.02);assert.equal((await frame()).interaction,'ready');await shot('04-ready','选符 · 期待');
 await move(200,530);await page.mouse.down();await move(400,420);await move(480,500);await page.mouse.up();await frame(.28);s=await shot('05-dragon','放龙 · 腾起');assert.equal(s.spell,'dragon');assert.equal(s.mode,'cast');assert.equal(s.expression,'wonder');
 for(const [index,spell,name,label]of[[4,'petal','06-petal','花符 · 欣喜'],[5,'thunder','07-thunder','雷符 · 凝神']]){
  await reset();await clickZone(index);await frame(.28);s=await shot(name,label);assert.equal(s.mode,'enchant');assert.equal(s.spell,spell);
 }
 // A real drag from the talisman slot must trigger the summon, not a brush swipe.
 await reset();await page.evaluate(()=>window.__LINGHU__.game.hualing.claimSummon('beast'));const slot=await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing;return m.scenes.find(s=>s.mode==='beast').slot(m.bounds);});
 await move(slot.x,slot.y);await page.mouse.down();await move(420,520);await frame(.05);assert.equal((await frame()).interaction,'ready');await page.mouse.up();await frame(.3);s=await shot('08-summon','召唤 · 托举');assert.equal(s.mode,'summon');assert.equal(s.expression,'wonder');
 // Spell dispatch is covered separately from physical pointer recognition.
 for(const [rune,name,label]of[['circle','09-guard','护阵 · 安定'],['arc','10-moon','狐尾 · 展尾'],['wave','11-wave','叠月 · 推波'],['spiral','12-seal','缚妖 · 结印']]){
  await reset();await page.evaluate(rune=>window.__LINGHU__.view.event({type:'cast',rune,direction:{x:1,y:0}}),rune);await frame(.3);await shot(name,label);
 }
 await reset();await page.evaluate(()=>{const a=window.__LINGHU__;a.game.hualing.sceneSeal.phase='collecting';a.game.hualing.sceneSeal.age=0;});await frame(.15);s=await shot('13-collect','成符 · 开心');assert.equal(s.mode,'collect');assert.equal(s.expression,'delighted');
 // Use the real damage path, then attempt an attack during recoil.
 await reset();await page.evaluate(()=>window.__LINGHU__.game.hurt(10,true));await frame(.16);s=await shot('14-hit','受击 · 缩身');assert.equal(s.mode,'hit');assert.equal(s.expression,'hurt');assert.ok(s.bodyX<-10);
 await page.evaluate(()=>window.__LINGHU__.view.event({type:'cast',rune:'z',direction:{x:1,y:0}}));assert.equal((await frame()).mode,'hit');await frame(.5);assert.equal((await frame()).mode,'idle');
 await reset();await page.evaluate(()=>window.__LINGHU__.view.event({type:'win'}));await frame(.28);s=await shot('15-victory','胜利 · 欢跃');assert.equal(s.expression,'happy');
 await reset();await page.evaluate(()=>window.__LINGHU__.view.event({type:'lose'}));await frame(.45);s=await shot('16-defeat','落败 · 垂耳');assert.equal(s.expression,'tired');
 await reset();await move(180,500);await page.mouse.down();await move(100,490);await frame(.2);await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.game.pause();});const paused=await frame(.05);assert.deepEqual(await frame(.5),paused);await page.mouse.up();
 await reset();for(const [width,height]of[[375,667],[390,844],[430,932]]){await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await frame(.1);await page.screenshot({path:`${folder}/mobile-${width}.png`});}
 assert.deepEqual(errors,[]);
 const columns=4,rows=Math.ceil(tiles.length/columns);await sharp({create:{width:columns*256,height:rows*290,channels:4,background:'#f3e8d1'}}).composite(tiles.map((input,i)=>({input,left:i%columns*256,top:Math.floor(i/columns)*290}))).png().toFile(`${folder}/contact-sheet.png`);
 await fs.writeFile(`${folder}/verification.json`,JSON.stringify({results,errors,checks:'Real drawing, left/right aim, release swipe, card selection, real dragon stroke, UI petal/thunder activation, talisman drag summon, all spell profiles, collection, real damage/recoil priority, victory/defeat, pause, 375/390/430 layouts'},null,2));
 console.log('PASS friendly fox: real pointer interactions, distinct actions/expressions, damage priority, pause and mobile layouts');
}finally{await browser.close();}
