import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/dual-brush-paper-v02';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>{errors.push(e.message);console.log('pageerror',e.message);});
const base=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5177';
async function frame(dt=0){return page.evaluate(dt=>{const a=window.__LINGHU__;for(let t=0;t<dt-1e-8;t+=1/60)a.game.advance(Math.min(1/60,dt-t),a.input.drawing);for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,0,60,1/60);a.hualingUI.update(a.view.ui.footer.y,a.view.ui.hud.y);a.brushUpgradeUI.update(a.view.ui.hud.y);a.comboUI.update();a.app.render();const m=a.game.hualing.upgrades;return{level:m.levels.splash,panel:m.panel,sides:m.dual.sides.map(s=>({points:s.path.length,lunge:s.lunge?.targetId??null})),hp:a.game.enemies.map(e=>e.hp),gl:a.app.renderer.gl.getError()};},dt);}
async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.move(p.x,p.y);}
async function click(x,y){await move(x,y);await page.mouse.down();await page.mouse.up();await frame();}
try{
 await page.goto(`${base}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__?.brushUpgradeUI,null,{timeout:30000});console.log('game ready');
 await page.evaluate(()=>{const a=window.__LINGHU__;a.action('restart');a.app.ticker.stop();a.playUI.formal=false;a.game.director.disabled=true;a.game.hualing.frozen=true;});
 for(const [width,height] of [[390,844],[375,667],[430,932]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const b=await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.game.changeHualingChapter(innerWidth<380?'sea':innerWidth>420?'palace':'valley');a.brushUpgradeUI.compactUI=false;a.game.hualing.upgrades.panel='custom';return {...a.game.hualing.bounds};});await frame();
  const top=b.top+35;
  for(let level=1;level<=4;level++){console.log('checking',width,level);
   await page.evaluate(()=>{const a=window.__LINGHU__;a.game.hualing.upgrades.panel='custom';a.game.hualing.upgrades.reset();a.game.hualing.upgrades.panel='custom';});await frame();
   await click(268+level*82,top+124+2*82);assert.equal((await frame()).level,level);await click(560,top+459);assert.equal((await frame()).panel,null);
   const y=Math.min(b.bottom-150,b.top+240);
   await page.evaluate(y=>{const g=window.__LINGHU__.game;g.enemies=[];for(const p of [{x:430,y:y+80},{x:430,y:y-80},{x:240,y:y+48}]){const e=g.spawn('ink',p);e.hp=1000;e.speed=0;}},y);
   await move(170,y);await page.mouse.down();
   for(let i=1;i<=22;i++){await move(170+i*11,y+Math.sin(i/5)*18);await frame(.016);}
   const state=await frame();assert.equal(state.sides.length,level===1?1:2);assert.equal(state.gl,0);assert.ok(state.hp[2]<1000,'secondary follows real input and damages');
   if(level<4)assert.ok(state.sides.every(s=>s.lunge===null));
   else assert.ok(state.sides.some(s=>s.lunge!==null),'Lv4 actively lunges during real drag');
   await page.screenshot({path:`${folder}/lv${level}-${width}.png`});results.push({width,level,state});
   await page.mouse.up();await frame(.7);assert.ok((await frame()).sides.every(s=>!s.points&&!s.lunge));
  }
 }
 const performanceProof=await page.evaluate(()=>{
  const a=window.__LINGHU__,m=a.game.hualing.upgrades;m.setLevel('splash',4);m.begin();let last={x:330,y:600};const times=[];
  for(let i=0;i<220;i++){const next={x:330+Math.cos(i/25)*80,y:600+Math.sin(i/25)*45};m.trace(last,next);const start=performance.now();m.dual.advance(1/60,[],()=>{},a.game.hualing.bounds);a.view.brushUpgrades.dual.update(m.dual,true,false,a.game.hualing.bounds);if(i>40)times.push(performance.now()-start);last=next;}
  times.sort((a,b)=>a-b);return{scope:'desktop headless CPU: two companion models and native mesh skinning, excluding GPU',verticesPerDragon:a.view.brushUpgrades.dual.dragons[0].geometry.positions.length/2,medianMs:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)]};
 });
 // A magnified native-mesh proof for comparing facial/armor contours to B.
 await page.setViewportSize({width:720,height:1280});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await page.evaluate(async()=>{
  const a=window.__LINGHU__,Container=a.view.root.constructor,Graphics=a.view.brushUpgrades.dual.details.constructor,Text=a.view.ui.timer.constructor,PaperDragonActor=a.view.brushUpgrades.dual.dragons[0].constructor;
  const stage=new Container();stage.addChild(new Graphics().rect(0,0,720,1280).fill(0xe9ddc3));
  for(let i=0;i<2;i++){const d=new PaperDragonActor(i),path=Array.from({length:49},(_,k)=>({x:k/48*196,y:Math.sin(k/48*6.3)*7}));d.update(path,1,.8,i);d.root.scale.set(2.5);d.root.position.set(110,320+i*410);stage.addChild(d.root);}
  const label=new Text({text:'双毫 · 符甲纸龙\n原生矢量网格 · 龙首与纸甲细节',style:{fill:0x473828,fontSize:24,align:'center'}});label.anchor.set(.5);label.position.set(360,150);stage.addChild(label);a.view.root.removeChildren();a.view.root.addChild(stage);a.app.render();
 });
 await page.screenshot({path:`${folder}/native-vector-detail.png`});
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,performanceProof,errors},null,2));console.log('PASS browser: real level buttons, real pointer damage, Lv3 no seeking, Lv4 lunge, release cleanup, four levels at three phone sizes, no WebGL errors',performanceProof);
}finally{await browser.close();}
