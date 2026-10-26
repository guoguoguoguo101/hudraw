import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/ink-dragon';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],shots=[];
page.on('pageerror',e=>errors.push(e.message));
async function frame(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__;for(let t=0;t<seconds-1e-8;t+=1/60){const dt=Math.min(1/60,seconds-t);a.game.advance(dt,a.input.drawing);for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,dt,60,dt);}
 a.view.update(a.game,a.input,0,60,0);a.hualingUI.update(a.view.ui.footer.y);a.app.render();
 return{active:a.view.hualing.dragons.activeCount,gl:a.app.renderer.gl.getError(),age:a.game.hualing.effects[0]?.age??0};
},seconds);}
async function move(p){const pos=await page.evaluate(async p=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+p.x*v.scale,y:r.top+v.y+p.y*v.scale};},p);await page.mouse.move(pos.x,pos.y);}
async function shot(name){const state=await frame();assert.equal(state.gl,0);await page.screenshot({path:`${folder}/${name}.png`});shots.push({name,state});}
async function reset(){await page.evaluate(()=>{
 const a=window.__LINGHU__;a.input.cancel();a.game.hualing.reset();a.game.director.disabled=true;a.game.enemies=[];a.game.hualing.frozen=true;a.game.seedHualingEnemies();for(const e of a.game.enemies)e.speed=0;
 a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;a.hualingUI.reset();a.game.hualing.select('dragon');
});await frame();}
try{
 await page.goto(`${new URL(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173').origin}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 const route=Array.from({length:75},(_,i)=>({x:360+Math.sin(i/74*Math.PI*2)*158,y:830-i/74*460}));
 for(const [width,height] of [[390,844],[375,667],[430,932]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await reset();
  await move(route[0]);await page.mouse.down();for(let i=1;i<route.length;i++){await move(route[i]);if(i===50)await shot(`drawing-${width}`);}await page.mouse.up();
  assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualing.effects[0]?.kind),'dragon');
  await frame(.7);await shot(`growing-${width}`);await frame(.75);await shot(`full-${width}`);
  await page.evaluate(()=>window.__LINGHU__.game.pause());const age=(await frame()).age;await frame(.5);assert.equal((await frame()).age,age);await page.evaluate(()=>window.__LINGHU__.game.pause());
  await frame(.8);await shot(`fading-${width}`);await frame(1.1);assert.equal((await frame()).active,0);
 }
 await reset();await page.evaluate(()=>{const a=window.__LINGHU__;a.view.ui.low=true;a.game.hualing.demo();});await frame(1.2);await shot('low-quality');
 await reset();await page.evaluate(()=>{const a=window.__LINGHU__,m=a.game.hualing;m.handle({kind:'down',id:90,x:310,y:550});m.handle({kind:'up',id:90,x:380,y:550});});await frame(1.4);await shot('short-stroke');
 await reset();await page.evaluate(()=>{const m=window.__LINGHU__.game.hualing;for(let i=0;i<8;i++){m.select('dragon');m.demo();}});await frame(.5);assert.equal((await frame()).active,8);await frame(3);assert.equal((await frame()).active,0);
 const board=await page.evaluate(async()=>{
  const a=window.__LINGHU__,C=a.view.root.constructor,G=a.view.fx.constructor,{inkDragonHead}=await import('/src/rendering/ink-dragon.ts'),root=new C();root.addChild(new G().rect(0,0,720,470).fill(0x20332f));
  const S=a.view.fox.torso.constructor,art=new S(a.view.hualing.dragons.texture);art.anchor.set(.5);art.position.set(360,235);art.width=430;art.height=430;root.addChild(art);
  const out=await a.app.renderer.extract.base64({target:root,resolution:1});root.destroy({children:true});return out;
 });await writeFile(`${folder}/head-detail.png`,Buffer.from(board.split(',')[1],'base64'));
 await page.evaluate(()=>window.__LINGHU__.action('menu'));await frame();assert.deepEqual(errors,[]);
 await writeFile(`${folder}/verification.json`,JSON.stringify({shots,errors},null,2));
 console.log('PASS ink dragon: real curved stroke, preview/reveal/fade, 375/390/430, low quality, short stroke, pause, eight-effect pool and head detail');
}finally{await browser.close();}
