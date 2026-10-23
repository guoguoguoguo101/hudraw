import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/paper-monsters';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:430,height:932}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+v.x+x*v.width/720,y:r.top+v.y+y*v.height/1280};},{x,y});}
async function click(x,y){const p=await point(x,y);await page.mouse.click(p.x,p.y);}
async function step(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__;for(let t=0;t<seconds-1e-8;t+=1/60){const dt=Math.min(1/60,seconds-t);a.game.advance(dt);a.input.update(dt);for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,dt,60,dt);}
 a.view.update(a.game,a.input,0,60,0);a.hualingUI.update(a.view.ui.footer.y);a.app.render();
 return {looks:a.game.enemies.map(e=>e.look),enemies:a.game.enemies.map(e=>({id:e.id,hp:e.hp,kind:e.kind,look:e.look})),frozen:a.game.hualing.frozen,gl:a.app.renderer.gl?.getError()??0};
 },seconds);}
async function reset(){await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.game.start(false,true,false,false,true);a.game.director.disabled=true;a.game.seedHualingEnemies();a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;a.view.ui.show(a.game.state,a.game);a.hualingUI.reset();});await step();}
async function shot(name){const s=await step();assert.equal(s.gl,0);results.push({name,...s});await page.screenshot({path:`${folder}/${name}.png`});}
try{
 await page.goto(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5175/?mode=hualing&qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const [width,height] of [[430,932],[375,667],[390,844]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await reset();
  const initial=await step();assert.equal(new Set(initial.looks).size,6);assert.ok(initial.enemies.every(e=>e.kind==='ink'||e.kind==='crow'));await shot(`mixed-${width}`);
  await step(1.4);await shot(`moving-${width}`);
  const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);await click(603,1228+footer);assert.equal((await step()).frozen,true);await shot(`frozen-${width}`);
  const before=await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>[e.x,e.y]));await step(.5);assert.deepEqual(await page.evaluate(()=>window.__LINGHU__.game.enemies.map(e=>[e.x,e.y])),before);
  // Use an ordinary real stroke through the seeded first row, after a fresh reset.
  await reset();await click(603,1228+footer);const row=await page.evaluate(()=>window.__LINGHU__.game.hualing.bounds.top+95),old=(await step()).enemies;
  const p=await point(55,row);await page.mouse.move(p.x,p.y);await page.mouse.down();for(const x of [150,250,350,450,550,660]){const q=await point(x,row);await page.mouse.move(q.x,q.y);}await page.mouse.up();await step(.45);
  const after=await step();assert.ok(old.some(e=>!after.enemies.some(n=>n.id===e.id)||after.enemies.find(n=>n.id===e.id).hp<e.hp));await shot(`hit-${width}`);
 }
 // Appearance-aware pooling must remain bounded across resets and switching back to legacy art.
 const poolCounts=[];for(let i=0;i<5;i++){await reset();poolCounts.push(await page.evaluate(()=>window.__LINGHU__.view.actors.children.length));}
 assert.equal(poolCounts.at(-1),poolCounts.at(-2));
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.start(false,true);a.game.director.disabled=true;a.game.spawn('ink',{x:250,y:400});a.game.spawn('crow',{x:500,y:400});});await step();assert.ok((await step()).looks.every(x=>x===undefined));
 await reset();
 // Export an enlarged art sheet from the exact same articulated game models.
 const data=await page.evaluate(async()=>{
  const a=window.__LINGHU__,Container=a.view.root.constructor,Graphics=a.view.fx.constructor,Text=a.view.ui.title.constructor,{PaperMonsterRig}=await import('/src/rendering/paper-monsters.ts'),{PAPER_MONSTERS}=await import('/src/gameplay/paper-monsters.ts');
  const board=new Container();board.addChild(new Graphics().rect(0,0,900,1250).fill(0xf0dfbb));
  const text=(value,x,y,size,color=0x6f302a)=>{const t=new Text({text:value,style:{fontFamily:'"KaiTi","Microsoft YaHei",serif',fontSize:size,fill:color,letterSpacing:2}});t.anchor.set(.5);t.position.set(x,y);board.addChild(t);};
  text('山海纸妖',450,64,46);text('六种小怪 · 游戏模型放大展示',450,116,21,0x7e704f);
  const note=['振翅 · 纸翼剪纹','摇摆 · 灯褶与短足','单脚 · 独眼折伞','蹲跳 · 青纸山纹','爬行 · 黑白纸刺','跳动 · 残耳红面'];
  PAPER_MONSTERS.forEach((m,i)=>{
   const x=240+(i%2)*420,y=285+Math.floor(i/2)*350,rig=new PaperMonsterRig(m.id),sample=a.game.enemies.find(e=>e.look===m.id);
   rig.update({...sample,id:i+1,age:1.2,ai:'Approach',hit:0,stateAge:0},false);rig.root.position.set(x,y);rig.root.scale.set(1.65);board.addChild(rig.root);
   text(m.name,x,y+112,29);text(note[i],x,y+149,17,0x7e704f);
  });
  const trim=new Graphics();trim.moveTo(74,148).lineTo(826,148).moveTo(74,1209).lineTo(826,1209).stroke({color:0xb89657,width:1.4});board.addChild(trim);
  a.app.stage.removeChildren();a.app.stage.scale.set(1);a.app.stage.position.set(0,0);a.app.renderer.resize(900,1250);a.app.stage.addChild(board);a.app.render();return a.app.canvas.toDataURL('image/png');
 });
 await writeFile(`${folder}/art-sheet.png`,Buffer.from(data.split(',')[1],'base64'));
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,poolCounts,errors},null,2));
 console.log('PASS six paper monsters: three phone sizes, mixed spawning, animation/freeze, actual stroke damage, bounded appearance pools, legacy scene isolation, exported game-model art sheet; no page/WebGL errors');
}finally{await browser.close();}
