import {chromium} from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const folder='screenshots/fox-character';await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:720,height:1280}}),frames=[];
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5182'}/?mode=hualing&qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.director.disabled=true;a.game.enemies=[];a.game.hualing.frozen=true;a.game.hualing.sceneSeal.phase='spent';a.game.hualing.journey.preview('sunset');a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;});
 for(const [mode,spell,label]of[['idle','slash','待机 · 好奇'],['attack','slash','攻击 · 挥爪'],['cast','dragon','放龙 · 腾起'],['enchant','petal','花符 · 欣喜'],['enchant','thunder','雷符 · 凝神'],['summon','summon','召唤 · 托举'],['hit','slash','受击 · 缩身'],['victory','slash','胜利 · 欢跃']]){
  await page.evaluate(({mode,spell})=>{const a=window.__LINGHU__;a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;a.view.fox.act(mode,0,spell);a.game.invulnerable=mode==='hit'?1:0;},{mode,spell});
  const caption=Buffer.from(`<svg width="420" height="58"><rect width="420" height="58" fill="#f1e4ca"/><text x="210" y="37" text-anchor="middle" font-family="KaiTi,serif" font-size="26" fill="#34342d">${label}</text></svg>`);
  for(let frame=0;frame<16;frame++){
   await page.evaluate(()=>{const a=window.__LINGHU__;for(let i=0;i<4;i++){a.game.hualing.clock+=1/60;a.view.update(a.game,a.input,1/60,60,1/60);}a.app.render();});
   const crop=await page.screenshot({clip:{x:250,y:545,width:210,height:210}});
   const raw=await sharp({create:{width:420,height:478,channels:4,background:'#f1e4ca'}}).composite([{input:await sharp(crop).resize(420,420).toBuffer(),top:0,left:0},{input:caption,top:420,left:0}]).raw().toBuffer();frames.push(raw);
  }
 }
 await sharp(Buffer.concat(frames),{raw:{width:420,height:478*frames.length,channels:4,pageHeight:478}}).gif({delay:67,loop:0,effort:3,colours:128}).toFile(`${folder}/fox-motion.gif`);
 console.log('Saved 128-frame actual renderer fox motion preview');
}finally{await browser.close();}
