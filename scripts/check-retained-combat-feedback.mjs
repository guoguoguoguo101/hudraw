import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import sharp from 'sharp';
const dir='screenshots/retained-combat-feedback',baseline=process.env.LINGHU_FEEDBACK_BASELINE==='1';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],shots=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184'}/?qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
 await page.evaluate(()=>{const a=window.__LINGHU__;a.beginMountain(0);a.app.ticker.stop();a.game.enemies=[];a.game.hualing.frozen=true;a.game.drain();
  for(const [i,kind]of ['ink','crow','oni','ink'].entries()){const e=a.game.spawn(kind,{x:i===3?360:160+i*200,y:i===3?660:450});e.hp=e.maxHp=100;e.hit=0;if(i===3)e.mountain={...(e.mountain??{}),scale:1.3};}
  a.view.combatFeedback.clear();a.view.combatFeedback.update(a.game.enemies,0,true);
 });
 async function shot(name,dt=0){
  const result=await page.evaluate(async dt=>{const a=window.__LINGHU__,f=a.view.combatFeedback;f.update(a.game.enemies,dt,true);const Rectangle=a.app.screen.constructor,png=await a.app.renderer.extract.base64({target:f.root,frame:new Rectangle(0,0,720,900),resolution:1,clearColor:'#21343c'});return{png,health:[...f.health].map(([id,v])=>({id,...v})),numbers:f.numbers.map(n=>({text:n.label.text,age:n.age})),gl:a.app.renderer.gl.getError()};},dt);
  assert.equal(result.gl,0);const bytes=Buffer.from(result.png.split(',')[1],'base64'),path=`${dir}/${baseline?'before':'after'}-${name}.png`;await writeFile(path,bytes);
  if(!baseline){const expected=await sharp(await readFile(`${dir}/before-${name}.png`)).ensureAlpha().raw().toBuffer(),actual=await sharp(bytes).ensureAlpha().raw().toBuffer();assert.equal(actual.length,expected.length);let altered=0,total=0;for(let i=0;i<actual.length;i+=4){let change=0;for(let c=0;c<4;c++)change=Math.max(change,Math.abs(actual[i+c]-expected[i+c]));if(change>16)altered++;total++;}assert.ok(altered/total<.002,`${name}: unchanged bar styling must match its pre-change screenshot (${altered}/${total} changed pixels)`);result.changedPixels=altered;}
  delete result.png;shots.push({name,...result});return result;
 }
 await shot('full');await page.evaluate(()=>{for(const e of window.__LINGHU__.game.enemies){e.x+=11;e.y-=7;}});await shot('moved');
 await page.evaluate(()=>{const a=window.__LINGHU__;for(const [i,e]of a.game.enemies.entries()){const amount=[30,65,5,40][i];e.hp-=amount;e.hit=.2;a.view.combatFeedback.hit(e.x,e.y,amount,false,e.id,i===1);}});const damage=await shot('damage',.08);assert.ok(damage.health.every(h=>h.ratio>h.last));
 await shot('hold',.05);await page.evaluate(()=>{for(const e of window.__LINGHU__.game.enemies)e.hit=0;});await shot('trail',.3);const paused=await shot('paused');assert.deepEqual(paused.health,shots.at(-2).health);
 await page.evaluate(()=>{window.__LINGHU__.game.enemies[0].hp=90;window.__LINGHU__.game.enemies[1].hp=90;});const heal=await shot('healed',.1);assert.ok(heal.health.slice(0,2).every(h=>h.ratio>=h.last));
 await page.evaluate(()=>{window.__LINGHU__.game.enemies[2].mountain={scale:1.6};});await shot('rescaled',.1);
 await page.evaluate(()=>{window.__LINGHU__.game.enemies[0].hp=0;window.__LINGHU__.game.enemies.reverse();});await shot('death-and-reorder',1);
 const allocation=await page.evaluate(()=>{const a=window.__LINGHU__,f=a.view.combatFeedback;f.clear();a.game.enemies=[];const sample=a.game.spawn('ink',{x:80,y:280});a.game.enemies=Array.from({length:35},(_,i)=>({...sample,id:sample.id+1000+i,x:80+i%7*85,y:280+Math.floor(i/7)*95,hp:100,maxHp:100,hit:0}));f.update(a.game.enemies,0,true);
  let clears=0,shapes=0;const observed=[];function instrument(node){if(node.clear&&node.roundRect){const clear=node.clear,round=node.roundRect;node.clear=function(...args){clears++;return clear.apply(this,args);};node.roundRect=function(...args){shapes++;return round.apply(this,args);};observed.push({node,clear,round});}for(const c of node.children??[])instrument(c);}instrument(f.root);
  const ids=()=>{const out=[];function visit(n){out.push(n);for(const c of n.children??[])visit(c);}visit(f.root);return out;};const before=ids();for(let i=0;i<120;i++){for(const e of a.game.enemies){e.x+=.25;e.y+=.1;}f.update(a.game.enemies,1/60,true);}const after=ids(),stable=before.length===after.length&&before.every((n,i)=>n===after[i]);for(const o of observed){o.node.clear=o.clear;o.node.roundRect=o.round;}return{frames:120,enemies:35,clears,shapes,stable};});
 if(!baseline){assert.equal(allocation.clears,0);assert.equal(allocation.shapes,0);assert.equal(allocation.stable,true);}
 const cleanup=await page.evaluate(()=>{const a=window.__LINGHU__,f=a.view.combatFeedback,sample=a.game.enemies[0];for(let cycle=0;cycle<3;cycle++){f.clear();a.game.enemies=Array.from({length:160},(_,i)=>({...sample,id:10000+cycle*1000+i,x:100,y:300,hp:100,maxHp:100,hit:0}));f.update(a.game.enemies,0,true);}f.update([],0,false);const health=f.health.size,active=f.barRigs?.size??0,spare=f.barSpare?.length??0;for(let i=0;i<100;i++)f.update([],0,false);return{health,active,spare,children:f.bars.children?.length??0,gl:a.app.renderer.gl.getError()};});
 assert.equal(cleanup.health,0);assert.equal(cleanup.gl,0);if(!baseline){assert.equal(cleanup.active,0);assert.ok(cleanup.spare<=64&&cleanup.children<=64);}
 assert.deepEqual(errors,[]);await writeFile(`${dir}/${baseline?'before':'after'}-verification.json`,JSON.stringify({allocation,cleanup,shots,errors},null,2));
 console.log(`${baseline?'BASELINE':'PASS'} retained feedback: exact damage/healing trails, pause, scaling, deaths/order, bounded pool, moving 35-enemy geometry rebuild counts, screenshot equivalence and GL0`);
}finally{await browser.close();}
