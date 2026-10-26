import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/fox-response';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
async function frame(seconds=.1){return page.evaluate(seconds=>{
 const a=window.__LINGHU__;for(let t=0;t<seconds-1e-8;t+=1/60){a.game.advance(Math.min(1/60,seconds-t),a.input.drawing);a.view.update(a.game,a.input,1/60,60,1/60);}a.app.render();
 const f=a.view.fox;return{action:a.view.foxResponse.action,scale:f.root.scale.x,arm:f.left_arm.rotation,body:f.body.rotation,tail:f.restTails[0].rotation,x:f.root.x,y:f.root.y,gl:a.app.renderer.gl.getError()};
},seconds);}
async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.move(p.x,p.y);}
const results=[];
try{
 await page.goto(`${new URL(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173').origin}/?mode=hualing&qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.director.disabled=true;a.game.enemies=[];a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;});
 const idle=await frame();await move(200,510);await page.mouse.down();await move(120,480);const left=await frame(.2);assert.ok(left.scale<0);assert.ok(Math.abs(left.arm-idle.arm)>.2);assert.equal(left.x,360);assert.equal(left.y,665);await page.screenshot({path:`${folder}/brush-left.png`});
 await move(580,500);const right=await frame(.2);assert.ok(right.scale>0);await page.mouse.up();await frame(.5);results.push({idle,left,right});
 for(const kind of ['dragon']){
  await page.evaluate(kind=>{const a=window.__LINGHU__;a.input.cancel();a.game.hualing.reset();a.view.foxResponse.clear();a.game.hualing.select(kind);a.game.hualing.demo();},kind);
  const pose=await frame(.2);assert.equal(pose.action,kind);assert.equal(pose.gl,0);results.push({kind,pose});await page.screenshot({path:`${folder}/${kind}.png`});
 }
 await page.evaluate(()=>window.__LINGHU__.game.pause());const paused=await frame(.1);assert.deepEqual(await frame(.5),paused);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.menu();a.view.begin();});await frame(.1);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.foxResponse.root.visible),false);
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));
 console.log('PASS fox: real pointer direction, paw response, fixed world position, dragon cast, pause stability, menu cleanup and no WebGL errors');
}finally{await browser.close();}
