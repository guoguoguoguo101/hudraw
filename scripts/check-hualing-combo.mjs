import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/hualing-combo';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],shots=[];
page.on('pageerror',e=>errors.push(e.message));
const base=new URL(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173').origin;
async function move(x,y){const p=await page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});await page.mouse.move(p.x,p.y);}
async function frame(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__;for(let t=0;t<seconds-1e-8;t+=1/60)a.game.advance(Math.min(1/60,seconds-t),a.input.drawing);
 for(const e of a.game.drain())a.view.event(e);
 a.view.update(a.game,a.input,1/60,60,1/60);a.hualingUI.update(a.view.ui.footer.y);a.comboUI.update();a.app.render();
 const c=a.game.hualing.combo;return{count:c.count,remaining:c.remaining,stroke:c.strokeKills,result:c.result,time:c.time,active:c.strokeActive,visible:a.comboUI.root.visible,rect:(()=>{const r=a.comboUI.root.getBounds();return{x:r.x,y:r.y,width:r.width,height:r.height};})(),gl:a.app.renderer.gl.getError()};
},seconds);}
async function shot(name){const state=await frame();assert.equal(state.gl,0);await page.screenshot({path:`${folder}/${name}.png`});shots.push({name,state});}
async function reset(){return page.evaluate(()=>{
 const a=window.__LINGHU__;a.action('restart');a.app.ticker.stop();a.input.cancel();a.game.director.disabled=true;a.game.hualing.frozen=true;a.game.enemies=[];a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;
 const y=a.game.hualing.bounds.top+120;
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){const e=a.game.spawn('ink',{x:100+col*155,y:y+row*95});e.hp=1;e.speed=0;e.ai='Approach';}
 return y;
});}
try{
 await page.goto(`${base}/?mode=hualing&qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.comboUI);
 await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 for(const [width,height] of [[390,844],[375,667],[430,932]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const y=await reset();await frame();await move(55,y);await page.mouse.down();
  for(let row=0;row<3;row++){
   const xs=row%2?[565,410,255,100,55]:[100,255,410,565,620];
   if(row)await move(row%2?620:55,y+row*95);
   for(const x of xs){await move(x,y+row*95);await frame(.07);const count=(await frame()).count;if([3,5,8,12].includes(count)&&width===390)await shot(`tier-${count}`);}
  }
  let state=await frame();assert.equal(state.count,12);assert.equal(state.stroke,12);assert.equal(state.active,true);
  await page.mouse.up();await frame(.15);state=await frame();assert.equal(state.result.kills,12);assert.equal(state.active,false);assert.ok(state.result.seconds>0);await shot(`stroke-end-${width}`);
  assert.ok(state.rect.x>=0&&state.rect.x+state.rect.width<=720+2,'combo must fit phone width');
  await page.evaluate(()=>window.__LINGHU__.action('pause'));const before=await frame();await frame(3);assert.equal((await frame()).time,before.time);assert.equal((await frame()).visible,false);
  await page.evaluate(()=>window.__LINGHU__.action('resume'));await frame(2.01);assert.equal((await frame()).count,0);await shot(`chain-end-${width}`);
  await frame(3);await page.evaluate(()=>window.__LINGHU__.action('restart'));assert.equal((await frame()).result,null);
 }
 await page.evaluate(()=>window.__LINGHU__.action('interactionPractice'));assert.equal((await frame()).visible,false);
 // Use real audio contexts offline to check each milestone produces an ascending, audible cue.
 const audio=await page.evaluate(async()=>{
  const {Synth}=await import('/src/audio/synth.ts'),out=[];
  for(let tier=1;tier<=4;tier++){
   const c=new OfflineAudioContext(1,48000,48000),s=new Synth(()=>c),freqs=[];s.context=c;s.master=c.createGain();s.master.gain.value=.25;s.master.connect(c.destination);
   const create=c.createOscillator.bind(c);c.createOscillator=()=>{const o=create(),set=o.frequency.setValueAtTime.bind(o.frequency);o.frequency.setValueAtTime=(v,t)=>{freqs.push(v);return set(v,t);};return o;};
   s.play(`combo${tier}`);const b=await c.startRendering(),data=b.getChannelData(0);out.push({tier,first:freqs[0],peak:Math.max(...data.map(Math.abs))});
  }return out;
 });
 assert.ok(audio.every((x,i)=>x.peak>0&&x.peak<1&&(i===0||x.first>audio[i-1].first)));
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({shots,audio,errors},null,2));
 console.log('PASS combo browser: real pointer twelve kills, stroke timing, tiers, timeout, pause, restart, 375/390/430 bounds, old-mode isolation, ascending non-clipping audio');
}finally{await browser.close();}
