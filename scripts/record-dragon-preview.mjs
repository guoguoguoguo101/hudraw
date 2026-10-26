import {chromium} from '@playwright/test';
import {mkdir,copyFile} from 'node:fs/promises';
const folder='screenshots/ink-dragon-v2';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:430,height:932},recordVideo:{dir:folder,size:{width:430,height:932}}});
const page=await context.newPage();
try{
 await page.goto(`${new URL(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173').origin}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.director.disabled=true;a.input.cancel();a.game.hualing.reset();a.game.hualing.frozen=true;a.game.enemies=[];a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;
  for(const [x,y] of [[170,420],[530,440],[150,620],[550,680]]){const e=a.game.spawn('ink',{x,y});e.hp=e.maxHp=10000;e.speed=0;e.ai='Approach';}
  a.game.hualing.select('dragon');a.game.hualing.demo();a.app.ticker.start();
 });
 await page.waitForTimeout(700);await page.screenshot({path:`${folder}/swimming.png`});await page.waitForTimeout(1600);await page.screenshot({path:`${folder}/leaving.png`});await page.waitForTimeout(1400);
 await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing;m.select('dragon');const path=Array.from({length:55},(_,i)=>({x:180+i*6,y:650-120*Math.sin(i/54*Math.PI)}));m.handle({kind:'down',id:95,...path[0]});for(const p of path)m.handle({kind:'move',id:95,...p});m.handle({kind:'up',id:95,...path.at(-1)});});
 await page.waitForTimeout(3500);
 await context.close();const source=await page.video().path();await copyFile(source,`${folder}/dragon-swim-v2.webm`);
 console.log(`Saved ${folder}/dragon-swim-v2.webm`);
}finally{await browser.close();}
